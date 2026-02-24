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

    const [{ data: currentProfile }, { data: resolution, error: resolutionError }] = await Promise.all([
        supabase
            .from('profiles')
            .select('id, role, full_name, water_district_name, address, logo_url, water_district_email, water_district_contact')
            .eq('id', user.id)
            .maybeSingle(),
        supabase.from('resolutions').select('*').eq('id', id).single(),
    ])

    if (resolutionError || !resolution) {
        notFound()
    }

    const isOwner = resolution.user_id === user.id
    const isAdmin = currentProfile?.role === 'admin'

    let isOfficerReviewer = false
    let ownerOrgSettings: {
        water_district_name?: string
        address?: string
        logo_url?: string
        water_district_email?: string
        water_district_contact?: string
    } = {}

    if (isOwner) {
        // The resolution owner sees their own org settings
        ownerOrgSettings = {
            water_district_name: currentProfile?.water_district_name || undefined,
            address: currentProfile?.address || undefined,
            logo_url: currentProfile?.logo_url || undefined,
            water_district_email: currentProfile?.water_district_email || undefined,
            water_district_contact: currentProfile?.water_district_contact || undefined,
        }
    } else {
        const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('water_district_name, address, logo_url, water_district_email, water_district_contact, bod_chairman, bod_vice_chairman, bod_secretary, bod_member_1, bod_member_2, bod_member_3, general_manager')
            .eq('id', resolution.user_id)
            .maybeSingle()

        ownerOrgSettings = {
            water_district_name: ownerProfile?.water_district_name || undefined,
            address: ownerProfile?.address || undefined,
            logo_url: ownerProfile?.logo_url || undefined,
            water_district_email: ownerProfile?.water_district_email || undefined,
            water_district_contact: ownerProfile?.water_district_contact || undefined,
        }

        const isSameDistrict = Boolean(
            currentProfile?.water_district_name &&
            ownerProfile?.water_district_name &&
            currentProfile.water_district_name === ownerProfile.water_district_name
        )

        const reviewerName = normalizeName(currentProfile?.full_name)
        const officerNames = [
            ownerProfile?.bod_chairman,
            ownerProfile?.bod_vice_chairman,
            ownerProfile?.bod_secretary,
            ownerProfile?.bod_member_1,
            ownerProfile?.bod_member_2,
            ownerProfile?.bod_member_3,
            ownerProfile?.general_manager,
        ]
            .map(normalizeName)
            .filter(Boolean)

        isOfficerReviewer = isSameDistrict && Boolean(reviewerName) && officerNames.includes(reviewerName)
    }

    if (!isOwner && !isAdmin && !isOfficerReviewer) {
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
            <MainNav />
            <div className="container mx-auto py-8 px-4">
                <ResolutionReviewClient
                    resolutionId={resolution.id}
                    resolutionStatus={resolution.status}
                    isOwner={isOwner}
                    initialData={initialData}
                    orgSettings={ownerOrgSettings}
                />
            </div>
        </div>
    )
}
