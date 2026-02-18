
const supabaseUrl = "https://tmiaojrqvgrodgldozcu.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtaWFvanJxdmdyb2RnbGRvemN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNzE2NTQsImV4cCI6MjA4Njk0NzY1NH0.s3pPPnDIsoP2NfDewZ-zvEBEByGzJnlCAeXv6_fMyrs"

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
