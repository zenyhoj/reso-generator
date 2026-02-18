
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResolutionCard } from '@/components/resolution-card'
import { Plus, FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MainNav } from '@/components/main-nav'
import { SearchInput } from '@/components/search-input'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ query?: string }> }) {
    const supabase = await createClient()
    const { query } = await searchParams

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch resolutions
    let queryBuilder = supabase
        .from('resolutions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (query) {
        queryBuilder = queryBuilder.or(`title.ilike.%${query}%,resolution_number.ilike.%${query}%`)
    }

    const { data: resolutions, error } = await queryBuilder

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <MainNav />
            <div className="container mx-auto py-10 px-4">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight">Resolutions</h1>
                        <p className="text-muted-foreground">Manage your board resolutions.</p>
                    </div>
                    <Link href="/resolutions/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create New
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                    <SearchInput />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resolutions && resolutions.length > 0 ? (
                        resolutions.map((res: any) => (
                            <ResolutionCard key={res.id} resolution={res} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-12 border rounded-lg bg-slate-50 border-dashed">
                            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <FileText className="h-6 w-6 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold">No resolutions found</h3>
                            <p className="text-muted-foreground mb-4">Get started by creating your first board resolution.</p>
                            <Link href="/resolutions/new">
                                <Button variant="outline">Create Resolution</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
