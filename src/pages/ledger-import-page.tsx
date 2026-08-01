import * as React from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/auth-context";
import {
  createTransactionsBulk,
  useProperties,
  useUnits,
} from "@/hooks/use-data";
import {
  categoryCheatSheet,
  ledgerCsvTemplate,
  parseLedgerCsv,
  planLedgerImport,
} from "@/lib/csv-import";

export function LedgerImportPage() {
  const { user } = useAuth();
  const properties = useProperties();
  const units = useUnits();
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<{
    readyCount: number;
    issueMessages: string[];
    ready: ReturnType<typeof planLedgerImport>["ready"];
  } | null>(null);
  const [busy, setBusy] = React.useState(false);

  function downloadTemplate() {
    const blob = new Blob([ledgerCsvTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reos-ledger-template.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Template downloaded",
      description: "Edit in Sheets/Excel, then import here.",
      variant: "success",
    });
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const parsed = parseLedgerCsv(text);
    const plan = planLedgerImport(
      parsed,
      properties.data.map((p) => ({ id: p.id, name: p.name })),
      units.data.map((u) => ({
        id: u.id,
        label: u.label,
        property_id: u.property_id,
      })),
    );
    setPreview({
      readyCount: plan.ready.length,
      issueMessages: plan.issues.map((i) => `Line ${i.line}: ${i.message}`),
      ready: plan.ready,
    });
    if (plan.ready.length === 0) {
      toast({
        title: "Nothing to import",
        description: plan.issues[0]?.message ?? "Check the CSV format.",
        variant: "destructive",
      });
    }
  }

  async function onImport() {
    if (!user || !preview?.ready.length) return;
    const ok = window.confirm(
      `Import ${preview.ready.length} ledger line(s)? This adds them — it does not replace existing entries.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const n = await createTransactionsBulk(
        preview.ready.map((r) => ({
          ...r,
          lease_id: null,
          receipt_path: null,
        })),
        user.id,
      );
      toast({
        title: `Imported ${n} lines`,
        description: "Open Ledger to review.",
        variant: "success",
      });
      setPreview(null);
    } catch (err) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Import ledger CSV"
        description="Paste a year of income/expenses from Sheets or Excel in one shot."
        action={
          <Button asChild size="sm" variant="outline">
            <Link to="/transactions">Back to ledger</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p className="font-medium">How to use</p>
          <ol className="list-decimal space-y-1 pl-5 text-[var(--color-muted-foreground)]">
            <li>Create your properties (and units) in REOS first — names must match the CSV.</li>
            <li>Download the template and fill rows in Google Sheets / Excel.</li>
            <li>Export/download as CSV, then import below.</li>
          </ol>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Tip: one line per category per month is enough for taxes/P&amp;L — you
            don’t need every receipt.
          </p>
          <Button type="button" onClick={downloadTemplate}>
            Download CSV template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4 text-sm">
          <p className="font-medium">Columns</p>
          <p className="font-mono text-xs text-[var(--color-muted-foreground)]">
            date, property, type, category, amount_dollars, description, unit
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Dates: YYYY-MM-DD or M/D/YYYY. Type: income or expense (optional if
            category is clear). Unit is optional.
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Categories: {categoryCheatSheet()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={onPickFile}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            Choose CSV file
          </Button>

          {preview ? (
            <div className="space-y-2 text-sm">
              <p>
                Ready to import:{" "}
                <span className="font-semibold">{preview.readyCount}</span>{" "}
                line(s)
              </p>
              {preview.issueMessages.length > 0 ? (
                <div className="max-h-40 overflow-auto rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
                  <p className="mb-1 font-medium">
                    {preview.issueMessages.length} row(s) skipped
                  </p>
                  <ul className="space-y-0.5">
                    {preview.issueMessages.slice(0, 30).map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                    {preview.issueMessages.length > 30 ? (
                      <li>…and more</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
              <Button
                type="button"
                disabled={busy || preview.readyCount === 0}
                onClick={onImport}
              >
                {busy ? "Importing…" : `Import ${preview.readyCount} lines`}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
