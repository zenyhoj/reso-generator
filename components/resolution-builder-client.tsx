"use client"

import dynamic from "next/dynamic"
import { ResolutionFormValues } from "@/types/schema"

const ResolutionBuilder = dynamic(
    () => import("@/components/resolution-builder").then(m => ({ default: m.ResolutionBuilder })),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-screen text-slate-400">
                Loading...
            </div>
        ),
    }
)

interface Props {
    initialData?: (ResolutionFormValues & { id: string }) | null
}

export function ResolutionBuilderClient({ initialData }: Props) {
    return (
        <div className="h-full">
            <ResolutionBuilder initialData={initialData ?? undefined} />
        </div>
    )
}
