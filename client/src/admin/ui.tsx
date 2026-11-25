import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

/** Page title row used at the top of every dashboard page */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

/** Delete button with a confirmation dialog */
export function ConfirmDelete({
  title,
  description,
  onConfirm,
  disabled,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label="Delete"
          disabled={disabled}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  attended: "bg-sky-100 text-sky-800 border-sky-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={`capitalize ${STATUS_STYLES[status] ?? ""}`}>
      {status}
    </Badge>
  );
}

export function formatDate(value: string | Date | null | undefined, withTime = false) {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value.length === 10 ? value + "T00:00:00" : value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** Turn a tRPC / zod error into one readable line */
export function errorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0]) {
      const issue = parsed[0] as { path?: (string | number)[]; message?: string };
      const field = issue.path?.filter(p => p !== "data").join(".");
      return field ? `${field}: ${issue.message}` : (issue.message ?? raw);
    }
  } catch {
    // not JSON
  }
  return raw;
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center text-sm text-muted-foreground py-10">
        {text}
      </td>
    </tr>
  );
}

/* Choices used by the content forms */
export const COVER_OPTIONS = [
  { value: "cover-1", label: "Mint" },
  { value: "cover-2", label: "Teal" },
  { value: "cover-3", label: "Emerald" },
  { value: "cover-4", label: "Aqua" },
  { value: "cover-5", label: "Forest" },
  { value: "cover-6", label: "Sea" },
];

export const ICON_OPTIONS = [
  "fa-calendar", "fa-robot", "fa-code", "fa-laptop-code", "fa-brain", "fa-microchip", "fa-shield-halved",
  "fa-trophy", "fa-users", "fa-handshake", "fa-lightbulb", "fa-rocket", "fa-mobile-screen", "fa-database",
  "fa-cloud", "fa-chart-line", "fa-bullhorn", "fa-newspaper", "fa-award", "fa-graduation-cap", "fa-palette",
].map(v => ({ value: v, label: v.replace("fa-", "") }));

/* Typed API outputs */
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
export type RouterOutputs = inferRouterOutputs<AppRouter>;
