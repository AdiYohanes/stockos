type CsvText = { text: string };
export const csvText = (value: string): CsvText => ({ text: value });

function cell(value: unknown): string {
  const text = typeof value === "object" && value !== null && "text" in value ? String(value.text) : null;
  let result = text ?? String(value ?? "");
  if ((text !== null || !/^-?\d+(\.\d+)?$/.test(result)) && /^[\s\x00-\x1f\x7f]*[=+\-@]/.test(result)) result = `'${result}`;
  return /[",\r\n\t]/.test(result) || result.startsWith("'") ? `"${result.replace(/"/g, '""')}"` : result;
}

export function buildCsv(headers: string[], rows: Iterable<unknown[]>, maxBytes = 5 * 1024 * 1024): string {
  const lines: string[] = [];
  let bytes = 0;
  const append = (row: unknown[]) => {
    const line = row.map(cell).join(",");
    bytes += new TextEncoder().encode(line).byteLength + (lines.length ? 2 : 0);
    if (bytes > maxBytes) throw new Error("LIMIT_EXCEEDED");
    lines.push(line);
  };
  append(headers);
  for (const row of rows) append(row);
  return lines.join("\r\n");
}
