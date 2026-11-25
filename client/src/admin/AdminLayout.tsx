import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  CalendarDays,
  ClipboardList,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Newspaper,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { errorMessage } from "./ui";

const NAV = [
  {
    group: "Dashboard",
    items: [{ label: "Overview", path: "/admin", icon: LayoutDashboard }],
  },
  {
    group: "Activity",
    items: [
      { label: "Registrations", path: "/admin/registrations", icon: ClipboardList },
      { label: "Messages", path: "/admin/messages", icon: Mail, badge: "unread" as const },
    ],
  },
  {
    group: "Content",
    items: [
      { label: "Events", path: "/admin/events", icon: CalendarDays },
      { label: "Members", path: "/admin/members", icon: Users },
      { label: "News", path: "/admin/news", icon: Newspaper },
    ],
  },
  {
    group: "Security",
    items: [{ label: "Users & roles", path: "/admin/users", icon: UserCog }],
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-violet-500 text-white grid place-items-center font-bold shadow-md shadow-emerald-500/30">
        TM
      </div>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <div className="font-semibold leading-tight truncate">TechMinds</div>
        <div className="text-xs text-muted-foreground leading-tight">Admin dashboard</div>
      </div>
    </div>
  );
}

/** Centered card used for sign-in / access screens */
function GateCard({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-gradient-to-br from-emerald-50 via-sky-50 to-violet-50">
      <Card className="w-full max-w-md shadow-xl shadow-emerald-900/5 border-emerald-100">{children}</Card>
    </div>
  );
}

function SignInScreen() {
  return (
    <GateCard>
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-violet-500 text-white grid place-items-center shadow-lg shadow-emerald-500/30">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">TechMinds Admin</CardTitle>
        <CardDescription>Sign in with your account to manage the club portal. Only admins can open the dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button size="lg" className="w-full" onClick={() => startLogin()}>
          Sign in
        </Button>
        <Button variant="ghost" asChild>
          <a href="/home.html">Back to the website</a>
        </Button>
      </CardContent>
    </GateCard>
  );
}

function AccessScreen({ name, onLogout }: { name: string; onLogout: () => void }) {
  const utils = trpc.useUtils();
  const setup = trpc.auth.setupAvailable.useQuery();
  const [code, setCode] = useState("");
  const claim = trpc.auth.claimAdmin.useMutation({
    onSuccess: async () => {
      toast.success("You are now the admin of this dashboard.");
      await utils.auth.me.invalidate();
    },
    onError: e => toast.error(errorMessage(e)),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    claim.mutate({ code });
  };

  return (
    <GateCard>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center">
          {setup.data?.available ? <KeyRound className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
        </div>
        <CardTitle className="text-xl">{setup.data?.available ? "Activate admin access" : "Access denied"}</CardTitle>
        <CardDescription>
          {setup.data?.available
            ? `Hi ${name}. Enter the one-time setup code to become the first admin.`
            : `Hi ${name}. Your account does not have admin permission. Ask a club admin to grant you access.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {setup.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : setup.data?.available ? (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Setup code"
              autoComplete="off"
              className="text-center tracking-[0.3em] font-mono uppercase"
              required
              minLength={6}
            />
            <Button type="submit" disabled={claim.isPending}>
              {claim.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Activate
            </Button>
          </form>
        ) : null}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" asChild>
            <a href="/home.html">Website</a>
          </Button>
          <Button variant="ghost" className="flex-1" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </CardContent>
    </GateCard>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen grid place-items-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <SignInScreen />;
  if (user.role !== "admin") {
    return <AccessScreen name={user.name || "there"} onLogout={() => logout()} />;
  }

  return (
    <SidebarProvider>
      <AdminSidebar name={user.name || "Admin"} email={user.email || ""} onLogout={() => logout()} />
      <SidebarInset className="bg-gradient-to-br from-emerald-50/60 via-sky-50/50 to-violet-50/60 min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-white/70 backdrop-blur-xl px-4">
          <SidebarTrigger />
          <div className="h-5 w-px bg-border" />
          <span className="text-sm text-muted-foreground truncate">TechMinds Club Portal</span>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex border-violet-200 bg-violet-50 text-violet-700">
              <ShieldCheck className="h-3 w-3 mr-1" /> Admin
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <a href="/home.html" target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">View website</span>
              </a>
            </Button>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminSidebar({ name, email, onLogout }: { name: string; email: string; onLogout: () => void }) {
  const [location] = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const overview = trpc.admin.overview.useQuery(undefined, { staleTime: 30_000 });
  const unread = overview.data?.unreadMessages ?? 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center px-3">
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        {NAV.map(section => (
          <SidebarGroup key={section.group}>
            <SidebarGroupLabel>{section.group}</SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map(item => {
                const active = item.path === "/admin" ? location === "/admin" || location === "/admin/" : location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label} className="h-10">
                      <Link href={item.path} onClick={() => isMobile && setOpenMobile(false)}>
                        <item.icon className={active ? "text-primary" : ""} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {"badge" in item && unread > 0 ? (
                      <SidebarMenuBadge className="bg-emerald-500 text-white rounded-full">{unread}</SidebarMenuBadge>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-lg p-1.5 hover:bg-sidebar-accent w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-9 w-9 border border-emerald-200">
                <AvatarFallback className="bg-emerald-100 text-emerald-800 font-medium">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground truncate">{email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/home.html">
                <ExternalLink className="h-4 w-4" /> Website
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
