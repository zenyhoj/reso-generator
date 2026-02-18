
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ResolutionBuilder } from '@/components/resolution-builder'

export default async function NewResolutionPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="h-screen flex flex-col">
            <header className="px-6 py-3 border-b flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold font-serif text-slate-900">
                        New Resolution
                    </h1>
                </div>
            </header>
            <div className="flex-1 overflow-hidden">
                <ResolutionBuilder />
            </div>
        </div>
    )
}
