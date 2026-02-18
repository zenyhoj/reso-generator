
"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { FileText, Trash2, Loader2, AlertTriangle } from "lucide-react"

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
        created_at: string
        status: string
    }
}

export function ResolutionCard({ resolution }: ResolutionCardProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteInput, setDeleteInput] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

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
        } catch (error: any) {
            console.error("Delete failed:", error)
            toast.error(`Failed to delete: ${error.message}`, { id: toastId })
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="hover:bg-accent/50 transition-colors group relative flex flex-col h-full">
            <Link href={`/resolutions/${resolution.id}`} className="flex-1">
                <CardHeader>
                    <CardTitle className="font-serif text-lg leading-tight line-clamp-2 pr-8">
                        Res. No. {resolution.resolution_number}-Series of {resolution.series_year}: {resolution.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                        {resolution.description || "No description provided."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-xs text-muted-foreground">
                        <FileText className="mr-1 h-3 w-3" />
                        {new Date(resolution.created_at).toLocaleDateString()}
                        <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${resolution.status === 'final' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                            {resolution.status}
                        </span>
                    </div>
                </CardContent>
            </Link>

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
        </Card>
    )
}
