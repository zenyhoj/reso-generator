'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'admin' || profile.status !== 'approved') {
        redirect('/dashboard')
    }
    return supabase
}

export async function approveUser(userId: string, role: string) {
    const supabase = await requireAdmin()

    const validRoles = ['admin', 'bod_secretary', 'bod_member']
    if (!validRoles.includes(role)) {
        throw new Error('Invalid role')
    }

    const { error } = await supabase.rpc('admin_update_user', {
        target_user_id: userId,
        new_role: role,
        new_status: 'approved',
    })

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
}

export async function revokeUser(userId: string) {
    const supabase = await requireAdmin()

    const { error } = await supabase.rpc('admin_update_user', {
        target_user_id: userId,
        new_role: 'bod_member',
        new_status: 'pending',
    })

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
}

export async function changeUserRole(userId: string, newRole: string) {
    const supabase = await requireAdmin()

    const validRoles = ['admin', 'bod_secretary', 'bod_member']
    if (!validRoles.includes(newRole)) {
        throw new Error('Invalid role')
    }

    const { error } = await supabase.rpc('admin_update_user', {
        target_user_id: userId,
        new_role: newRole,
        new_status: 'approved',
    })

    if (error) throw new Error(error.message)
    revalidatePath('/admin')
}
