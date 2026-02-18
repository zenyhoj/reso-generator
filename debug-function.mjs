
import { createClient } from '@supabase/supabase-js'
// import dotenv from 'dotenv'

// Load env vars
const SUPABASE_URL = 'https://tmiaojrqvgrodgldozcu.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_ANON_KEY) {
    console.error("Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in this script or environment")
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testFunction() {
    console.log("Invoking generate-resolution...")
    const { data, error } = await supabase.functions.invoke('generate-resolution', {
        body: { prompt: "Test resolution for debugging", context: "Debug context" }
    })

    if (error) {
        console.error("Function Error:", error)
        if (error instanceof Error && 'context' in error) {
            // @ts-ignore
            console.error("Error Context:", await error.context.json())
        }
    } else {
        console.log("Success! Data:", data)
    }
}

testFunction()
