import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

Deno.serve(async (req) => {
    return new Response(JSON.stringify({ message: "Migration tool disabled for security." }), { status: 200 })
})
