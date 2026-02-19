
"use client"

import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { UseFormReturn, useFieldArray } from "react-hook-form"
import { ResolutionFormValues } from "@/types/schema"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, RefreshCw, CheckCircle, PenTool, UserCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ResolutionFormProps {
    form: UseFormReturn<ResolutionFormValues>
    onSyncSignatories?: () => void
}

export function ResolutionForm({ form, onSyncSignatories }: ResolutionFormProps) {
    const { fields: whereasFields, append: appendWhereas, remove: removeWhereas } = useFieldArray({
        control: form.control,
        name: "whereasClauses" as any,
    })

    const { fields: resolvedFields, append: appendResolved, remove: removeResolved } = useFieldArray({
        control: form.control,
        name: "resolvedClauses" as any,
    })

    const { fields: signatoryFields, append: appendSignatory, remove: removeSignatory } = useFieldArray({
        control: form.control,
        name: "signatories",
    })

    return (
        <Form {...form}>
            <form className="space-y-8">
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="resolutionNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Resolution No.</FormLabel>
                                    <FormControl>
                                        <Input placeholder="001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="seriesYear"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Series Year</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={e => field.onChange(parseInt(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="heldOn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Held On (Meeting Date)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="approvedOn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Approved On (Adoption Date)</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="APPROVING THE BUDGET FOR..." className="resize-none min-h-[80px]" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Enter the full title of the resolution in uppercase.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="A brief summary of the resolution..." className="resize-none min-h-[60px]" {...field} />
                                </FormControl>
                                <FormDescription>
                                    A short summary for the dashboard.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Whereas Clauses</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendWhereas("")}>
                            <Plus className="h-4 w-4 mr-2" /> Add Clause
                        </Button>
                    </div>
                    {whereasFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                            <FormField
                                control={form.control}
                                name={`whereasClauses.${index}`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Textarea className="min-h-[60px]" placeholder={`WHEREAS, ...`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeWhereas(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Resolved Clauses</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => appendResolved("")}>
                            <Plus className="h-4 w-4 mr-2" /> Add Clause
                        </Button>
                    </div>
                    {resolvedFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                            <FormField
                                control={form.control}
                                name={`resolvedClauses.${index}`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Textarea className="min-h-[60px]" placeholder={`RESOLVED, as it is hereby resolved...`} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeResolved(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>

                <Separator />

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Signatories</h3>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={onSyncSignatories} className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                                <RefreshCw className="h-4 w-4 mr-2" /> Sync from Settings
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => appendSignatory({ name: "", position: "", role: "member" })}>
                                <Plus className="h-4 w-4 mr-2" /> Add Signatory
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {signatoryFields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg bg-slate-50 space-y-4 relative">
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => removeSignatory(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className={form.watch(`signatories.${index}.isCertified`) ? "text-green-600 border-green-200 bg-green-50" : "text-indigo-600 border-indigo-200 hover:bg-indigo-50"}
                                        onClick={async () => {
                                            const supabase = createClient()
                                            const { data: { user } } = await supabase.auth.getUser()
                                            if (!user) {
                                                toast.error("You must be logged in to sign.")
                                                return
                                            }

                                            // Fetch current user's signature from profile
                                            const { data: profile } = await supabase
                                                .from("profiles")
                                                .select("signature_url")
                                                .eq("id", user.id)
                                                .single()

                                            if (!profile?.signature_url) {
                                                toast.error("Please upload your e-signature first in Settings.")
                                                return
                                            }

                                            form.setValue(`signatories.${index}.signature`, profile.signature_url)
                                            form.setValue(`signatories.${index}.isCertified`, true)
                                            form.setValue(`signatories.${index}.certifiedAt`, new Date().toISOString())
                                            toast.success("Signed and certified!")
                                        }}
                                    >
                                        {form.watch(`signatories.${index}.isCertified`) ? (
                                            <><CheckCircle className="w-4 h-4 mr-1" /> Certified</>
                                        ) : (
                                            <><PenTool className="w-4 h-4 mr-1" /> Sign & Certify</>
                                        )}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name={`signatories.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John Doe" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`signatories.${index}.position`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Position</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="BOD Member" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name={`signatories.${index}.role`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="chairman">Chairman (Attestation)</SelectItem>
                                                    <SelectItem value="vice-chairman">Vice-Chairman</SelectItem>
                                                    <SelectItem value="secretary">Secretary (Certification)</SelectItem>
                                                    <SelectItem value="member">Member</SelectItem>
                                                    <SelectItem value="gm">General Manager (Concurrence)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </form>
        </Form>
    )
}
