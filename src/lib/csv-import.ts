import {
  TRANSACTION_CATEGORY_LABELS,
  type TransactionType,
} from "@/types/database";
import { dollarsToCents } from "@/lib/money";
import {
  CAPEX_CATEGORIES,
  DEBT_CATEGORIES,
  DEPOSIT_CATEGORIES,
  OPEX_CATEGORIES,
  REVENUE_CATEGORIES,
} from "@/lib/finance";

const CATEGORY_KEYS = [
  ...REVENUE_CATEGORIES,
  ...DEPOSIT_CATEGORIES,
  ...OPEX_CATEGORIES,
  ...CAPEX_CATEGORIES,
  ...DEBT_CATEGORIES,
] as const;

const LABEL_TO_KEY = new Map<string, string>();
for (const key of CATEGORY_KEYS) {
  LABEL_TO_KEY.set(key.toLowerCase(), key);
  const label = TRANSACTION_CATEGORY_LABELS[key];
  if (label) LABEL_TO_KEY.set(label.toLowerCase(), key);
}
// Common aliases
LABEL_TO_KEY.set("operating expense", "opex");
LABEL_TO_KEY.set("op ex", "opex");
LABEL_TO_KEY.set("property taxes", "property_tax");
LABEL_TO_KEY.set("hoa", "opex");
LABEL_TO_KEY.set("repairs", "maintenance");
LABEL_TO_KEY.set("debt", "debt_service");

export const LEDGER_CSV_HEADERS = [
  "date",
  "property",
  "type",
  "category",
  "amount_dollars",
  "description",
  "unit",
] as const;

export interface ParsedCsvRow {
  line: number;
  date: string;
  property: string;
  type: TransactionType;
  category: string;
  amount_dollars: number;
  description: string;
  unit: string;
}

export interface CsvParseIssue {
  line: number;
  message: string;
}

export interface CsvParseResult {
  rows: ParsedCsvRow[];
  issues: CsvParseIssue[];
}

/** Minimal CSV parser (quoted fields, commas, newlines). */
export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let inQuotes = false;
  const s = text.replace(/^\uFEFF/, "");

  while (i < s.length) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function resolveCategory(raw: string): string | null {
  const key = LABEL_TO_KEY.get(raw.trim().toLowerCase());
  return key ?? null;
}

function resolveType(
  raw: string,
  category: string,
): TransactionType | null {
  const t = raw.trim().toLowerCase();
  if (t === "income" || t === "expense") return t;
  if (!t) {
    if (
      (REVENUE_CATEGORIES as readonly string[]).includes(category) ||
      category === "security_deposit"
    ) {
      return "income";
    }
    return "expense";
  }
  return null;
}

function normalizeDate(raw: string): string | null {
  const v = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const mm = m[1].padStart(2, "0");
    const dd = m[2].padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }
  return null;
}

