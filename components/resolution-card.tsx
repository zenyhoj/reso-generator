
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { FileText, Trash2, Loader2 } from "lucide-react"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResolutionCardProps {
    resolution: {
        id: string
        resolution_number: string
        series_year: number
        title: string
        description?: string | null
        content?: {
            resolvedClauses?: string[]
            whereasClauses?: string[]
        }
        created_at: string
        finalized_at?: string | null
        status: string
    }
    role?: string
}

export function ResolutionCard({ resolution, role }: ResolutionCardProps) {
    const isFinal = resolution.status === 'final'
    const canDelete = (role === 'admin' || role === 'bod_secretary') && !isFinal
    const canEdit = (role === 'admin' || role === 'bod_secretary') && !isFinal
    const resolutionHref = canEdit
        ? `/resolutions/${resolution.id}`
        : `/resolutions/${resolution.id}/view`
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteInput, setDeleteInput] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Compute a fallback description if none is explicitly provided
    let displayDescription = resolution.description;
    if (!displayDescription && resolution.content) {
        if (resolution.content.resolvedClauses && resolution.content.resolvedClauses.length > 0) {
            const firstResolved = resolution.content.resolvedClauses[0];
            // Remove the leading "RESOLVED, " or "RESOLVED FURTHER, " for a cleaner summary
            displayDescription = firstResolved.replace(/^(RESOLVED(?: FURTHER)?,\s*(?:that )?)/i, '');
        } else if (resolution.content.whereasClauses && resolution.content.whereasClauses.length > 0) {
            const firstWhereas = resolution.content.whereasClauses[0];
            // Remove the leading "WHEREAS, "
            displayDescription = firstWhereas.replace(/^(WHEREAS,\s*)/i, '');
        }
    }

    const handleDelete = async () => {
        if (deleteInput.toLowerCase() !== "delete") return

        setIsDeleting(true)
        const toastId = toast.loading("Deleting resolution...")

        try {
            const supabase = createClient()
            const { error } = await supabase
                .from('resolutions')
                .delete()
                .eq('id', resolution.id)

            if (error) throw error

            toast.success("Resolution deleted", { id: toastId })
            setIsDialogOpen(false)
            router.refresh()
        } catch (error: unknown) {
            console.error("Delete failed:", error)
            const message = error instanceof Error ? error.message : "Unknown error"
            toast.error(`Failed to delete: ${message}`, { id: toastId })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="hover:bg-accent/50 hover:shadow-md transition-all duration-200 group relative flex flex-col h-full border-slate-200 dark:border-slate-800">
            <Link href={resolutionHref} className="flex-1 flex flex-col">
                <CardHeader className="pb-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2 pr-8">
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md dark:bg-slate-800 dark:text-slate-300">
                            Res. {resolution.resolution_number}-{resolution.series_year}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold tracking-wider ${resolution.status === 'final' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            {resolution.status}
                        </span>
                    </div>
                    <CardTitle className="font-serif text-lg leading-snug group-hover:text-primary transition-colors pr-8">
                        {resolution.title}
                    </CardTitle>
                    {displayDescription ? (
                        <CardDescription className="line-clamp-2 text-sm mt-1.5 leading-relaxed">
                            {displayDescription}
                        </CardDescription>
                    ) : (
                        <CardDescription className="italic text-sm mt-1.5 opacity-60">
                            No description provided.
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="pt-0 mt-auto">
                    <div className="flex items-center text-xs text-muted-foreground pt-3 border-t">
                        <FileText className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                        {new Date(resolution.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </div>
                    {isFinal && resolution.finalized_at && (
                        <div className="mt-1 text-[11px] text-muted-foreground">
                            Finalized {new Date(resolution.finalized_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </div>
                    )}
                </CardContent>
            </Link>

            {canDelete && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the resolution
                                    <span className="font-medium text-foreground"> No. {resolution.resolution_number}-{resolution.series_year}</span>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <div className="py-4 space-y-2">
                                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                                    Type <span className="font-mono font-bold text-red-600">delete</span> to confirm
                                </Label>
                                <Input
                                    id="confirm-delete"
                                    value={deleteInput}
                                    onChange={(e) => setDeleteInput(e.target.value)}
                                    placeholder="Type delete to confirm"
                                    className="col-span-3"
                                    autoComplete="off"
                                />
                            </div>

                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteInput("")}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault()
                                        handleDelete()
                                    }}
                                    disabled={deleteInput.toLowerCase() !== "delete" || isDeleting}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        "Delete Resolution"
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </Card>
    )
}
