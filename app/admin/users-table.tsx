"use client"

import { useState, useTransition } from "react"
import { approveUser, revokeUser, changeUserRole } from "./actions"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Check, X, RefreshCw } from "lucide-react"

interface Profile {
    id: string
    full_name: string | null
    email: string | null
    bod_position: string | null
    role: string
    status: string
    created_at: string
}

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    bod_secretary: "BOD Secretary (System)",
    bod_member: "BOD Member",
}

const ROLE_BADGE: Record<string, string> = {
    admin: "bg-purple-100 text-purple-700",
    bod_secretary: "bg-blue-100 text-blue-700",
    bod_member: "bg-slate-100 text-slate-700",
}

export function AdminUsersTable({ users }: { users: Profile[] }) {
    const [pending, startTransition] = useTransition()
    const [actingId, setActingId] = useState<string | null>(null)

    const act = (id: string, fn: () => Promise<void>) => {
        setActingId(id)
        startTransition(async () => {
            try {
                await fn()
                toast.success("User updated.")
            } catch (e: any) {
                toast.error(e.message || "Failed to update user.")
            } finally {
                setActingId(null)
            }
        })
    }

    return (
        <div className="rounded-lg border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>BOD Position</TableHead>
                        <TableHead>System Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                No users found.
                            </TableCell>
                        </TableRow>
                    )}
                    {users.map((user) => {
                        const isActing = actingId === user.id && pending
                        return (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.full_name || <span className="italic text-muted-foreground">Unknown</span>}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                                <TableCell>{user.bod_position || "—"}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[user.role] ?? "bg-slate-100 text-slate-700"}`}>
                                        {ROLE_LABELS[user.role] ?? user.role}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === "approved" ? "outline" : "secondary"}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Role selector */}
                                        <Select
                                            defaultValue={user.role}
                                            onValueChange={(v) =>
                                                act(user.id, () => changeUserRole(user.id, v))
                                            }
                                            disabled={isActing}
                                        >
                                            <SelectTrigger className="h-8 w-36 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="bod_secretary">BOD Secretary</SelectItem>
                                                <SelectItem value="bod_member">BOD Member</SelectItem>
                                            </SelectContent>
                                        </Select>

                                        {/* Approve */}
                                        {user.status === "pending" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1 text-green-700 border-green-300 hover:bg-green-50 h-8"
                                                onClick={() =>
                                                    act(user.id, () => approveUser(user.id, user.role))
                                                }
                                                disabled={isActing}
                                            >
                                                <Check className="h-3 w-3" /> Approve
                                            </Button>
                                        )}

                                        {/* Revoke */}
                                        {user.status === "approved" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1 text-red-700 border-red-300 hover:bg-red-50 h-8"
                                                onClick={() =>
                                                    act(user.id, () => revokeUser(user.id))
                                                }
                                                disabled={isActing}
                                            >
                                                <X className="h-3 w-3" /> Revoke
                                            </Button>
                                        )}

                                        {isActing && (
                                            <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
