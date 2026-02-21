
// @ts-ignore: Deno module imports
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

// ─── Security: Restrict CORS to your actual deployment origin ───────────────
// Set SITE_URL in Supabase Edge Function secrets. Falls back to localhost for dev.
const allowedOrigin = Deno.env.get('SITE_URL') || 'http://localhost:3000'

const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Input sanitisation constants ────────────────────────────────────────────
const MAX_PROMPT_LENGTH = 1000
const MAX_CONTEXT_LENGTH = 500

function sanitizeInput(input: string, maxLength: number): string {
    return String(input)
        .slice(0, maxLength)
        .replace(/[<>]/g, '') // strip angle brackets to reduce injection surface
        .trim()
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Check Environment Variables
        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiKey) {
            throw new Error("Missing GEMINI_API_KEY environment variable")
        }

        // 2. Auth Check
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        )

        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 3. Parse Request Body
        let requestData
        try {
            requestData = await req.json() as any
        } catch (e) {
            throw new Error("Invalid request body. Expected JSON.")
        }

        const { prompt, context } = requestData

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required" }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Sanitize user inputs to prevent prompt injection
        const sanitizedPrompt = sanitizeInput(String(prompt), MAX_PROMPT_LENGTH)
        const sanitizedContext = context ? sanitizeInput(String(context), MAX_CONTEXT_LENGTH) : "None"

        const systemInstruction = `You are an expert legal assistant for a Philippine Water District.
    Your task is to generate a Board Resolution based on the user's request.
    
    Adhere strictly to this structure:
    1. Title: Uppercase, concise, starting with "APPROVING...", "AUTHORIZING...", etc.
    2. WHEREAS clauses: Context and justification. Start each with "WHEREAS,".
    3. RESOLVED clauses: The action taken. Start with "RESOLVED," or "RESOLVED FURTHER,".
    
    Output strictly valid JSON (and NOTHING else) in this format:
    {
      "title": "STRING",
      "resolutionNumber": "STRING (suggest a placeholder if unknown)",
      "seriesYear": NUMBER (current year),
      "whereasClauses": ["STRING", "STRING"],
      "resolvedClauses": ["STRING", "STRING"],
      "description": "STRING (A brief, one-sentence summary of what this resolution is about. e.g. 'A resolution approving the budget for...')"
    }
    
    Do not include markdown formatting like \`\`\`json. Just the raw JSON object.`;

        const fullPrompt = `${systemInstruction}\n\nTask: ${sanitizedPrompt}\nContext: ${sanitizedContext}`;

        // 5. Call Gemini API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: fullPrompt }]
                    }]
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json() as any;
            // Log full details server-side, return safe message to client
            console.error("Gemini API Error:", JSON.stringify(errorData));
            throw new Error(`Gemini API request failed (${response.status})`);
        }

        const data = await response.json() as any;
        // Debug logging only enabled in dev — never log raw AI output in production
        if (Deno.env.get('DEBUG') === 'true') {
            console.log("Gemini Raw Response:", JSON.stringify(data));
        }

        const responseContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseContent) {
            throw new Error("No content generated by AI.");
        }

        // 6. Parse Response
        let parsedResponse
        try {
            // Remove any potential markdown code blocks
            const cleanContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedResponse = JSON.parse(cleanContent)
        } catch (e) {
            // Log raw content server-side only
            console.error("Failed to parse JSON from AI response")
            throw new Error("AI generated invalid JSON. Please try again.")
        }

        // 7. Return Success Response
        return new Response(JSON.stringify(parsedResponse), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        // Log the full error server-side, never expose details to the client
        console.error("Edge Function Error:", error)
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
