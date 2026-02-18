
export interface Profile {
    id: string
    email: string
    full_name?: string
    water_district_name: string
    role: 'admin' | 'editor' | 'viewer'
}

export interface Resolution {
    id: string
    user_id: string
    resolution_number: string
    series_year: number
    title: string
    description?: string
    content: any // JSONB
    status: 'draft' | 'final' | 'archived'
    signatories: any[]
    created_at: string
    updated_at: string
}
