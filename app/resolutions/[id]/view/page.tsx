import { notFound, redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/utils/supabase/server'
import { MainNav } from '@/components/main-nav'
import { ResolutionReviewClient } from '@/components/resolution-review-client'
import { ResolutionFormValues } from '@/types/schema'

export default async function ViewResolutionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const adminSupabase = process.env.NEXT_SERVICE_ROLE_KEY ? await createAdminClient() : null
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [
        { data: currentProfile },
        { data: resolution, error: resolutionError },
        { data: orgSettings }
    ] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, role, status, full_name')
            .eq('id', user.id)
            .maybeSingle(),
        (adminSupabase ?? supabase).from('resolutions').select('*').eq('id', id).single(),
        supabase.from('organization_settings').select('*').eq('id', 1).maybeSingle()
    ])

    if (resolutionError || !resolution) {
        notFound()
    }

    const isOwner = resolution.user_id === user.id
    const isAdmin = currentProfile?.role === 'admin'
    const isSecretary = currentProfile?.role === 'bod_secretary'
    const isApproved = currentProfile?.status === 'approved'
    const canManage = isApproved && (isOwner || isAdmin || isSecretary)
    const canFinalize = isApproved && (isAdmin || isSecretary)
    const canReview = isApproved

    const ownerOrgSettings = {
        water_district_name: orgSettings?.water_district_name || undefined,
        address: orgSettings?.address || undefined,
        logo_url: orgSettings?.logo_url || undefined,
        water_district_email: orgSettings?.water_district_email || undefined,
        water_district_contact: orgSettings?.water_district_contact || undefined,
    }

    if (!canReview) {
        redirect('/pending')
    }

    let finalizedByName: string | null = null
    if (resolution.finalized_by) {
        const { data: finalizerProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', resolution.finalized_by)
            .maybeSingle()
        finalizedByName = finalizerProfile?.full_name ?? null
    }

    const initialData: ResolutionFormValues = {
        title: resolution.title,
        description: resolution.description || '',
        resolutionNumber: resolution.resolution_number,
        seriesYear: resolution.series_year,
        heldOn: resolution.held_on || '',
        approvedOn: resolution.approved_on || '',
        whereasClauses: resolution.content?.whereasClauses || [''],
        resolvedClauses: resolution.content?.resolvedClauses || [''],
        signatories: resolution.signatories || [],
        movant_name: resolution.content?.movant_name || '',
        seconder_name: resolution.content?.seconder_name || '',
        footer_approved_text: resolution.content?.footer_approved_text ?? 'Unanimously approved.',
        footer_adopted_text: resolution.content?.footer_adopted_text ?? '',
        footer_certified_text:
            resolution.content?.footer_certified_text ??
            'We hereby certify to the correctness of the foregoing resolution.',
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <MainNav role={currentProfile?.role} userEmail={user.email} />
            <div className="container mx-auto py-8 px-4">
                <ResolutionReviewClient
                    resolutionId={resolution.id}
                    resolutionStatus={resolution.status}
                    isOwner={isOwner}
                    canManage={canManage}
                    canFinalize={canFinalize}
                    finalizedAt={resolution.finalized_at}
                    finalizedByName={finalizedByName}
                    initialData={initialData}
                    orgSettings={ownerOrgSettings}
                    signedPdfUrl={resolution.signed_pdf_url}
                />
            </div>
        </div>
    )
}
