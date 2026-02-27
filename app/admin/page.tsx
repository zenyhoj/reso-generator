import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { AdminUsersTable } from "./users-table"
import { Users } from "lucide-react"

export default async function AdminPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Server-side guard: must be admin
    const { data: me } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single()

    if (!me || me.role !== "admin" || me.status !== "approved") {
        redirect("/dashboard")
    }

    // Fetch all profiles via SECURITY DEFINER function
    const { data: users, error } = await supabase.rpc("admin_get_all_profiles")

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <MainNav role="admin" userEmail={user.email} />
            <div className="container mx-auto py-10 px-4">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground text-sm">
                            Approve new users and manage roles.
                        </p>
                    </div>
                </div>

                {error ? (
                    <p className="text-destructive text-sm">Failed to load users: {error.message}</p>
                ) : (
                    <AdminUsersTable users={users ?? []} />
                )}
            </div>
        </div>
    )
}
