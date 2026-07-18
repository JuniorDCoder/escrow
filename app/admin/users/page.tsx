import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllUsers } from "@/lib/data/admin";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateShort } from "@/lib/utils";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user: me },
  } = await supabase.auth.getUser();
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} accounts.</p>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{formatDateShort(u.created_at)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {u.is_admin && <Badge>Admin</Badge>}
                    {u.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                    <Badge variant="outline">KYC: {u.kyc_status}</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <UserRowActions
                    userId={u.id}
                    isSuspended={u.is_suspended}
                    kycStatus={u.kyc_status}
                    isAdmin={u.is_admin}
                    isSelf={u.id === me?.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
