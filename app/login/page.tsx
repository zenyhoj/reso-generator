"use client"

import { useState, Suspense, useActionState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { login, signup } from "./actions"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"

const BOD_POSITIONS = [
    "Admin",
    "BOD Chairman",
    "BOD Vice-Chairman",
    "BOD Secretary",
    "BOD Member",
    "General Manager",
]

function LoginContent() {
    console.log('[CLIENT] LoginContent rendering...')
    const searchParams = useSearchParams()
    const router = useRouter()
    const urlError = searchParams.get("error")
    const activeTab = searchParams.get("tab") === "signup" ? "signup" : "login"

    const [bodPosition, setBodPosition] = useState("")

    const [loginState, loginAction, isLoginPending] = useActionState(login, null)
    const [signupState, signupAction, isSignupPending] = useActionState(signup, null)

    // Effect to clear action states when switching tabs would be complex with useActionState,
    // so we handle the "display error" logic carefully.
    const [lastTab, setLastTab] = useState(activeTab)
    const [manualErrorClear, setManualErrorClear] = useState(false)

    const handleTabChange = (value: string) => {
        router.push(`/login?tab=${value}`)
        setManualErrorClear(true)
        setLastTab(value)
    }

    // Reset manual clear if we've switched
    if (lastTab !== activeTab && manualErrorClear) {
        setManualErrorClear(false)
    }

    const displayError = (manualErrorClear ? null : (loginState?.error || signupState?.error)) || urlError

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-serif">Board Resolution System</CardTitle>
                <CardDescription>
                    Sign in to your account or request access
                </CardDescription>
            </CardHeader>
            <CardContent>
                {displayError && (
                    <div className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{displayError}</span>
                    </div>
                )}

                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                    </TabsList>

                    {/* ── Login Tab ── */}
                    <TabsContent value="login">
                        <form action={loginAction} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    autoComplete="email"
                                    disabled={isLoginPending}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="current-password"
                                    disabled={isLoginPending}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoginPending}>
                                {isLoginPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    "Login"
                                )}
                            </Button>
                        </form>
                    </TabsContent>

                    {/* ── Sign Up Tab ── */}
                    <TabsContent value="signup">
                        <form action={signupAction} className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Full Name</Label>
                                <Input
                                    id="full_name"
                                    name="full_name"
                                    type="text"
                                    placeholder="Juan dela Cruz"
                                    required
                                    autoComplete="name"
                                    disabled={isSignupPending}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="bod_position">BOD Position</Label>
                                <Select
                                    name="bod_position"
                                    value={bodPosition}
                                    onValueChange={setBodPosition}
                                    disabled={isSignupPending}
                                    required
                                >
                                    <SelectTrigger id="bod_position">
                                        <SelectValue placeholder="Select your position" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {BOD_POSITIONS.map((pos) => (
                                            <SelectItem key={pos} value={pos}>
                                                {pos}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {/* Hidden input so formAction can read the value */}
                                <input type="hidden" name="bod_position" value={bodPosition} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="signup_email">Email</Label>
                                <Input
                                    id="signup_email"
                                    name="signup_email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    autoComplete="email"
                                    disabled={isSignupPending}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="signup_password">Password</Label>
                                <Input
                                    id="signup_password"
                                    name="password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    minLength={8}
                                    disabled={isSignupPending}
                                />
                                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="confirm_password">Confirm Password</Label>
                                <Input
                                    id="confirm_password"
                                    name="confirm_password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    minLength={8}
                                    disabled={isSignupPending}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSignupPending}>
                                {isSignupPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Requesting Access...
                                    </>
                                ) : (
                                    "Request Access"
                                )}
                            </Button>
                            <p className="text-xs text-center text-muted-foreground">
                                Your account will be reviewed by an administrator before you can login.
                            </p>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
            <Suspense fallback={
                <Card className="mx-auto max-w-sm w-full h-[400px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </Card>
            }>
                <LoginContent />
            </Suspense>
        </div>
    )
}
