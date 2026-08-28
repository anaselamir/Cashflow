export type ParsedRow = { date: string; text: string; amount: number };

export type BankCsvFormat = "lcl" | "ubs";

function splitCsvLine(line: string, delimiter = ";"): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      fields.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  fields.push(cur);
  return fields;
}

function parseFrenchNumber(raw: string): number | null {
  const cleaned = raw.replace(/[\s ]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseDdMmYyyy(raw: string): string | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * LCL-style export: `ENTITE;COMPTE;DEVISE;DATE;VALEUR;LIBELLE;DEBIT;CREDIT`
 * DEBIT/CREDIT are unsigned French-formatted numbers in separate columns.
 * ENTITE is the account holder name — used as the bank label, since one LCL
 * export exists per underlying account.
 */
function parseLclCsv(content: string): { bank: string | null; rows: ParsedRow[] } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { bank: null, rows: [] };

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toUpperCase());
  const entiteIdx = header.indexOf("ENTITE");
  const dateIdx = header.indexOf("DATE");
  const libelleIdx = header.indexOf("LIBELLE");
  const debitIdx = header.indexOf("DEBIT");
  const creditIdx = header.indexOf("CREDIT");

  if (dateIdx === -1 || libelleIdx === -1 || debitIdx === -1 || creditIdx === -1) {
    throw new Error(
      "Unrecognized LCL CSV header — expected columns ENTITE;COMPTE;DEVISE;DATE;VALEUR;LIBELLE;DEBIT;CREDIT"
    );
  }

  let bank: string | null = null;
  const rows: ParsedRow[] = [];
  for (const line of lines.slice(1)) {
    const fields = splitCsvLine(line);
    const date = parseDdMmYyyy(fields[dateIdx] ?? "");
    if (!date) continue;

    if (!bank && entiteIdx !== -1) {
      const entite = (fields[entiteIdx] ?? "").trim();
      if (entite) bank = entite;
    }

    const text = (fields[libelleIdx] ?? "").trim();
    const debit = parseFrenchNumber(fields[debitIdx] ?? "");
    const credit = parseFrenchNumber(fields[creditIdx] ?? "");
    const amount = debit !== null ? -debit : credit;
    if (amount === null) continue;

    rows.push({ date, text, amount });
  }
  return { bank, rows };
}

/**
 * UBS-style export: preamble metadata lines, then a header starting with
 * "Date de transaction". Débit/Crédit are already signed, dot-decimal.
 * Rows with an empty "Date de transaction" are itemized sub-lines of the
 * previous batch transaction (see "Sous-montant") and must be skipped —
 * importing them too would double-count the batch's total debit.
 */
function parseUbsCsv(content: string): ParsedRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  const headerIdx = lines.findIndex((l) => l.startsWith("Date de transaction"));
  if (headerIdx === -1) {
    throw new Error(
      'Unrecognized UBS CSV — expected a header row starting with "Date de transaction"'
    );
  }

  const header = splitCsvLine(lines[headerIdx]).map((h) => h.trim());
  const dateIdx = header.indexOf("Date de transaction");
  const debitIdx = header.indexOf("Débit");
  const creditIdx = header.indexOf("Crédit");
  const desc1Idx = header.indexOf("Description1");
  const desc2Idx = header.indexOf("Description2");

  const rows: ParsedRow[] = [];
  for (const line of lines.slice(headerIdx + 1)) {
    const fields = splitCsvLine(line);
    const date = (fields[dateIdx] ?? "").trim();
    if (!date) continue; // sub-line breakdown of a batch transaction, not its own movement

    const debit = fields[debitIdx]?.trim() ? Number(fields[debitIdx]) : null;
    const credit = fields[creditIdx]?.trim() ? Number(fields[creditIdx]) : null;
    const amount = debit !== null && Number.isFinite(debit)
      ? debit
      : credit !== null && Number.isFinite(credit)
        ? credit
        : null;
    if (amount === null) continue;

    const desc1 = (fields[desc1Idx] ?? "").replace(/;/g, ", ").trim();
    const desc2 = (fields[desc2Idx] ?? "").trim();
    const text = desc1 || desc2 || "(no description)";

    rows.push({ date, text, amount });
  }
  return rows;
}

function detectFormat(content: string): BankCsvFormat {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.some((l) => l.startsWith("Date de transaction"))) return "ubs";

  const firstHeaderCols = splitCsvLine(lines[0] ?? "")
    .map((h) => h.trim().toUpperCase());
  if (
    firstHeaderCols.includes("ENTITE") &&
    firstHeaderCols.includes("DEBIT") &&
    firstHeaderCols.includes("CREDIT")
  ) {
    return "lcl";
  }

  throw new Error(
    "Unrecognized CSV format — expected an LCL export (ENTITE;COMPTE;...) or a UBS export (starts with a \"Date de transaction\" header)."
  );
}

export function parseAnyBankCsv(content: string): {
  format: BankCsvFormat;
  bank: string;
  rows: ParsedRow[];
} {
  const format = detectFormat(content);

  if (format === "ubs") {
    return { format, bank: "UBS", rows: parseUbsCsv(content) };
  }

  const { bank, rows } = parseLclCsv(content);
  return { format, bank: bank ?? "LCL (unknown account)", rows };
}
