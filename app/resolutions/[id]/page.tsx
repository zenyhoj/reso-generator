
import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ResolutionBuilderClient } from '@/components/resolution-builder-client'
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
        movant_name: resolution.content?.movant_name || "",
        seconder_name: resolution.content?.seconder_name || "",
        footer_approved_text: resolution.content?.footer_approved_text ?? "Unanimously approved.",
        footer_adopted_text: resolution.content?.footer_adopted_text ?? "",
        footer_certified_text: resolution.content?.footer_certified_text ?? "We hereby certify to the correctness of the foregoing resolution.",
    }

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
                <ResolutionBuilderClient initialData={initialData} />
            </div>
        </div>
    )
}
