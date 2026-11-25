import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete, EmptyRow, errorMessage, formatDate, PageHeader } from "../ui";

const STATUSES = ["confirmed", "attended", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

function csvCell(value: unknown) {
  const text = String(value ?? "");
  // guard against spreadsheet formula injection
  const safe = /^[=+\-@]/.test(text) ? "'" + text : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export default function RegistrationsPage() {
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.admin.registrations.list.useQuery();
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const refresh = () => {
    utils.admin.registrations.list.invalidate();
    utils.admin.overview.invalidate();
  };
  const setStatus = trpc.admin.registrations.setStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated");
      refresh();
    },
    onError: e => toast.error(errorMessage(e)),
  });
  const remove = trpc.admin.registrations.delete.useMutation({
    onSuccess: () => {
      toast.success("Registration deleted");
      refresh();
    },
    onError: e => toast.error(errorMessage(e)),
  });

  const events = useMemo(() => {
    const map = new Map<number, string>();
    data.forEach(r => map.set(r.eventId, r.eventTitle ?? `Event #${r.eventId}`));
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(r => {
      if (eventFilter !== "all" && String(r.eventId) !== eventFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return [r.name, r.email, r.ticket, r.studentId, r.phone, r.department].some(v => v?.toLowerCase().includes(q));
    });
  }, [data, query, eventFilter, statusFilter]);

  const exportCsv = () => {
    const header = ["Ticket", "Name", "Student ID", "Email", "Phone", "Department", "Level", "Event", "Event date", "Status", "Registered at", "Notes"];
    const lines = rows.map(r =>
      [r.ticket, r.name, r.studentId, r.email, r.phone, r.department, r.level, r.eventTitle, r.eventDate, r.status, new Date(r.createdAt).toISOString(), r.notes]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob(["\uFEFF" + [header.map(csvCell).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title="Registrations"
        description={`${data.length} total registrations. Update attendance or export the list.`}
        actions={
          <Button onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />
      <Card className="p-4 mb-4 border-emerald-100/80">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_180px] gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, email, ticket, student ID..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {events.map(e => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map(s => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>
      <Card className="p-0 overflow-hidden border-emerald-100/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-emerald-50/70">
              <TableRow>
                <TableHead className="pl-4">Ticket</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <EmptyRow colSpan={7} text="Loading..." />
              ) : !rows.length ? (
                <EmptyRow colSpan={7} text="No registrations match your filters." />
              ) : (
                rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="pl-4 font-mono text-xs">{r.ticket}</TableCell>
                    <TableCell>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID {r.studentId} · {r.department} · {r.level}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">{r.eventTitle ?? "Deleted event"}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(r.eventDate)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{r.email}</div>
                      <div className="text-xs text-muted-foreground">{r.phone}</div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt, true)}</TableCell>
                    <TableCell>
                      <Select value={r.status} onValueChange={v => setStatus.mutate({ id: r.id, status: v as Status })}>
                        <SelectTrigger size="sm" className="w-[130px] capitalize">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="capitalize">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <ConfirmDelete
                        title="Delete this registration?"
                        description={`${r.name} (${r.ticket}) will be removed permanently.`}
                        onConfirm={() => remove.mutate({ id: r.id })}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-3 text-xs text-muted-foreground border-t">
          Showing {rows.length} of {data.length}
        </div>
      </Card>
    </>
  );
}
