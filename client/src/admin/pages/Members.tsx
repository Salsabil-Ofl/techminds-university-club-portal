import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EntityDialog, type FieldDef, type FieldValue } from "../EntityDialog";
import { ConfirmDelete, EmptyRow, errorMessage, PageHeader, type RouterOutputs } from "../ui";

const GROUPS = ["Board", "Technical", "Media", "Events", "Members"] as const;

const FIELDS: FieldDef[] = [
  { name: "name", label: "Full name", required: true, minLength: 3, maxLength: 120, full: true },
  { name: "role", label: "Role", required: true, placeholder: "e.g. President" },
  { name: "group", label: "Team", type: "select", options: GROUPS.map(g => ({ value: g, label: g })) },
  { name: "dept", label: "Department", placeholder: "Optional" },
  { name: "year", label: "Year / level", placeholder: "Optional" },
  { name: "studentId", label: "Student ID", placeholder: "Optional; 6–10 digits" },
  { name: "linkedinUrl", label: "LinkedIn URL", type: "text", placeholder: "https://www.linkedin.com/in/…" },
  { name: "githubUrl", label: "GitHub URL", type: "text", placeholder: "https://github.com/…" },
  { name: "sortOrder", label: "Display order", type: "number", min: 0, max: 9999, hint: "Lower numbers appear first" },
];

const EMPTY: Record<string, FieldValue> = { name: "", role: "", group: "Members", dept: "", year: "", studentId: "", linkedinUrl: "", githubUrl: "", sortOrder: 0 };

type MemberRow = RouterOutputs["admin"]["members"]["list"][number];

export default function MembersPage() {
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.admin.members.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [query, setQuery] = useState("");

  const refresh = () => {
    utils.admin.members.list.invalidate();
    utils.admin.overview.invalidate();
  };
  const done = (msg: string) => {
    toast.success(msg);
    setOpen(false);
    refresh();
  };
  const create = trpc.admin.members.create.useMutation({ onSuccess: () => done("Member added"), onError: e => toast.error(errorMessage(e)) });
  const update = trpc.admin.members.update.useMutation({ onSuccess: () => done("Member updated"), onError: e => toast.error(errorMessage(e)) });
  const remove = trpc.admin.members.delete.useMutation({
    onSuccess: () => {
      toast.success("Member removed");
      refresh();
    },
    onError: e => toast.error(errorMessage(e)),
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? data.filter(m => [m.name, m.role, m.dept, m.group].some(v => v.toLowerCase().includes(q))) : data;
  }, [data, query]);

  const submit = (v: Record<string, FieldValue>) => {
    const payload = {
      name: String(v.name), role: String(v.role), group: v.group as (typeof GROUPS)[number],
      dept: String(v.dept), year: String(v.year), studentId: String(v.studentId ?? ""),
      linkedinUrl: String(v.linkedinUrl ?? ""), githubUrl: String(v.githubUrl ?? ""), sortOrder: Number(v.sortOrder) || 0,
    };
    if (editing) update.mutate({ id: editing.id, data: payload });
    else create.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="Members"
        description="The club team shown on the Members page."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Add member
          </Button>
        }
      />
      <Card className="p-4 mb-4 border-emerald-100/80">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search members..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </Card>
      <Card className="p-0 overflow-hidden border-emerald-100/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-emerald-50/70">
              <TableRow>
                <TableHead className="pl-4">Member</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <EmptyRow colSpan={5} text="Loading..." />
              ) : !rows.length ? (
                <EmptyRow colSpan={5} text="No members found." />
              ) : (
                rows.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-300 to-teal-500 text-white text-xs font-semibold">
                            {m.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{m.group}</Badge></TableCell>
                    <TableCell>{m.dept}</TableCell>
                    <TableCell>{m.year}</TableCell>
                    <TableCell className="pr-4 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(m); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete title="Remove this member?" description={`${m.name} will be removed from the team list.`} onConfirm={() => remove.mutate({ id: m.id })} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <EntityDialog
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit member" : "Add member"}
        fields={FIELDS}
        initial={editing ? { name: editing.name, role: editing.role, group: editing.group, dept: editing.dept, year: editing.year, studentId: editing.studentId ?? "", linkedinUrl: editing.linkedinUrl ?? "", githubUrl: editing.githubUrl ?? "", sortOrder: editing.sortOrder } : EMPTY}
        saving={create.isPending || update.isPending}
        onSubmit={submit}
      />
    </>
  );
}
