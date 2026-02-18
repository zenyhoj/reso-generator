
const apiKey = process.env.NEXT_GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API Key found in env");
    process.exit(1);
}

async function listModels() {
    console.log("Checking models with key ending in...", apiKey.slice(-4));

    // Try v1beta
    console.log("\n--- API v1beta ---");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.error("Error:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }

    // Try v1
    console.log("\n--- API v1 ---");
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.error("Error:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

listModels();
