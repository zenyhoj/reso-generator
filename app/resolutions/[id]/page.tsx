
import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ResolutionBuilder } from '@/components/resolution-builder'
import { ResolutionFormValues } from '@/types/schema'

export default async function EditResolutionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: resolution, error } = await supabase
        .from('resolutions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !resolution) {
        notFound()
    }

    // Map DB data to Form Values
    const initialData: ResolutionFormValues & { id: string } = {
        id: resolution.id,
        title: resolution.title,
        description: resolution.description || "",
        resolutionNumber: resolution.resolution_number,
        seriesYear: resolution.series_year,
        heldOn: resolution.held_on || "",
        approvedOn: resolution.approved_on || "",
        whereasClauses: resolution.content?.whereasClauses || [""],
        resolvedClauses: resolution.content?.resolvedClauses || [""],
        signatories: resolution.signatories || [],
    }

    return (
        <div className="h-screen flex flex-col">
            <header className="px-6 py-3 border-b flex items-center justify-between bg-white shrink-0 no-print">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold font-serif text-slate-900">
                        Edit Resolution
                    </h1>
                </div>
            </header>
            <div className="flex-1 overflow-hidden">
                <ResolutionBuilder initialData={initialData} />
            </div>
        </div>
    )
}
