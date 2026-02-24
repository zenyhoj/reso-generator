"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"
import { ResolutionFormValues } from "@/types/schema"
import { LivePreview } from "@/components/live-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Check, X, Trash2, ShieldCheck, FileUp, Download, Loader2 } from "lucide-react"

interface ResolutionReviewClientProps {
    resolutionId: string
    resolutionStatus: string
    isOwner: boolean
    canManage: boolean
    initialData: ResolutionFormValues
    orgSettings?: {
        water_district_name?: string
        address?: string
        logo_url?: string
        water_district_email?: string
        water_district_contact?: string
    }
    signedPdfUrl?: string | null
}

interface Proposal {
    id: string
    user_id: string
    section: "whereas" | "resolved"
    clause_index: number
    original_text: string
    suggested_text: string
    note: string | null
    status: "pending" | "accepted" | "rejected"
    created_at: string
}

function proposalKey(section: "whereas" | "resolved", index: number) {
    return `${section}-${index}`
}

export function ResolutionReviewClient({
    resolutionId,
    resolutionStatus,
    isOwner,
    canManage,
    initialData,
    orgSettings,
    signedPdfUrl,
}: ResolutionReviewClientProps) {
    const [suggestions, setSuggestions] = useState<Record<string, string>>({})
    const [notes, setNotes] = useState<Record<string, string>>({})
    const [isSubmittingKey, setIsSubmittingKey] = useState<string | null>(null)
    const [proposals, setProposals] = useState<Proposal[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [actingId, setActingId] = useState<string | null>(null)

    // Digital Signature States
    const [isUploadingSignature, setIsUploadingSignature] = useState(false)
    const [currentSignedPdf, setCurrentSignedPdf] = useState<string | null>(signedPdfUrl || null)

    const isFinal = resolutionStatus === "final"

    useEffect(() => {
        const init = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setCurrentUserId(user.id)

            const { data, error } = await supabase
                .from("resolution_wording_proposals")
                .select("*")
                .eq("resolution_id", resolutionId)
                .order("created_at", { ascending: false })

            if (!error && data) {
                setProposals(data as Proposal[])
            }
        }
        init()
    }, [resolutionId])

    const clauses = useMemo(() => {
        const whereas = (initialData.whereasClauses || []).map((text, index) => ({
            section: "whereas" as const,
            index,
            text,
            label: `WHEREAS ${index + 1}`,
        }))

        const resolved = (initialData.resolvedClauses || []).map((text, index) => ({
            section: "resolved" as const,
            index,
            text,
            label: `RESOLVED ${index + 1}`,
        }))

        return [...whereas, ...resolved]
    }, [initialData])

    const submitSuggestion = async (
        section: "whereas" | "resolved",
        index: number,
        originalText: string
    ) => {
        const key = proposalKey(section, index)
        const suggestedText = (suggestions[key] || "").trim()
        const note = (notes[key] || "").trim()

        if (!suggestedText) {
            toast.error("Please enter your suggested wording.")
            return
        }

        setIsSubmittingKey(key)
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error("You must be logged in to propose a change.")
                return
            }

            const { data, error } = await supabase
                .from("resolution_wording_proposals")
                .insert({
                    resolution_id: resolutionId,
                    user_id: user.id,
                    section,
                    clause_index: index,
                    original_text: originalText,
                    suggested_text: suggestedText,
                    note: note || null,
                })
                .select()
                .single()

            if (error) throw error

            if (data) {
                setProposals((prev) => [data as Proposal, ...prev])
            }

            setSuggestions((prev) => ({ ...prev, [key]: "" }))
            setNotes((prev) => ({ ...prev, [key]: "" }))
            toast.success("Suggestion submitted.")
        } catch (error: any) {
            toast.error(error.message || "Failed to submit suggestion.")
        } finally {
            setIsSubmittingKey(null)
        }
    }

    const updateProposalStatus = async (proposalId: string, newStatus: "accepted" | "rejected") => {
        setActingId(proposalId)
        const supabase = createClient()
        try {
            const { error } = await supabase
                .from("resolution_wording_proposals")
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq("id", proposalId)

            if (error) throw error

            setProposals((prev) =>
                prev.map((p) => (p.id === proposalId ? { ...p, status: newStatus } : p))
            )
            toast.success(`Proposal ${newStatus}.`)
        } catch (error: any) {
            toast.error(error.message || "Failed to update proposal.")
        } finally {
            setActingId(null)
        }
    }

    const deleteProposal = async (proposalId: string) => {
        setActingId(proposalId)
        const supabase = createClient()
        try {
            const { error } = await supabase
                .from("resolution_wording_proposals")
                .delete()
                .eq("id", proposalId)

            if (error) throw error

            setProposals((prev) => prev.filter((p) => p.id !== proposalId))
            toast.success("Proposal retracted.")
        } catch (error: any) {
            toast.error(error.message || "Failed to retract proposal.")
        } finally {
            setActingId(null)
        }
    }

    const statusVariant: Record<Proposal["status"], "secondary" | "outline" | "destructive"> = {
        pending: "secondary",
        accepted: "outline",
        rejected: "destructive",
    }

    const handleSignedPdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file.")
            return
        }

        setIsUploadingSignature(true)
        const toastId = toast.loading("Uploading signed resolution...")

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${resolutionId}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('signed-resolutions')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('signed-resolutions')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('resolutions')
                .update({ signed_pdf_url: publicUrl })
                .eq('id', resolutionId)

            if (updateError) throw updateError

            setCurrentSignedPdf(publicUrl)
            toast.success("Signed resolution uploaded successfully!", { id: toastId })
        } catch (error: any) {
            console.error("Upload failed", error)
            toast.error(`Upload failed: ${error.message}`, { id: toastId })
        } finally {
            setIsUploadingSignature(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-tight">Review Draft Resolution</h1>
                    <p className="text-muted-foreground">
                        {isFinal
                            ? "This resolution has been finalised. No further suggestions can be submitted."
                            : "Review the draft and propose wording changes for specific clauses."}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                        <Badge variant={resolutionStatus === "draft" ? "secondary" : "outline"}>
                            {resolutionStatus}
                        </Badge>
                        {isOwner && (
                            <Badge variant="outline" className="text-indigo-600 border-indigo-300">
                                Owner
                            </Badge>
                        )}
                        {canManage && !isOwner && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                Collaborator
                            </Badge>
                        )}
                    </div>
                </div>
                <Link href="/dashboard">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
                <div className="bg-slate-200 dark:bg-slate-800 rounded-lg p-6 overflow-auto">
                    <LivePreview data={initialData} orgSettings={orgSettings} />
                </div>

                <div className="space-y-4">
                    {/* Digital Signature Management */}
                    {(canManage || isFinal) && (
                        <Card className="border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/50 dark:bg-indigo-900/10">
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    <CardTitle className="text-base text-indigo-900 dark:text-indigo-200">Digital Signature Workflow</CardTitle>
                                </div>
                                <CardDescription>
                                    Download the unsigned PDF, sign it locally using your DICT .p12 certificate in Adobe Acrobat, and upload the signed version back here.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {currentSignedPdf ? (
                                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-md border border-green-200 dark:border-green-900">
                                        <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-500 font-medium">
                                            <Check className="w-4 h-4" /> Signed PDF Uploaded
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" asChild>
                                                <a href={currentSignedPdf} target="_blank" rel="noopener noreferrer">
                                                    View Signed PDF
                                                </a>
                                            </Button>
                                            {canManage && (
                                                <div className="relative">
                                                    <Button variant="ghost" size="sm" disabled={isUploadingSignature} className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                                        {isUploadingSignature ? <Loader2 className="w-4 h-4 animate-spin" /> : "Re-upload"}
                                                    </Button>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={handleSignedPdfUpload}
                                                        disabled={isUploadingSignature}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-md border border-amber-200 dark:border-amber-900">
                                            <span className="text-sm font-medium text-amber-700 dark:text-amber-500">
                                                No signed PDF uploaded yet.
                                            </span>
                                        </div>
                                        {canManage && (
                                            <div className="flex gap-2 w-full">
                                                <Button variant="outline" onClick={() => window.print()} className="flex-1 gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                                    <Download className="w-4 h-4" /> 1. Download Unsigned PDF
                                                </Button>
                                                <div className="relative flex-1">
                                                    <Button className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700" disabled={isUploadingSignature}>
                                                        {isUploadingSignature ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                                                        2. Upload Signed PDF
                                                    </Button>
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={handleSignedPdfUpload}
                                                        disabled={isUploadingSignature}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Suggestion forms — hidden for owners/collaborators and for finalised resolutions */}
                    {!canManage && !isFinal && clauses.map((clause) => {
                        const key = proposalKey(clause.section, clause.index)
                        return (
                            <Card key={key}>
                                <CardHeader>
                                    <CardTitle className="text-base">{clause.label}</CardTitle>
                                    <CardDescription>{clause.text || "(No text)"}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Textarea
                                        placeholder="Propose revised wording"
                                        value={suggestions[key] || ""}
                                        onChange={(e) =>
                                            setSuggestions((prev) => ({
                                                ...prev,
                                                [key]: e.target.value,
                                            }))
                                        }
                                        rows={4}
                                    />
                                    <Textarea
                                        placeholder="Optional note (reason for change)"
                                        value={notes[key] || ""}
                                        onChange={(e) =>
                                            setNotes((prev) => ({
                                                ...prev,
                                                [key]: e.target.value,
                                            }))
                                        }
                                        rows={2}
                                    />
                                    <Button
                                        className="gap-2"
                                        onClick={() => submitSuggestion(clause.section, clause.index, clause.text)}
                                        disabled={isSubmittingKey === key}
                                    >
                                        <Send className="h-4 w-4" />
                                        {isSubmittingKey === key ? "Submitting..." : "Submit Suggestion"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}

                    {/* Proposals list */}
                    {proposals.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {canManage ? "Wording Suggestions" : "Submitted Suggestions"}
                                </CardTitle>
                                {canManage && (
                                    <CardDescription>
                                        Review and accept or reject each suggestion below.
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {proposals.map((proposal) => (
                                    <div key={proposal.id} className="rounded-md border p-3 space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                                {proposal.section} #{proposal.clause_index + 1}
                                            </p>
                                            <Badge variant={statusVariant[proposal.status]}>
                                                {proposal.status}
                                            </Badge>
                                        </div>

                                        <p className="text-sm">{proposal.suggested_text}</p>

                                        {proposal.note && (
                                            <p className="text-xs text-muted-foreground italic">
                                                Note: {proposal.note}
                                            </p>
                                        )}

                                        {/* Managers: accept / reject */}
                                        {canManage && proposal.status === "pending" && (
                                            <div className="flex gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 text-green-700 border-green-300 hover:bg-green-50"
                                                    onClick={() => updateProposalStatus(proposal.id, "accepted")}
                                                    disabled={actingId === proposal.id}
                                                >
                                                    <Check className="h-3 w-3" /> Accept
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-1 text-red-700 border-red-300 hover:bg-red-50"
                                                    onClick={() => updateProposalStatus(proposal.id, "rejected")}
                                                    disabled={actingId === proposal.id}
                                                >
                                                    <X className="h-3 w-3" /> Reject
                                                </Button>
                                            </div>
                                        )}

                                        {/* Submitter: retract their own pending proposal */}
                                        {!canManage &&
                                            proposal.status === "pending" &&
                                            proposal.user_id === currentUserId && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="gap-1 text-muted-foreground hover:text-red-600"
                                                    onClick={() => deleteProposal(proposal.id)}
                                                    disabled={actingId === proposal.id}
                                                >
                                                    <Trash2 className="h-3 w-3" /> Retract
                                                </Button>
                                            )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {proposals.length === 0 && (canManage || isFinal) && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No suggestions have been submitted yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
