import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const newSignatories = [
    { name: "ELIZABETH A. ENCINADA", position: "BOD Chairman", role: "chairman", signatureUrl: "" },
    { name: "FLORIDA A. HORDISTA", position: "BOD Vice-Chairman", role: "vice-chairman", signatureUrl: "" },
    { name: "JOANNA CLYDE A. ESPINA", position: "BOD Secretary", role: "secretary", signatureUrl: "" },
    { name: "IVAN C. NAKILA", position: "BOD Member", role: "member", signatureUrl: "" },
    { name: "JANE R. PLAZA", position: "BOD Member", role: "member", signatureUrl: "" },
    { name: "ELISA B. ALIBAY", position: "General Manager", role: "gm", signatureUrl: "" }
];

async function main() {
    console.log("Updating signatories in organization_settings...");

    const { data, error } = await supabase
        .from('organization_settings')
        .update({
            signatories: newSignatories,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1);

    if (error) {
        console.error("Error updating organization settings:", error.message);
    } else {
        console.log("Successfully added the requested signatories.");
    }
}

main().catch(console.error);
