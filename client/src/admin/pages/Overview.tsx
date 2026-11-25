import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { CalendarDays, ClipboardList, Mail, Users, type LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";
import { EmptyRow, formatDate, PageHeader, StatusBadge } from "../ui";

function Kpi({ label, value, icon: Icon, href, tone }: { label: string; value: number | undefined; icon: LucideIcon; href: string; tone: string }) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-900/5 border-emerald-100/80">
        <CardContent className="flex items-center gap-4 p-5">
          <div className={`h-12 w-12 rounded-xl grid place-items-center ${tone}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {value === undefined ? <Skeleton className="h-7 w-12 mt-1" /> : <p className="text-2xl font-semibold">{value}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function OverviewPage() {
  const { data, isLoading } = trpc.admin.overview.useQuery();
  const chartData = (data?.perEvent ?? []).map(e => ({
    name: e.title.length > 18 ? e.title.slice(0, 17) + "…" : e.title,
    full: e.title,
    Registered: e.registered,
    Seats: e.seats,
  }));

  return (
    <>
      <PageHeader title="Overview" description="A quick look at club activity and registrations." />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Kpi label="Active registrations" value={data?.registrations} icon={ClipboardList} href="/admin/registrations" tone="bg-emerald-100 text-emerald-700" />
        <Kpi label="Unread messages" value={data?.unreadMessages} icon={Mail} href="/admin/messages" tone="bg-violet-100 text-violet-700" />
        <Kpi label="Upcoming events" value={data?.upcomingEvents} icon={CalendarDays} href="/admin/events" tone="bg-teal-100 text-teal-700" />
        <Kpi label="Team members" value={data?.members} icon={Users} href="/admin/members" tone="bg-sky-100 text-sky-700" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-3 border-emerald-100/80">
          <CardHeader>
            <CardTitle className="text-base">Registrations per event</CardTitle>
            <CardDescription>Registered students compared with available seats</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -20, right: 8 }}>
                  <defs>
                    <linearGradient id="mint" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="60%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2f3ec" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { full?: string })?.full ?? ""}
                    contentStyle={{ borderRadius: 10, borderColor: "#bbf7d0" }}
                  />
                  <Bar dataKey="Seats" fill="#e0f2fe" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Registered" fill="url(#mint)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border-emerald-100/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Latest registrations</CardTitle>
              <CardDescription>Most recent sign-ups</CardDescription>
            </div>
            <Link href="/admin/registrations" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Student</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-6 text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <EmptyRow colSpan={3} text="Loading..." />
                ) : !data?.latest.length ? (
                  <EmptyRow colSpan={3} text="No registrations yet." />
                ) : (
                  data.latest.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="pl-6">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">{r.eventTitle ?? "Deleted event"}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right text-xs text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
