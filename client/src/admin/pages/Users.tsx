import { useAuth } from "@/_core/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ShieldCheck, ShieldOff, Info } from "lucide-react";
import { toast } from "sonner";
import { EmptyRow, errorMessage, formatDate, PageHeader } from "../ui";

export default function UsersPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.admin.users.list.useQuery();
  const adminCount = data.filter(u => u.role === "admin").length;
  const setRole = trpc.admin.users.setRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.admin.users.list.invalidate();
    },
    onError: e => toast.error(errorMessage(e)),
  });

  return (
    <>
      <PageHeader title="Users & roles" description="Everyone who has signed in. Only admins can open this dashboard." />
      <Alert className="mb-4 border-emerald-200 bg-emerald-50/60">
        <Info className="h-4 w-4" />
        <AlertTitle>How to add another admin</AlertTitle>
        <AlertDescription>
          Ask the person to open /admin and sign in once. Their account will then appear below and you can make them an admin.
        </AlertDescription>
      </Alert>
      <Card className="p-0 overflow-hidden border-emerald-100/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-emerald-50/70">
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead className="pr-4 text-right">Permission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <EmptyRow colSpan={4} text="Loading..." />
              ) : !data.length ? (
                <EmptyRow colSpan={4} text="No users yet." />
              ) : (
                data.map(u => {
                  const isSelf = u.id === user?.id;
                  const isAdmin = u.role === "admin";
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="pl-4">
                        <div className="font-medium">
                          {u.name || "Unnamed user"} {isSelf ? <span className="text-xs text-muted-foreground">(you)</span> : null}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.email || "-"}</div>
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Admin</Badge>
                        ) : (
                          <Badge variant="secondary">User</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(u.lastSignedIn, true)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        {isAdmin ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSelf || adminCount <= 1 || setRole.isPending}
                            title={isSelf ? "You cannot remove your own admin role" : adminCount <= 1 ? "At least one admin must remain" : undefined}
                            onClick={() => setRole.mutate({ id: u.id, role: "user" })}
                          >
                            <ShieldOff className="h-4 w-4" /> Revoke admin
                          </Button>
                        ) : (
                          <Button size="sm" disabled={setRole.isPending} onClick={() => setRole.mutate({ id: u.id, role: "admin" })}>
                            <ShieldCheck className="h-4 w-4" /> Make admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
