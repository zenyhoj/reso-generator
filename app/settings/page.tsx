
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { MainNav } from "@/components/main-nav"

const settingsSchema = z.object({
    water_district_name: z.string().min(1, "Required"),
    water_district_email: z.string().email("Invalid email").optional().or(z.literal("")),
    water_district_contact: z.string().optional(),
    address: z.string().min(1, "Required"),
    logo_url: z.string().optional(),
    bod_chairman: z.string().min(1, "Required"),
    bod_vice_chairman: z.string().min(1, "Required"),
    bod_secretary: z.string().min(1, "Required"),
    bod_member_1: z.string().min(1, "Required"),
    bod_member_2: z.string().min(1, "Required"),
    bod_member_3: z.string().optional(),
    general_manager: z.string().min(1, "Required"),
    signature_url: z.string().optional(),
    bod_chairman_sig_url: z.string().optional(),
    bod_vice_chairman_sig_url: z.string().optional(),
    bod_secretary_sig_url: z.string().optional(),
    bod_member_1_sig_url: z.string().optional(),
    bod_member_2_sig_url: z.string().optional(),
    bod_member_3_sig_url: z.string().optional(),
    general_manager_sig_url: z.string().optional(),
})

type SettingsValues = z.infer<typeof settingsSchema>

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
            bod_chairman: "",
            bod_vice_chairman: "",
            bod_secretary: "",
            bod_member_1: "",
            bod_member_2: "",
            bod_member_3: "",
            general_manager: "",
            signature_url: "",
            bod_chairman_sig_url: "",
            bod_vice_chairman_sig_url: "",
            bod_secretary_sig_url: "",
            bod_member_1_sig_url: "",
            bod_member_2_sig_url: "",
            bod_member_3_sig_url: "",
            general_manager_sig_url: "",
        },
    })

    useEffect(() => {
        async function loadSettings() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                setUser(user)

                let { data: profile, error } = await supabase
                    .from("profiles")
                    .select(`
                        id, email, water_district_name, water_district_email,
                        water_district_contact, address, logo_url,
                        bod_chairman, bod_vice_chairman, bod_secretary,
                        bod_member_1, bod_member_2, bod_member_3, general_manager,
                        signature_url, bod_chairman_sig_url, bod_vice_chairman_sig_url,
                        bod_secretary_sig_url, bod_member_1_sig_url, bod_member_2_sig_url,
                        bod_member_3_sig_url, general_manager_sig_url
                    `)
                    .eq("id", user.id)
                    .maybeSingle()

                if (error) throw error

                if (!profile) {
                    const { data: newProfile, error: createError } = await supabase
                        .from("profiles")
                        .insert([{ id: user.id, email: user.email, water_district_name: "" }])
                        .select()
                        .single()

                    if (createError) throw createError
                    profile = newProfile
                }

                if (profile && !form.formState.isDirty) {
                    form.reset({
                        water_district_name: profile.water_district_name || "",
                        water_district_email: profile.water_district_email || "",
                        water_district_contact: profile.water_district_contact || "",
                        address: profile.address || "",
                        logo_url: profile.logo_url || "",
                        bod_chairman: profile.bod_chairman || "",
                        bod_vice_chairman: profile.bod_vice_chairman || "",
                        bod_secretary: profile.bod_secretary || "",
                        bod_member_1: profile.bod_member_1 || "",
                        bod_member_2: profile.bod_member_2 || "",
                        bod_member_3: profile.bod_member_3 || "",
                        general_manager: profile.general_manager || "",
                        signature_url: profile.signature_url || "",
                        bod_chairman_sig_url: profile.bod_chairman_sig_url || "",
                        bod_vice_chairman_sig_url: profile.bod_vice_chairman_sig_url || "",
                        bod_secretary_sig_url: profile.bod_secretary_sig_url || "",
                        bod_member_1_sig_url: profile.bod_member_1_sig_url || "",
                        bod_member_2_sig_url: profile.bod_member_2_sig_url || "",
                        bod_member_3_sig_url: profile.bod_member_3_sig_url || "",
                        general_manager_sig_url: profile.general_manager_sig_url || "",
                    })
                }
            } catch (error: any) {
                console.error("Error loading settings FULL:", error)
                console.error("Error Message:", error.message)
                console.error("Error Code:", error.code)
                console.error("Error Details:", error.details)
                toast.error("Failed to load settings.")
            } finally {
                setLoading(false)
            }
        }

        loadSettings()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ─── Shared upload validation ────────────────────────────────────────────
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
            event.target.value = '' // reset input
            return
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        setSaving(true)
        try {
            // Upload to 'logos' bucket
            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath)

            // Save to form
            form.setValue("logo_url", publicUrl, { shouldDirty: true })
            toast.success("Logo uploaded successfully. Don't forget to save changes!")
        } catch (error: any) {
            toast.error("Failed to upload logo. Ensure 'logos' bucket exists and is public.")
        } finally {
            setSaving(false)
        }
    }


    async function handleSignatureUpload(event: React.ChangeEvent<HTMLInputElement>, field: keyof SettingsValues) {
        if (!event.target.files || event.target.files.length === 0) return
        if (!user) return

        const file = event.target.files[0]

        // Validate file type and size before uploading
        const validationError = validateImageFile(file)
        if (validationError) {
            toast.error(validationError)
            event.target.value = '' // reset input
            return
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${field}-${Math.random()}.${fileExt}`
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

            form.setValue(field, publicUrl, { shouldDirty: true })
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
                .from("profiles")
                .upsert({
                    id: user.id,
                    email: user.email,
                    ...data,
                    updated_at: new Date().toISOString(),
                })
                .select()

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <MainNav />
            <div className="max-w-4xl mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold tracking-tight mb-8">Organization Settings</h1>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Water District Information</CardTitle>
                            <CardDescription>
                                These details will appear in the header of your resolutions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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

                            <div className="space-y-4">
                                <Label>Agency Logo</Label>
                                <div className="flex items-center gap-4">
                                    {form.watch("logo_url") && (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={form.watch("logo_url")}
                                            alt="Logo Preview"
                                            className="w-20 h-20 object-contain border rounded-md p-1 bg-white"
                                        />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={onUploadLogo}
                                        className="max-w-xs"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Recommended: Transparent PNG, square aspect ratio.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="water_district_email">Email Address</Label>
                                    <Input
                                        id="water_district_email"
                                        {...form.register("water_district_email")}
                                        placeholder="e.g. buenawad@yahoo.com"
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
                                    {form.formState.errors.water_district_contact && (
                                        <p className="text-sm text-destructive">{form.formState.errors.water_district_contact.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    {...form.register("address")}
                                    placeholder="e.g. Rizal Avenue, Barangay 3, Buenavista, Agusan del Norte"
                                />
                                {form.formState.errors.address && (
                                    <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Board of Directors & Signatories</CardTitle>
                            <CardDescription>
                                These names will be auto-filled as signatories in your resolutions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bod_chairman">BOD Chairman</Label>
                                    <Input
                                        id="bod_chairman"
                                        {...form.register("bod_chairman")}
                                        placeholder="Full Name"
                                    />
                                    {form.formState.errors.bod_chairman && (
                                        <p className="text-sm text-destructive">{form.formState.errors.bod_chairman.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bod_vice_chairman">BOD Vice-Chairman</Label>
                                    <Input
                                        id="bod_vice_chairman"
                                        {...form.register("bod_vice_chairman")}
                                        placeholder="Full Name"
                                    />
                                    {form.formState.errors.bod_vice_chairman && (
                                        <p className="text-sm text-destructive">{form.formState.errors.bod_vice_chairman.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bod_secretary">BOD Secretary</Label>
                                <Input
                                    id="bod_secretary"
                                    {...form.register("bod_secretary")}
                                    placeholder="Full Name"
                                />
                                {form.formState.errors.bod_secretary && (
                                    <p className="text-sm text-destructive">{form.formState.errors.bod_secretary.message}</p>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Board Members</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bod_member_1">Member 1</Label>
                                        <Input
                                            id="bod_member_1"
                                            {...form.register("bod_member_1")}
                                            placeholder="Full Name"
                                        />
                                        {form.formState.errors.bod_member_1 && (
                                            <p className="text-sm text-destructive">{form.formState.errors.bod_member_1.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bod_member_2">Member 2</Label>
                                        <Input
                                            id="bod_member_2"
                                            {...form.register("bod_member_2")}
                                            placeholder="Full Name"
                                        />
                                        {form.formState.errors.bod_member_2 && (
                                            <p className="text-sm text-destructive">{form.formState.errors.bod_member_2.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bod_member_3">Member 3 (Optional)</Label>
                                        <Input
                                            id="bod_member_3"
                                            {...form.register("bod_member_3")}
                                            placeholder="Full Name"
                                        />
                                        {form.formState.errors.bod_member_3 && (
                                            <p className="text-sm text-destructive">{form.formState.errors.bod_member_3.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Separator />

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium">Digital Signatures</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { label: "BOD Chairman", name: "bod_chairman", sigField: "bod_chairman_sig_url" },
                                        { label: "BOD Vice-Chairman", name: "bod_vice_chairman", sigField: "bod_vice_chairman_sig_url" },
                                        { label: "BOD Secretary", name: "bod_secretary", sigField: "bod_secretary_sig_url" },
                                        { label: "BOD Member 1", name: "bod_member_1", sigField: "bod_member_1_sig_url" },
                                        { label: "BOD Member 2", name: "bod_member_2", sigField: "bod_member_2_sig_url" },
                                        { label: "General Manager", name: "general_manager", sigField: "general_manager_sig_url" },
                                    ].map((field) => (
                                        <div key={field.sigField} className="space-y-2 border p-4 rounded-md">
                                            <Label className="text-xs font-semibold uppercase text-muted-foreground">{field.label}</Label>
                                            <div className="flex items-center gap-4">
                                                {form.watch(field.sigField as keyof SettingsValues) ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img
                                                        src={form.watch(field.sigField as keyof SettingsValues)}
                                                        alt="Signature"
                                                        className="h-12 object-contain"
                                                    />
                                                ) : (
                                                    <div className="h-12 w-24 bg-slate-100 rounded flex items-center justify-center text-xs text-slate-400 italic">
                                                        No signature
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <Input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleSignatureUpload(e, field.sigField as keyof SettingsValues)}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground">Upload transparent PNG signatures for each signatory.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div >
    )
}
