
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileText, Settings, LogOut, Shield } from "lucide-react"
import { signout } from "@/app/login/actions"

interface MainNavProps {
    role?: string
}

export function MainNav({ role }: MainNavProps) {
    const pathname = usePathname()

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

                    <nav className="flex items-center gap-1">
                        <Link href="/dashboard">
                            <Button variant="ghost" className={cn("gap-2", pathname === "/dashboard" && "bg-slate-100 dark:bg-slate-800")}>
                                <FileText className="w-4 h-4" />
                                Dashboard
                            </Button>
                        </Link>
                        {(role === "admin" || role === "bod_secretary") && (
                            <Link href="/settings">
                                <Button variant="ghost" className={cn("gap-2", pathname === "/settings" && "bg-slate-100 dark:bg-slate-800")}>
                                    <Settings className="w-4 h-4" />
                                    Settings
                                </Button>
                            </Link>
                        )}
                        {role === "admin" && (
                            <Link href="/admin">
                                <Button variant="ghost" className={cn("gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50", pathname === "/admin" && "bg-purple-50 dark:bg-purple-900/20")}>
                                    <Shield className="w-4 h-4" />
                                    Admin
                                </Button>
                            </Link>
                        )}
                    </nav>
                </div>

                <form>
                    <Button formAction={signout} variant="ghost" size="sm" className="text-muted-foreground gap-2">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </header>
    )
}
