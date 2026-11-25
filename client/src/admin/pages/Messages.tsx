import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Mail, MailOpen, Reply, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ConfirmDelete, errorMessage, formatDate, PageHeader } from "../ui";

export default function MessagesPage() {
  const utils = trpc.useUtils();
  const { data = [], isLoading } = trpc.admin.messages.list.useQuery();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const refresh = () => {
    utils.admin.messages.list.invalidate();
    utils.admin.overview.invalidate();
  };
  const setRead = trpc.admin.messages.setRead.useMutation({ onSuccess: refresh, onError: e => toast.error(errorMessage(e)) });
  const remove = trpc.admin.messages.delete.useMutation({
    onSuccess: () => {
      toast.success("Message deleted");
      refresh();
    },
    onError: e => toast.error(errorMessage(e)),
  });

  const unread = data.filter(m => !m.isRead).length;
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter(m => {
      if (filter === "unread" && m.isRead) return false;
      if (filter === "read" && !m.isRead) return false;
      return !q || [m.name, m.email, m.subject, m.message].some(v => v.toLowerCase().includes(q));
    });
  }, [data, filter, query]);

  const toggleOpen = (id: number, isRead: boolean) => {
    setOpenId(prev => (prev === id ? null : id));
    if (!isRead) setRead.mutate({ id, isRead: true });
  };

  return (
    <>
      <PageHeader title="Messages" description={`${unread} unread of ${data.length} messages from the contact form.`} />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread {unread ? `(${unread})` : ""}</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search messages..." value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : !rows.length ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No messages here.
            </CardContent>
          </Card>
        ) : (
          rows.map(m => (
            <Card key={m.id} className={`transition-all border-emerald-100/80 ${!m.isRead ? "border-l-4 border-l-emerald-500 bg-emerald-50/40" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <button className="flex-1 min-w-0 text-left" onClick={() => toggleOpen(m.id, m.isRead)}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`truncate ${m.isRead ? "font-medium" : "font-semibold"}`}>{m.subject}</span>
                      {!m.isRead ? <Badge className="bg-emerald-500 hover:bg-emerald-500">New</Badge> : null}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {m.name} · {m.email} · {formatDate(m.createdAt, true)}
                    </div>
                    {openId === m.id ? (
                      <p className="mt-3 text-sm whitespace-pre-wrap leading-relaxed rounded-lg bg-background border p-3">{m.message}</p>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{m.message}</p>
                    )}
                  </button>
                  <div className="flex items-center shrink-0">
                    <Button variant="ghost" size="icon" asChild aria-label="Reply by email">
                      <a href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: " + m.subject)}`}>
                        <Reply className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={m.isRead ? "Mark as unread" : "Mark as read"}
                      onClick={() => setRead.mutate({ id: m.id, isRead: !m.isRead })}
                    >
                      {m.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                    </Button>
                    <ConfirmDelete title="Delete this message?" description={`Message from ${m.name} will be removed permanently.`} onConfirm={() => remove.mutate({ id: m.id })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
