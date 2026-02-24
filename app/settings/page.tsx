
"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Trash2, Upload } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const signatorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    position: z.string().min(1, "Position is required"),
    role: z.string().min(1, "Role is required"),
    signature_url: z.string().optional(),
})

const settingsSchema = z.object({
    water_district_name: z.string().min(1, "Required"),
    water_district_email: z.string().email("Invalid email").optional().or(z.literal("")),
    water_district_contact: z.string().optional(),
    address: z.string().min(1, "Required"),
    logo_url: z.string().optional(),
    signatories: z.array(signatorySchema),
})

type SettingsValues = z.infer<typeof settingsSchema>

const BOD_ROLES = [
    { label: "BOD Chairman", value: "chairman" },
    { label: "BOD Vice-Chairman", value: "vice-chairman" },
    { label: "BOD Secretary", value: "secretary" },
    { label: "BOD Member", value: "member" },
    { label: "General Manager", value: "gm" },
]

const BOD_POSITIONS = [
    "BOD Chairman",
    "BOD Vice-Chairman",
    "BOD Secretary",
    "BOD Member",
    "General Manager",
    "BAC Chairman",
    "BAC Vice-Chairman",
    "BAC Member",
    "BAC Secretariat",
]

export default function SettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [supabase] = useState(() => createClient())
    const [user, setUser] = useState<any>(null)

    const form = useForm<SettingsValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            water_district_name: "",
            water_district_email: "",
            water_district_contact: "",
            address: "",
            logo_url: "",
            signatories: [],
        },
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "signatories",
    })

    useEffect(() => {
        async function loadSettings() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    window.location.href = "/login"
                    return
                }

                setUser(user)

                // 1. Get user profile for RBAC check
                let { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("role, status")
                    .eq("id", user.id)
                    .maybeSingle()

                if (profileError) throw profileError

                // --- RBAC CHECK ---
                if (!profile || (profile.role !== "admin" && profile.role !== "bod_secretary")) {
                    toast.error("You are not authorized to access this page.")
                    window.location.href = "/dashboard"
                    return
                }
                // ------------------

                // 2. Fetch organization settings
                let { data: settings, error: settingsError } = await supabase
                    .from("organization_settings")
                    .select("*")
                    .eq("id", 1)
                    .maybeSingle()

                if (settingsError) throw settingsError

                if (settings && !form.formState.isDirty) {
                    form.reset({
                        water_district_name: settings.water_district_name || "",
                        water_district_email: settings.water_district_email || "",
                        water_district_contact: settings.water_district_contact || "",
                        address: settings.address || "",
                        logo_url: settings.logo_url || "",
                        signatories: settings.signatories || [],
                    })
                }
            } catch (error: any) {
                console.error("Error loading settings:", error)
                toast.error("Failed to load settings.")
            } finally {
                setLoading(false)
            }
        }

        loadSettings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    const MAX_FILE_SIZE_MB = 2

    function validateImageFile(file: File): string | null {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return 'Only PNG, JPEG, WEBP, or SVG images are allowed.'
        }
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            return `File must be smaller than ${MAX_FILE_SIZE_MB}MB.`
        }
        return null
    }

    async function onUploadLogo(event: React.ChangeEvent<HTMLInputElement>) {
        if (!event.target.files || event.target.files.length === 0) return
        if (!user) return

        const file = event.target.files[0]
        const validationError = validateImageFile(file)
        if (validationError) {
            toast.error(validationError)
            event.target.value = ''
            return
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-logo-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        setSaving(true)
        try {
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath)

            form.setValue("logo_url", publicUrl, { shouldDirty: true })
            toast.success("Logo uploaded successfully!")
        } catch (error: any) {
            toast.error("Failed to upload logo.")
        } finally {
            setSaving(false)
        }
    }

    async function handleSignatureUpload(event: React.ChangeEvent<HTMLInputElement>, index: number) {
        if (!event.target.files || event.target.files.length === 0) return
        if (!user) return

        const file = event.target.files[0]
        const validationError = validateImageFile(file)
        if (validationError) {
            toast.error(validationError)
            event.target.value = ''
            return
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-sig-${index}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        setSaving(true)
        try {
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath)

            const currentSignatories = [...form.getValues("signatories")]
            currentSignatories[index].signature_url = publicUrl
            form.setValue("signatories", currentSignatories, { shouldDirty: true })

            toast.success("Signature uploaded successfully!")
        } catch (error: any) {
            toast.error("Failed to upload signature.")
        } finally {
            setSaving(false)
        }
    }

    async function onSubmit(data: SettingsValues) {
        if (!user) return
        setSaving(true)
        try {
            const { error } = await supabase
                .from("organization_settings")
                .upsert({
                    id: 1,
                    admin_id: user.id, // Set the admin who updated this
                    ...data,
                    updated_at: new Date().toISOString(),
                })

            if (error) throw error

            toast.success("Organization details updated successfully.")
        } catch (error: any) {
            console.error("Error saving settings:", error)
            toast.error(error.message || "Failed to save settings.")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            <MainNav />
            <div className="max-w-5xl mx-auto py-8 px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
                        <p className="text-muted-foreground mt-1">Configure your water district's global information and official signatories.</p>
                    </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Water District Information</CardTitle>
                            <CardDescription>
                                These details appear in the header of all official resolutions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="water_district_name">Water District Name</Label>
                                    <Input
                                        id="water_district_name"
                                        {...form.register("water_district_name")}
                                        placeholder="e.g. BUENAVISTA WATER DISTRICT"
                                    />
                                    {form.formState.errors.water_district_name && (
                                        <p className="text-sm text-destructive">{form.formState.errors.water_district_name.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2 text-center md:text-left">
                                    <Label>Agency Logo</Label>
                                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                                        <div className="w-20 h-20 border rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                                            {form.watch("logo_url") ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={form.watch("logo_url")}
                                                    alt="Logo"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-slate-400 font-medium">NO LOGO</span>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2 w-full">
                                            <div className="relative">
                                                <Input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={onUploadLogo}
                                                    className="cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10"
                                                />
                                                <Button type="button" variant="outline" size="sm" className="w-full gap-2">
                                                    <Upload className="h-4 w-4" /> Upload New Logo
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">PNG/JPG up to 2MB. Transparent background recommended.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="water_district_email">Email Address</Label>
                                    <Input
                                        id="water_district_email"
                                        {...form.register("water_district_email")}
                                        placeholder="e.g. contact@waterdistrict.gov.ph"
                                    />
                                    {form.formState.errors.water_district_email && (
                                        <p className="text-sm text-destructive">{form.formState.errors.water_district_email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="water_district_contact">Contact Number</Label>
                                    <Input
                                        id="water_district_contact"
                                        {...form.register("water_district_contact")}
                                        placeholder="e.g. (085) 343-4037"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Physical Address</Label>
                                <Input
                                    id="address"
                                    {...form.register("address")}
                                    placeholder="Full office address"
                                />
                                {form.formState.errors.address && (
                                    <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Official Signatories</CardTitle>
                                <CardDescription>
                                    Manage the board members and officials who sign your resolutions.
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => append({ name: "", position: "", role: "member", signature_url: "" })}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" /> Add Signatory
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {fields.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-slate-50">
                                    <p className="text-sm text-muted-foreground">No signatories added yet.</p>
                                    <Button
                                        type="button"
                                        variant="link"
                                        onClick={() => append({ name: "", position: "", role: "member", signature_url: "" })}
                                    >
                                        Add your first signatory
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="group relative border rounded-xl bg-white dark:bg-slate-950 p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                                            {/* Column 1: Info */}
                                            <div className="md:col-span-7 space-y-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-xs uppercase font-bold text-slate-500">Signatory Name</Label>
                                                        <Input
                                                            {...form.register(`signatories.${index}.name` as const)}
                                                            placeholder="Full Name"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-xs uppercase font-bold text-slate-500">Position on Board</Label>
                                                        <Select
                                                            defaultValue={field.position}
                                                            onValueChange={(val) => form.setValue(`signatories.${index}.position` as const, val, { shouldDirty: true })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select Position" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {BOD_POSITIONS.map(pos => (
                                                                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-xs uppercase font-bold text-slate-500">Document Role (System Matching)</Label>
                                                    <Select
                                                        defaultValue={field.role}
                                                        onValueChange={(val) => form.setValue(`signatories.${index}.role` as const, val, { shouldDirty: true })}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select System Role" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {BOD_ROLES.map(role => (
                                                                <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-[10px] text-muted-foreground">The "Role" determines where this person appears in the resolution (e.g., General Manager at the bottom, Chairman at the top of signatories).</p>
                                                </div>
                                            </div>

                                            {/* Column 2: Signature */}
                                            <div className="md:col-span-5 space-y-3">
                                                <Label className="text-xs uppercase font-bold text-slate-500">Digital Signature</Label>
                                                <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                                    {form.watch(`signatories.${index}.signature_url`) ? (
                                                        <div className="relative group/sig h-14 w-full flex justify-center">
                                                            /* eslint-disable-next-line @next/next/no-img-element */
                                                            <img
                                                                src={form.watch(`signatories.${index}.signature_url`)}
                                                                alt="Signature"
                                                                className="h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                                                            />
                                                            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover/sig:opacity-100 flex items-center justify-center transition-opacity rounded">
                                                                <p className="text-[10px] font-bold text-slate-600">CLICK UPLOAD TO REPLACE</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-14 w-full border-2 border-dashed rounded flex items-center justify-center bg-white dark:bg-slate-950">
                                                            <span className="text-[10px] text-slate-400 italic font-medium">PENDING SIGNATURE</span>
                                                        </div>
                                                    )}

                                                    <div className="relative w-full">
                                                        <Input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleSignatureUpload(e, index)}
                                                            className="cursor-pointer opacity-0 absolute inset-0 w-full h-full z-10"
                                                        />
                                                        <Button type="button" variant="outline" size="sm" className="w-full text-[10px] h-7 gap-1">
                                                            <Upload className="h-3 w-3" /> {form.watch(`signatories.${index}.signature_url`) ? "Replace" : "Upload"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end sticky bottom-8 z-10">
                        <Button type="submit" size="lg" disabled={saving || !form.formState.isDirty} className="shadow-lg px-8">
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving Changes...
                                </>
                            ) : (
                                "Save Organization Settings"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div >
    )
}
