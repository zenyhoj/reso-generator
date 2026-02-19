
import { z } from "zod"

export const signerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    position: z.string().min(1, "Position is required"),
    role: z.enum(["chairman", "vice-chairman", "secretary", "member", "gm"]),
    signature: z.string().optional(),
    signatureUrl: z.string().optional(),
    isCertified: z.boolean().optional(),
    certifiedAt: z.string().optional(),
})

export const resolutionSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
    resolutionNumber: z.string().min(1, "Resolution number is required"),
    seriesYear: z.number().int().min(2000, "Invalid year").max(2100, "Invalid year"),
    description: z.string().optional(),
    heldOn: z.string().optional(),
    approvedOn: z.string().optional(),
    whereasClauses: z.array(z.string().min(5, "Clause cannot be empty")).min(1, "At least one WHEREAS clause is required"),
    resolvedClauses: z.array(z.string().min(5, "Clause cannot be empty")).min(1, "At least one RESOLVED clause is required"),
    signatories: z.array(signerSchema).min(1, "At least one signatory is required"),
})

export type ResolutionFormValues = z.infer<typeof resolutionSchema>
