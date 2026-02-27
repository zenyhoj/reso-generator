'use server'


import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/utils/supabase/server'

export async function login(prevState: any, formData: FormData) {
    let redirectPath: string | null = null

    try {
        console.log('--- SESSION DEBUG: Login action started ---')
        const supabase = await createClient()

        const email = (formData.get('email') as string).trim().toLowerCase()
        const password = formData.get('password') as string
        console.log('Login attempt for:', email)

        if (!email || !password) {
            console.log('Login rejected: empty fields')
            return { error: 'Email and password are required' }
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            console.log('Supabase Auth error:', error.message)
            return { error: 'Invalid email or password' }
        }

        console.log('Auth successful, fetching profile...')
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('status')
                .eq('id', user.id)
                .maybeSingle()

            console.log('Profile found:', profile?.status || 'no profile')
            if (!profile || profile.status === 'pending') {
                console.log('Status PENDING -> Redirecting to /pending')
                redirectPath = '/pending'
            } else {
                console.log('Status APPROVED -> Redirecting to /dashboard')
                redirectPath = '/dashboard'
            }
        }
    } catch (err: any) {
        if (err.digest?.startsWith('NEXT_REDIRECT')) throw err
        console.error('CRITICAL: Login action crashed:', err)
        return { error: 'Server error encountered. Please check your connection.' }
    }

    if (redirectPath) {
        console.log('--- SESSION DEBUG: Redirecting to', redirectPath)
        redirect(redirectPath)
    }
}

export async function signup(prevState: any, formData: FormData) {
    let redirectPath: string | null = null

    try {
        console.log('--- SESSION DEBUG: Signup action started ---')
        const adminSupabase = await createAdminClient()

        const fullName = (formData.get('full_name') as string).trim()
        const bodPosition = (formData.get('bod_position') as string)
        const email = (formData.get('signup_email') as string || formData.get('email') as string || '').trim().toLowerCase()
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirm_password') as string

        console.log('Signup attempt for:', email, 'Name:', fullName)

        if (!fullName || !bodPosition || !email || !password) {
            console.log('Signup REJECTED: Missing fields')
            return { error: 'All fields are required' }
        }

        if (password !== confirmPassword) {
            return { error: 'Passwords do not match' }
        }

        // Helper to normalize names for comparison
        const normalize = (name: string) => name.toLowerCase().trim().replace(/\s+/g, ' ')

        // CRITICAL SECURITY FIX: 
        // 1. Force all new signups to 'bod_member' role.
        // 2. Initial admin must be set manually in DB.
        const role = 'bod_member'

        console.log('Signup DEBUG - Enforced Role:', role)

        // --- VALIDATION: Check if fullName matches an official BOD name ---
        // This is now enforced for ALL signups to prevent unauthorized accounts.
        const { data: orgSettings } = await adminSupabase
            .from('organization_settings')
            .select('signatories')
            .eq('id', 1)
            .maybeSingle()

        if (!orgSettings || !orgSettings.signatories) {
            console.error('SYSTEM ERROR: No organization settings or signatories found.')
            return { error: 'System configuration error. Please contact the administrator.' }
        }

        const signatories = orgSettings.signatories as any[]
        const officialNames = signatories
            .map(s => s.name)
            .filter(Boolean)
            .map(n => normalize(n as string))

        console.log('Signup DEBUG - Official Names List:', officialNames)

        if (!officialNames.includes(normalize(fullName))) {
            console.log('Signup REJECTED: Name not in official signatories list.', fullName)
            return { error: 'Your name is not listed in the official Board of Directors list. Please contact the administrator.' }
        }
        // -----------------------------------------------------------------

        const supabase = await createClient()
        console.log('Calling Supabase auth.signUp with:', email)
        const { data, error } = await supabase.auth.signUp({ email, password })

        if (error) {
            console.log('Supabase Signup error (raw):', JSON.stringify(error))
            console.log('Supabase Signup error (message):', error.message)
            return { error: error.message }
        }

        if (data.user) {
            console.log('Inserting profile for:', data.user.id, 'Role:', role)
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    email,
                    full_name: fullName,
                    bod_position: bodPosition,
                    role: role,
                    status: 'pending',
                })

            if (profileError) {
                console.log('Profile insertion error:', profileError.message)
                return { error: profileError.message }
            }
        }

        console.log('Signup success -> Redirecting to /pending')
        redirectPath = '/pending'
    } catch (err: any) {
        if (err.digest?.startsWith('NEXT_REDIRECT') || (typeof err.message === 'string' && err.message.includes('NEXT_REDIRECT'))) throw err
        console.error('CRITICAL: Signup action crashed:', err)
        return { error: 'An unexpected error occurred. Please try again.' }
    }

    if (redirectPath) {
        console.log('--- SESSION DEBUG: Redirecting to', redirectPath)
        redirect(redirectPath)
    }
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
