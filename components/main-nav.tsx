
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileText, Settings, LogOut } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export function MainNav() {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <header className="border-b bg-white dark:bg-slate-950 dark:border-slate-800">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                        <div className="bg-slate-900 text-white w-8 h-8 rounded-md flex items-center justify-center font-serif">
                            R
                        </div>
                        Resolutions
                    </Link>

                    <nav className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" className={cn("gap-2", pathname === "/dashboard" && "bg-slate-100 dark:bg-slate-800")}>
                                <FileText className="w-4 h-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/settings">
                            <Button variant="ghost" className={cn("gap-2", pathname === "/settings" && "bg-slate-100 dark:bg-slate-800")}>
                                <Settings className="w-4 h-4" />
                                Settings
                            </Button>
                        </Link>
                    </nav>
                </div>

                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground gap-2">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
            </div>
        </header>
    )
}
