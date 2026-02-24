
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const start0 = Date.now()
    const { data: { user } } = await supabase.auth.getUser()
    console.log(`--- MW AUTH CHECK: ${Date.now() - start0}ms ---`)

    const pathname = request.nextUrl.pathname
    const start = Date.now()
    console.log(`--- MW START: ${pathname} ---`)

    const isPublicPath =
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth')

    // --- Not logged in ---
    if (!user && !isPublicPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        console.log(`--- MW REDIRECT TO LOGIN: ${Date.now() - start}ms ---`)
        return NextResponse.redirect(url)
    }

    // --- Logged in: check approval status ---
    if (user && !isPublicPath) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('status, role')
            .eq('id', user.id)
            .maybeSingle()

        const isPendingPath = pathname.startsWith('/pending')

        if (!profile || profile.status === 'pending') {
            // Force unapproved users to the waiting room
            if (!isPendingPath) {
                const url = request.nextUrl.clone()
                url.pathname = '/pending'
                console.log(`--- MW REDIRECT TO PENDING: ${Date.now() - start}ms ---`)
                return NextResponse.redirect(url)
            }
        } else if (profile.status === 'approved' && isPendingPath) {
            // Approved user wandered back to /pending — send to dashboard
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            console.log(`--- MW REDIRECT TO DASHBOARD: ${Date.now() - start}ms ---`)
            return NextResponse.redirect(url)
        }
    }

    console.log(`--- MW END: ${Date.now() - start}ms ---`)
    return supabaseResponse
}
