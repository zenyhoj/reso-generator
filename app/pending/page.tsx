import { signout } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { Clock, LogOut } from "lucide-react"

export default function PendingPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <div className="mx-auto max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-serif font-bold tracking-tight">
                        Account Pending Approval
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Your account registration has been received. An administrator will review and approve your access shortly.
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        You will be able to log in once your account has been approved.
                    </p>
                </div>
                <form>
                    <Button formAction={signout} variant="outline" className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </form>
            </div>
        </div>
    )
}
