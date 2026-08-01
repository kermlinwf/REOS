import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useOpsLists } from "@/hooks/use-ops";
import {
  demoExportBackupJson,
  demoImportBackup,
} from "@/lib/demo-store";

export function BackupPage() {
  const { properties, transactions, units, reload } = useOpsLists();
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  function downloadBackup() {
    const json = demoExportBackupJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const day = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `reos-backup-${day}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Backup downloaded",
      description: "Save it in Files / iCloud so you can restore later.",
      variant: "success",
    });
  }

  async function copyBackup() {
    try {
      await navigator.clipboard.writeText(demoExportBackupJson());
      toast({
        title: "Copied to clipboard",
        description: "You can paste this into Notes or AirDrop it.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not copy",
        description: "Use Download backup instead.",
        variant: "destructive",
      });
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const ok = window.confirm(
      "Restore will replace ALL data on this device with the backup. Continue?",
    );
    if (!ok) return;

    setBusy(true);
    try {
      const text = await file.text();
      const store = demoImportBackup(text);
      reload();
      toast({
        title: "Backup restored",
        description: `${store.properties.length} properties · ${store.transactions.length} ledger lines`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Restore failed",
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
        title="Backup & restore"
        description="Move your portfolio between home-screen apps or phones. Data stays on your device until you export it."
      />

      <Card>
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium">On this device now</p>
          <p className="text-[var(--color-muted-foreground)]">
            {properties.length} properties · {units.length} units ·{" "}
            {transactions.length} ledger lines
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <p className="font-medium">Old home-screen app (no Backup button)?</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Open this recovery page in Safari (or any browser tab). It reads
              the same phone storage and can download your JSON even when the
              old app UI is stuck:
            </p>
            <p className="mt-2 text-sm">
              <a
                className="font-medium text-[var(--color-primary)] underline"
                href={`${import.meta.env.BASE_URL}recover.html`}
              >
                Open recover.html
              </a>
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              If that page says empty, your data is locked inside the old icon’s
              private storage — do not delete the icon. Use a Mac + Safari Web
              Inspector, or open recover.html from a context that shares that
              storage.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <p className="font-medium">1. Export from the app that has your data</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Prefer Safari: open{" "}
              <span className="font-medium text-[var(--color-foreground)]">
                kermlinwf.github.io/REOS/
              </span>
              , pull to refresh, confirm your ledger is there, then Download
              here. (If Safari is empty, use recover.html above.)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={downloadBackup}>
              Download backup
            </Button>
            <Button type="button" variant="outline" onClick={copyBackup}>
              Copy JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div>
            <p className="font-medium">2. Restore into the updated app</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Open the new home-screen icon → Backup & restore → Restore from
              file → pick the JSON you saved.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json,text/plain"
            className="hidden"
            onChange={onPickFile}
          />
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? "Restoring…" : "Restore from file"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
