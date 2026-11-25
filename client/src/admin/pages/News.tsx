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
import { ConfirmDelete, COVER_OPTIONS, EmptyRow, errorMessage, formatDate, ICON_OPTIONS, PageHeader, type RouterOutputs } from "../ui";

const CATEGORIES = ["Achievements", "Announcements", "Events", "Partnerships"] as const;

const FIELDS: FieldDef[] = [
  { name: "title", label: "Title", required: true, minLength: 3, maxLength: 200, full: true },
  { name: "category", label: "Category", type: "select", options: CATEGORIES.map(c => ({ value: c, label: c })) },
  { name: "date", label: "Date", type: "date", required: true },
  { name: "icon", label: "Icon", type: "select", options: ICON_OPTIONS },
  { name: "cover", label: "Cover color", type: "select", options: COVER_OPTIONS },
  { name: "excerpt", label: "Excerpt", type: "textarea", required: true, minLength: 5, maxLength: 300, rows: 2 },
  { name: "content", label: "Full article", type: "textarea", required: true, minLength: 10, maxLength: 5000, rows: 6 },
];

type NewsRow = RouterOutputs["admin"]["news"]["list"][number];

export default function NewsPage() {
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.admin.news.list.useQuery();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsRow | null>(null);
  const [query, setQuery] = useState("");

  const done = (msg: string) => {
    toast.success(msg);
    setOpen(false);
    utils.admin.news.list.invalidate();
  };
  const create = trpc.admin.news.create.useMutation({ onSuccess: () => done("News published"), onError: e => toast.error(errorMessage(e)) });
  const update = trpc.admin.news.update.useMutation({ onSuccess: () => done("News updated"), onError: e => toast.error(errorMessage(e)) });
  const remove = trpc.admin.news.delete.useMutation({
    onSuccess: () => {
      toast.success("News deleted");
      utils.admin.news.list.invalidate();
    },
    onError: e => toast.error(errorMessage(e)),
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? data.filter(n => [n.title, n.category, n.excerpt].some(v => v.toLowerCase().includes(q))) : data;
  }, [data, query]);

  const empty: Record<string, FieldValue> = {
    title: "", category: "Announcements", date: new Date().toISOString().slice(0, 10),
    icon: "fa-newspaper", cover: "cover-1", excerpt: "", content: "",
  };

  const submit = (v: Record<string, FieldValue>) => {
    const payload = {
      title: String(v.title), category: v.category as (typeof CATEGORIES)[number], date: String(v.date),
      icon: String(v.icon), cover: v.cover as "cover-1", excerpt: String(v.excerpt), content: String(v.content),
    };
    if (editing) update.mutate({ id: editing.id, data: payload });
    else create.mutate(payload);
  };

  return (
    <>
      <PageHeader
        title="News"
        description="Articles shown on the Home and News pages."
        actions={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> New article
          </Button>
        }
      />
      <Card className="p-4 mb-4 border-emerald-100/80">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search news..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </Card>
      <Card className="p-0 overflow-hidden border-emerald-100/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-emerald-50/70">
              <TableRow>
                <TableHead className="pl-4">Article</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <EmptyRow colSpan={4} text="Loading..." />
              ) : !rows.length ? (
                <EmptyRow colSpan={4} text="No news found." />
              ) : (
                rows.map(n => (
                  <TableRow key={n.id}>
                    <TableCell className="pl-4">
                      <div className="font-medium max-w-[360px] truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground max-w-[360px] truncate">{n.excerpt}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{n.category}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(n.date)}</TableCell>
                    <TableCell className="pr-4 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => { setEditing(n); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <ConfirmDelete title="Delete this article?" description={`"${n.title}" will be removed permanently.`} onConfirm={() => remove.mutate({ id: n.id })} />
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
        title={editing ? "Edit article" : "New article"}
        fields={FIELDS}
        initial={
          editing
            ? { title: editing.title, category: editing.category, date: editing.date, icon: editing.icon, cover: editing.cover, excerpt: editing.excerpt, content: editing.content }
            : empty
        }
        saving={create.isPending || update.isPending}
        onSubmit={submit}
      />
    </>
  );
}