export function parseLedgerCsv(text: string): CsvParseResult {
  const table = parseCsvText(text);
  const issues: CsvParseIssue[] = [];
  if (table.length === 0) {
    return { rows: [], issues: [{ line: 0, message: "File is empty." }] };
  }

  const header = table[0].map(normalizeHeader);
  const idx = (name: string, aliases: string[] = []) => {
    const names = [name, ...aliases].map(normalizeHeader);
    return header.findIndex((h) => names.includes(h));
  };

  const dateI = idx("date", ["occurred_on", "day"]);
  const propI = idx("property", ["property_name"]);
  const typeI = idx("type");
  const catI = idx("category");
  const amtI = idx("amount_dollars", ["amount", "dollars"]);
  const descI = idx("description", ["memo", "notes"]);
  const unitI = idx("unit", ["unit_label"]);

  if (dateI < 0 || propI < 0 || catI < 0 || amtI < 0) {
    return {
      rows: [],
      issues: [
        {
          line: 1,
          message:
            "Header must include date, property, category, and amount_dollars (see template).",
        },
      ],
    };
  }

  const rows: ParsedCsvRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const line = r + 1;
    const cells = table[r];
    const dateRaw = cells[dateI] ?? "";
    const property = cells[propI] ?? "";
    const typeRaw = typeI >= 0 ? (cells[typeI] ?? "") : "";
    const categoryRaw = cells[catI] ?? "";
    const amountRaw = cells[amtI] ?? "";
    const description = descI >= 0 ? (cells[descI] ?? "") : "";
    const unit = unitI >= 0 ? (cells[unitI] ?? "") : "";

    if (!dateRaw && !property && !categoryRaw && !amountRaw) continue;

    const date = normalizeDate(dateRaw);
    if (!date) {
      issues.push({ line, message: `Bad date "${dateRaw}" (use YYYY-MM-DD).` });
      continue;
    }
    if (!property.trim()) {
      issues.push({ line, message: "Missing property name." });
      continue;
    }
    const category = resolveCategory(categoryRaw);
    if (!category) {
      issues.push({
        line,
        message: `Unknown category "${categoryRaw}".`,
      });
      continue;
    }
    const type = resolveType(typeRaw, category);
    if (!type) {
      issues.push({ line, message: `Bad type "${typeRaw}" (income|expense).` });
      continue;
    }
    const amount = Number.parseFloat(amountRaw.replace(/[$,]/g, ""));
    if (!Number.isFinite(amount) || amount === 0) {
      issues.push({ line, message: `Bad amount "${amountRaw}".` });
      continue;
    }

    rows.push({
      line,
      date,
      property: property.trim(),
      type,
      category,
      amount_dollars: Math.abs(amount),
      description: description.trim(),
      unit: unit.trim(),
    });
  }

  return { rows, issues };
}

export function ledgerCsvTemplate(): string {
  const header = LEDGER_CSV_HEADERS.join(",");
  const sample = [
    "2025-01-01,My Property,income,rent,1200.00,January rent,A",
    "2025-01-05,My Property,expense,insurance,185.00,Hazard policy,",
    "2025-01-15,My Property,expense,maintenance,75.50,Plumbing repair,A",
  ].join("\n");
  return `${header}\n${sample}\n`;
}

export function amountToCents(dollars: number): number {
  return dollarsToCents(dollars);
}

export interface LedgerImportReady {
  property_id: string;
  unit_id: string | null;
  type: TransactionType;
  category: string;
  amount_cents: number;
  occurred_on: string;
  description: string | null;
}

export interface LedgerImportPlan {
  ready: LedgerImportReady[];
  issues: CsvParseIssue[];
}

/** Match CSV rows to existing properties/units. */
export function planLedgerImport(
  parsed: CsvParseResult,
  properties: { id: string; name: string }[],
  units: { id: string; label: string; property_id: string }[],
): LedgerImportPlan {
  const issues = [...parsed.issues];
  const ready: LedgerImportReady[] = [];

  const propByName = new Map(
    properties.map((p) => [p.name.trim().toLowerCase(), p]),
  );

  for (const row of parsed.rows) {
    const property = propByName.get(row.property.toLowerCase());
    if (!property) {
      issues.push({
        line: row.line,
        message: `No property named "${row.property}". Create it first (name must match exactly).`,
      });
      continue;
    }

    let unit_id: string | null = null;
    if (row.unit) {
      const unit = units.find(
        (u) =>
          u.property_id === property.id &&
          u.label.trim().toLowerCase() === row.unit.toLowerCase(),
      );
      if (!unit) {
        issues.push({
          line: row.line,
          message: `No unit "${row.unit}" on ${property.name}.`,
        });
        continue;
      }
      unit_id = unit.id;
    }

    ready.push({
      property_id: property.id,
      unit_id,
      type: row.type,
      category: row.category,
      amount_cents: amountToCents(row.amount_dollars),
      occurred_on: row.date,
      description: row.description || null,
    });
  }

  return { ready, issues };
}

export function categoryCheatSheet(): string {
  return CATEGORY_KEYS.map(
    (k) => `${k} (${TRANSACTION_CATEGORY_LABELS[k] ?? k})`,
  ).join(", ");
}
