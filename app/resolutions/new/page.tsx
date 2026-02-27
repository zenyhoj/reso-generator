
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ResolutionBuilderClient } from '@/components/resolution-builder-client'

export default async function NewResolutionPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle()

    const canCreate = profile?.status === 'approved' && (profile.role === 'admin' || profile.role === 'bod_secretary')

    if (!canCreate) {
        redirect('/dashboard')
    }

    return (
        <div className="fixed inset-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
                <ResolutionBuilderClient />
            </div>
        </div>
    )
}
