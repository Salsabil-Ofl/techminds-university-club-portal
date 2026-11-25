import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Pencil, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EntityDialog, type FieldDef, type FieldValue } from "../EntityDialog";
import { ConfirmDelete, COVER_OPTIONS, EmptyRow, errorMessage, formatDate, ICON_OPTIONS, PageHeader, type RouterOutputs } from "../ui";

const CATEGORIES = ["Workshop", "Competition", "Seminar", "Networking"] as const;

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true, minLength: 3, maxLength: 160, full: true },
  { name: "category", label: "Category", type: "select", options: CATEGORIES.map(c => ({ value: c, label: c })) },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "time", label: "Time", required: true, placeholder: "10:00 AM - 2:00 PM" },
  { name: "location", label: "Location", required: true, placeholder: "Main Hall, Building A" },
  { name: "speaker", label: "Speaker", placeholder: "Optional" },
  { name: "seats", label: "Seats", type: "number", required: true, min: 1, max: 5000 },
  { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
  { name: "cover", label: "Cover color", type: "select", options: COVER_OPTIONS },
  { name: "short", label: "Short summary", type: "textarea", required: true, minLength: 5, maxLength: 300, rows: 2 },
  { name: "description", label: "Full description", type: "textarea", required: true, minLength: 10, maxLength: 5000, rows: 4 },
  { name: "agenda", label: "Agenda", type: "textarea", maxLength: 3000, rows: 4, hint: "One agenda item per line" },
];

const EMPTY: Record<string, FieldValue> = {
  title: "", category: "Workshop", date: "", time: "", location: "", speaker: "", seats: 50,
  icon: "fa-calendar", cover: "cover-1", short: "", description: "", agenda: "",
};

type EventRow = RouterOutputs["admin"]["events"]["list"][number];

export default function EventsPage() {
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.admin.events.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [query, setQuery] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const done = (msg: string) => {
    toast.success(msg);
    setOpen(false);
    utils.admin.events.list.invalidate();
    utils.admin.overview.invalidate();
  };
  const create = trpc.admin.events.create.useMutation({ onSuccess: () => done("Event created"), onError: e => toast.error(errorMessage(e)) });
  const update = trpc.admin.events.update.useMutation({ onSuccess: () => done("Event updated"), onError: e => toast.error(errorMessage(e)) });
  const remove = trpc.admin.events.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted");
      utils.admin.events.list.invalidate();
      utils.admin.overview.invalidate();
    },
    onError: e => toast.error(errorMessage(e)),
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? data.filter(e => [e.title, e.location, e.category, e.speaker].some(v => v.toLowerCase().includes(q))) : data;
  }, [data, query]);

  const initial = editing
    ? {
        title: editing.title, category: editing.category, date: editing.date, time: editing.time,
        location: editing.location, speaker: editing.speaker, seats: editing.seats, icon: editing.icon,
        cover: editing.cover, short: editing.short, description: editing.description, agenda: editing.agenda,
      }
    : EMPTY;

  const submit = (v: Record<string, FieldValue>) => {
    const payload = {
      title: String(v.title), category: v.category as (typeof CATEGORIES)[number], date: String(v.date),
      time: String(v.time), location: String(v.location), speaker: String(v.speaker ?? ""), seats: Number(v.seats),
      icon: String(v.icon), cover: v.cover as "cover-1", short: String(v.short), description: String(v.description),
      agenda: String(v.agenda ?? ""),
    };
    if (editing) update.mutate({ id: editing.id, data: payload });
    else create.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="Events"
        description="Add, edit or remove club events. Changes appear on the website immediately."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New event
          </Button>
        }
      />
      <Card className="p-4 mb-4 border-emerald-100/80">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search events..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </Card>
      <Card className="p-0 overflow-hidden border-emerald-100/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-emerald-50/70">
              <TableRow>
                <TableHead className="pl-4">Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="min-w-[160px]">Seats</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <EmptyRow colSpan={5} text="Loading..." />
              ) : !rows.length ? (
                <EmptyRow colSpan={5} text="No events found." />
              ) : (
                rows.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-4">
                      <div className="font-medium max-w-[260px] truncate">{e.title}</div>
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant="secondary">{e.category}</Badge>
                        {e.date < today ? (
                          <Badge variant="outline" className="text-muted-foreground">Past</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-200 text-emerald-700">Upcoming</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div>{formatDate(e.date)}</div>
                      <div className="text-xs text-muted-foreground">{e.time}</div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{e.location}</TableCell>
                    <TableCell>
                      <div className="text-xs mb-1">{e.registered} / {e.seats}</div>
                      <Progress value={Math.min(100, (e.registered / e.seats) * 100)} className="h-2" />
                    </TableCell>
                    <TableCell className="pr-4 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(e); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete
                        title="Delete this event?"
                        description={`"${e.title}" and its ${e.registered} registration(s) will be removed permanently.`}
                        onConfirm={() => remove.mutate({ id: e.id })}
                      />
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
        title={editing ? "Edit event" : "New event"}
        fields={FIELDS}
        initial={initial}
        saving={create.isPending || update.isPending}
        onSubmit={submit}
      />
    </>
  );
}
