// RFC-style quoted CSV fields, including commas and newlines inside quotes.
export function parseStudentCsv(text: string) {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (c === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift()?.map(h => h.replace(/^\uFEFF/, '')) || [];
  if (!headers.includes('name') || !headers.includes('email')) throw new Error('CSV headers must include name and email.');
  if (!rows.length || rows.length > 100) throw new Error('Upload 1–100 students at a time.');
  return rows.map((values, i) => { if (values.length !== headers.length) throw new Error(`Row ${i + 2} has the wrong number of columns.`); return Object.fromEntries(headers.map((h, index) => [h, values[index]])); });
}
