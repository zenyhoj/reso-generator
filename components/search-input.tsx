
"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

export function SearchInput() {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set("query", term)
        } else {
            params.delete("query")
        }
        router.replace(`${pathname}?${params.toString()}`)
    }, 300)

    return (
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Search resolutions..."
                className="pl-8"
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get("query")?.toString()}
            />
        </div>
    )
}
