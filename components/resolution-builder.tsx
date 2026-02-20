
"use client"

import { useState, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { resolutionSchema, type ResolutionFormValues } from "@/types/schema"
import { ResolutionForm } from "@/components/resolution-form"
import { LivePreview } from "@/components/live-preview"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Sparkles, Save, Printer, Loader2 } from "lucide-react"
import Link from 'next/link'

interface ResolutionBuilderProps {
    initialData?: ResolutionFormValues & { id?: string }
}

export function ResolutionBuilder({ initialData }: ResolutionBuilderProps) {
    const form = useForm<ResolutionFormValues>({
        resolver: zodResolver(resolutionSchema),
        defaultValues: initialData || {
            title: "",
            description: "",
            resolutionNumber: "",
            seriesYear: new Date().getFullYear(),
            heldOn: "",
            approvedOn: "",
            whereasClauses: [""],
            resolvedClauses: [""],
            signatories: [],
        },
        mode: "onChange"
    })

    const [officials, setOfficials] = useState<string[]>([])
    const [orgSettings, setOrgSettings] = useState<{
        water_district_name?: string,
        address?: string,
        logo_url?: string,
        water_district_email?: string,
        water_district_contact?: string
    }>({})

    const handleSyncSignatories = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single()

        if (profile) {
            const newSignatories = []
            if (profile.bod_chairman) newSignatories.push({ name: profile.bod_chairman, position: "BOD Chairman", role: "chairman", signatureUrl: profile.bod_chairman_sig_url })
            if (profile.bod_vice_chairman) newSignatories.push({ name: profile.bod_vice_chairman, position: "BOD Vice-Chairman", role: "vice-chairman", signatureUrl: profile.bod_vice_chairman_sig_url })
            if (profile.bod_secretary) {
                newSignatories.push({ name: profile.bod_secretary, position: "BOD Secretary", role: "secretary", signatureUrl: profile.bod_secretary_sig_url })
            } else if (profile.full_name) {
                newSignatories.push({ name: profile.full_name, position: "BAC Secretariat", role: "secretary", signatureUrl: profile.signature_url })
            }
            if (profile.bod_member_1) newSignatories.push({ name: profile.bod_member_1, position: "BOD Member", role: "member", signatureUrl: profile.bod_member_1_sig_url })
            if (profile.bod_member_2) newSignatories.push({ name: profile.bod_member_2, position: "BOD Member", role: "member", signatureUrl: profile.bod_member_2_sig_url })
            if (profile.bod_member_3) newSignatories.push({ name: profile.bod_member_3, position: "BOD Member", role: "member", signatureUrl: profile.bod_member_3_sig_url })
            if (profile.general_manager) newSignatories.push({ name: profile.general_manager, position: "General Manager", role: "gm", signatureUrl: profile.general_manager_sig_url })

            if (newSignatories.length > 0) {
                form.setValue("signatories", newSignatories as any)
                toast.success("Signatories updated from settings!")
            }
        }
    }

    // Fetch Organization Settings
    useEffect(() => {
        async function loadOrgSettings() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single()

            if (profile) {
                setOrgSettings({
                    water_district_name: profile.water_district_name,
                    address: profile.address,
                    logo_url: profile.logo_url,
                    water_district_email: profile.water_district_email,
                    water_district_contact: profile.water_district_contact
                })

                const potentialMovants = [
                    profile.bod_chairman,
                    profile.bod_vice_chairman,
                    profile.bod_secretary,
                    profile.bod_member_1,
                    profile.bod_member_2,
                    profile.bod_member_3,
                    profile.general_manager
                ].filter((name): name is string => !!name && name.trim().length > 0)
                setOfficials(potentialMovants)

                if (form.getValues("signatories").length === 0) {
                    const newSignatories = []
                    if (profile.bod_chairman) newSignatories.push({ name: profile.bod_chairman, position: "BOD Chairman", role: "chairman", signatureUrl: profile.bod_chairman_sig_url })
                    if (profile.bod_vice_chairman) newSignatories.push({ name: profile.bod_vice_chairman, position: "BOD Vice-Chairman", role: "vice-chairman", signatureUrl: profile.bod_vice_chairman_sig_url })
                    if (profile.bod_secretary) {
                        newSignatories.push({ name: profile.bod_secretary, position: "BOD Secretary", role: "secretary", signatureUrl: profile.bod_secretary_sig_url })
                    } else if (profile.full_name) {
                        newSignatories.push({ name: profile.full_name, position: "BAC Secretariat", role: "secretary", signatureUrl: profile.signature_url })
                    }
                    if (profile.bod_member_1) newSignatories.push({ name: profile.bod_member_1, position: "BOD Member", role: "member", signatureUrl: profile.bod_member_1_sig_url })
                    if (profile.bod_member_2) newSignatories.push({ name: profile.bod_member_2, position: "BOD Member", role: "member", signatureUrl: profile.bod_member_2_sig_url })
                    if (profile.bod_member_3) newSignatories.push({ name: profile.bod_member_3, position: "BOD Member", role: "member", signatureUrl: profile.bod_member_3_sig_url })
                    if (profile.general_manager) newSignatories.push({ name: profile.general_manager, position: "General Manager", role: "gm", signatureUrl: profile.general_manager_sig_url })

                    if (newSignatories.length > 0) {
                        form.setValue("signatories", newSignatories as any)
                    }
                }
            }
        }
        loadOrgSettings()
    }, [form])

    // Watch form values for live preview
    const values = form.watch()

    const [isGenerating, setIsGenerating] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [aiPrompt, setAiPrompt] = useState("")
    const [showAiDialog, setShowAiDialog] = useState(false)
    const previewRef = useRef<HTMLDivElement>(null)

    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return

        setIsGenerating(true)
        const toastId = toast.loading("Generating resolution...")

        try {
            const supabase = createClient()

            // Construct context from settings
            let context = ""
            if (orgSettings.water_district_name) {
                context += `Water District Name: ${orgSettings.water_district_name}\n`
            }
            if (orgSettings.address) {
                context += `Address: ${orgSettings.address}\n`
            }

            const { data, error } = await supabase.functions.invoke('generate-resolution', {
                body: { prompt: aiPrompt, context: context.trim() }
            })

            if (error) throw error

            if (data) {
                if (data.title) form.setValue("title", data.title)
                if (data.description) form.setValue("description", data.description)
                if (data.resolutionNumber) form.setValue("resolutionNumber", data.resolutionNumber)
                if (data.seriesYear) form.setValue("seriesYear", data.seriesYear)
                if (data.whereasClauses) form.setValue("whereasClauses", data.whereasClauses)
                if (data.resolvedClauses) form.setValue("resolvedClauses", data.resolvedClauses)

                toast.success("Resolution generated!", { id: toastId })
                setShowAiDialog(false)
            }
        } catch (error: any) {
            console.error("AI Generation failed:", error)
            let errorMessage = error.message || "Unknown error";

            // Support for Supabase FunctionsHttpError
            if (error && typeof error === 'object' && 'context' in error) {
                try {
                    const errorBody = await error.context.json();
                    console.error("Detailed Error Body:", errorBody);
                    if (errorBody.error) {
                        errorMessage = errorBody.error;
                    }
                    if (errorBody.details) {
                        console.error("Error Details:", errorBody.details);
                    }
                } catch (e) {
                    // response cannot be parsed
                    console.error("Could not parse error context:", e);
                }
            }

            toast.error(`Generation failed: ${errorMessage}`, { id: toastId })
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const [isSaving, setIsSaving] = useState(false)
    const [resolutionId, setResolutionId] = useState<string | null>(initialData?.id || null)

    const handleSave = async () => {
        setIsSaving(true)
        const toastId = toast.loading("Saving draft...")
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("You must be logged in to save.", { id: toastId })
                return
            }

            const currentValues = form.getValues()

            const payload = {
                user_id: user.id,
                resolution_number: currentValues.resolutionNumber,
                series_year: currentValues.seriesYear,
                title: currentValues.title,
                description: currentValues.description || null,
                held_on: currentValues.heldOn || null,
                approved_on: currentValues.approvedOn || null,
                content: {
                    whereasClauses: currentValues.whereasClauses,
                    resolvedClauses: currentValues.resolvedClauses,
                    movant_name: currentValues.movant_name,
                    seconder_name: currentValues.seconder_name
                },
                signatories: currentValues.signatories,
                status: 'draft'
            }

            let error;
            let data;

            if (resolutionId) {
                // Update existing record
                const result = await supabase
                    .from('resolutions')
                    .update(payload)
                    .eq('id', resolutionId)
                    .select()
                    .single()
                error = result.error
                data = result.data
            } else {
                // Create new record (or upsert if matching number/year exists)
                const result = await supabase
                    .from('resolutions')
                    .upsert(payload, { onConflict: 'resolution_number, series_year, user_id' })
                    .select()
                    .single()
                error = result.error
                data = result.data
            }

            if (error) throw error

            if (data) {
                setResolutionId(data.id)
            }

            toast.success("Draft saved successfully!", { id: toastId })
        } catch (error: any) {
            console.error("Save failed:", error)
            toast.error(`Failed to save: ${error.message}`, { id: toastId })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            {/* Toolbar */}
            <div className="h-16 border-b bg-white dark:bg-slate-950 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-2 no-print">
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100">
                            &larr; Back to Dashboard
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <div className="bg-slate-900 text-white w-8 h-8 rounded-md flex items-center justify-center font-serif font-bold">
                        R
                    </div>
                    <div className="text-sm font-medium text-slate-500">
                        Drafting Mode
                    </div>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <Button variant="outline" onClick={() => setShowAiDialog(true)} className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                        <Sparkles className="w-4 h-4" /> Generate with AI
                    </Button>
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="w-4 h-4" /> Print
                    </Button>
                    <Button className="gap-2" onClick={handleSave} disabled={isSaving || isGenerating}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Draft
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Form */}
                <div className="w-1/2 border-r dark:border-slate-800 bg-white dark:bg-slate-950 overflow-y-auto p-8 scrollbar-thin no-print">
                    <div className="max-w-xl mx-auto">
                        <ResolutionForm form={form} onSyncSignatories={handleSyncSignatories} officials={officials} />
                    </div>
                </div>

                <div className="flex-1 bg-slate-200 dark:bg-slate-800 overflow-y-auto p-12 flex justify-center scrollbar-thin print:bg-white print:p-0 print:overflow-visible print:w-full">
                    <div ref={previewRef} className="print:m-0 print:shadow-none">
                        <LivePreview data={values} orgSettings={orgSettings} />
                    </div>
                </div>
            </div>

            {/* AI Dialog Overlay */}
            {showAiDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">Generate Resolution</h3>
                                <p className="text-sm text-slate-500 mt-1">Describe the resolution you need.</p>
                            </div>
                        </div>

                        <textarea
                            className="w-full border rounded-md p-3 text-sm h-32 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                            placeholder="e.g. A resolution authorizing the General Manager to sign the Memorandum of Agreement with the Local Government Unit regarding the watershed protection project..."
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            autoFocus
                        />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowAiDialog(false)}>Cancel</Button>
                            <Button onClick={handleGenerateAI} disabled={isGenerating || !aiPrompt.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                                {isGenerating ? "Drafting..." : "Generate Draft"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
