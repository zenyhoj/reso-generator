Deno.serve(async () => {
    return new Response(JSON.stringify({ message: "Migration tool disabled for security." }), { status: 200 })
})
