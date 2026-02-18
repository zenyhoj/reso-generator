
"use client"

import { UseFormReturn, useFieldArray } from "react-hook-form"
import { ResolutionFormValues } from "@/types/schema"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface ResolutionFormProps {
    form: UseFormReturn<ResolutionFormValues>
}

export function ResolutionForm({ form }: ResolutionFormProps) {
    const { fields: whereasFields, append: appendWhereas, remove: removeWhereas } = useFieldArray({
        control: form.control,
        name: "whereasClauses" as any, // casting due to simple string array limitation in RHF types sometimes
    })

    const { fields: resolvedFields, append: appendResolved, remove: removeResolved } = useFieldArray({
        control: form.control,
        name: "resolvedClauses" as any,
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
            </form>
        </Form>
    )
}
