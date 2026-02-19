
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tmiaojrqvgrodgldozcu.supabase.co"
const supabaseKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function check() {
    console.log("Checking policies via migrate-profiles function...")
    try {
        const res = await fetch(`${supabaseUrl}/functions/v1/migrate-profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        })

        if (!res.ok) {
            console.error("Error Status:", res.status)
            console.error("Error Text:", await res.text())
            return
        }

        const data = await res.json()
        console.log("Response Data:", JSON.stringify(data, null, 2))
    } catch (e) {
        console.error("Fetch error:", e)
    }
}

check()
