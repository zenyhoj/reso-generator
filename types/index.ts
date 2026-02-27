
export type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue }
    | JsonValue[]

export interface ResolutionSignatory {
    [key: string]: JsonValue
}

export interface Profile {
    id: string
    email: string
    full_name?: string
    bod_position?: string
    role: 'admin' | 'bod_secretary' | 'bod_member'
    status: 'pending' | 'approved'
}

export interface Resolution {
    id: string
    user_id: string
    resolution_number: string
    series_year: number
    title: string
    description?: string
    content: JsonValue // JSONB
    status: 'draft' | 'final' | 'archived'
    signatories: ResolutionSignatory[]
    created_at: string
    updated_at: string
}
