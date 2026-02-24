import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { MainNav } from '@/components/main-nav'
import { ResolutionReviewClient } from '@/components/resolution-review-client'
import { ResolutionFormValues } from '@/types/schema'

function normalizeName(value?: string | null) {
    return (value || '').trim().toLowerCase()
}

export default async function ViewResolutionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
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
            .select('id, role, full_name')
            .eq('id', user.id)
            .maybeSingle(),
        supabase.from('resolutions').select('*').eq('id', id).single(),
        supabase.from('organization_settings').select('*').eq('id', 1).maybeSingle()
    ])

    if (resolutionError || !resolution) {
        notFound()
    }

    const isOwner = resolution.user_id === user.id
    const isAdmin = currentProfile?.role === 'admin'
    const isSecretary = currentProfile?.role === 'bod_secretary'
    const canManage = isOwner || isAdmin || isSecretary

    let isOfficerReviewer = false
    let ownerOrgSettings: any = {}

    // Use organization settings for district info
    ownerOrgSettings = {
        water_district_name: orgSettings?.water_district_name || undefined,
        address: orgSettings?.address || undefined,
        logo_url: orgSettings?.logo_url || undefined,
        water_district_email: orgSettings?.water_district_email || undefined,
        water_district_contact: orgSettings?.water_district_contact || undefined,
    }

    if (!isOwner) {
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', resolution.user_id)
            .maybeSingle()

        const isSameDistrict = true // district checks handled via organization_settings singleton

        const reviewerName = normalizeName(currentProfile?.full_name)

        // Get official names from organization settings signatories
        const signatories = (orgSettings?.signatories as any[]) || []
        const officerNames = signatories
            .map(s => normalizeName(s.name))
            .filter(Boolean)

        isOfficerReviewer = isSameDistrict && Boolean(reviewerName) && officerNames.includes(reviewerName)
    }

    if (!canManage && !isOfficerReviewer) {
        redirect('/dashboard')
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
            <MainNav role={currentProfile?.role} />
            <div className="container mx-auto py-8 px-4">
                <ResolutionReviewClient
                    resolutionId={resolution.id}
                    resolutionStatus={resolution.status}
                    isOwner={isOwner}
                    canManage={canManage}
                    initialData={initialData}
                    orgSettings={ownerOrgSettings}
                />
            </div>
        </div>
    )
}
