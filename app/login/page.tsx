
import { login } from './actions'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-serif">Board Resolution System</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>
                        <Button formAction={login} className="w-full">
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
