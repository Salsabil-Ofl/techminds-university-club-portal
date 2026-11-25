import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

export type FieldValue = string | number;
export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "date" | "select";
  options?: readonly { value: string; label: string }[];
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  hint?: string;
  /** span both columns */
  full?: boolean;
  rows?: number;
};

/** Reusable add/edit dialog driven by a list of field definitions */
export function EntityDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initial,
  saving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial: Record<string, FieldValue>;
  saving?: boolean;
  onSubmit: (values: Record<string, FieldValue>) => void;
}) {
  const [values, setValues] = useState<Record<string, FieldValue>>(initial);

  useEffect(() => {
    if (open) setValues(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (name: string, value: FieldValue) => setValues(v => ({ ...v, [name]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map(f => {
            const id = `field-${f.name}`;
            const value = values[f.name] ?? "";
            return (
              <div key={f.name} className={`flex flex-col gap-1.5 ${f.full || f.type === "textarea" ? "sm:col-span-2" : ""}`}>
                <Label htmlFor={id}>
                  {f.label}
                  {f.required ? <span className="text-destructive"> *</span> : null}
                </Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={id}
                    rows={f.rows ?? 3}
                    value={String(value)}
                    required={f.required}
                    minLength={f.minLength}
                    maxLength={f.maxLength}
                    placeholder={f.placeholder}
                    onChange={e => set(f.name, e.target.value)}
                  />
                ) : f.type === "select" ? (
                  <Select value={String(value)} onValueChange={v => set(f.name, v)}>
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue placeholder="Choose..." />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options?.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={id}
                    type={f.type ?? "text"}
                    value={String(value)}
                    required={f.required}
                    minLength={f.minLength}
                    maxLength={f.maxLength}
                    min={f.min}
                    max={f.max}
                    placeholder={f.placeholder}
                    onChange={e => set(f.name, f.type === "number" ? Number(e.target.value) : e.target.value)}
                  />
                )}
                {f.hint ? <p className="text-xs text-muted-foreground">{f.hint}</p> : null}
              </div>
            );
          })}
          <DialogFooter className="sm:col-span-2 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
