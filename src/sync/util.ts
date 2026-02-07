/** biome-ignore-all lint/style/useTemplate: its fine*/
/** biome-ignore-all lint/suspicious/noAssignInExpressions: <explanation> */
import { readFile, stat } from "node:fs/promises";
import { ParquetReader, ParquetSchema, ParquetWriter } from "parquetjs";
import { RowInterface } from "parquetjs/lib/row.interface";

export async function isDirectory(path: string) {
  try {
    const stats = await stat(path);
    if (stats.isDirectory()) {
      return true;
    }
  } catch {
    // Doesn't exist
  }
  return false;
}

export async function isFile(path: string) {
  try {
    const stats = await stat(path);
    if (stats.isFile()) {
      return true;
    }
  } catch {
    // Doesn't exist
  }
  return false;
}

export async function readBinaryFile(path: string) {
  const f = await readFile(path);
  return f;
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function quoteCsv(s: string, separator = ";") {
  if (!s) {
    return s
  }
  let simpleQuotes = false
  let fromScratch = false
  for (let i = 0, n = s.length; i < n; ++i) {
    const c = s.charAt(i)
    if (c === '"') {
      fromScratch = true
    } else if (c === separator || c === '\r' || c === '\n') {
      simpleQuotes = true
    }
  }
  if (fromScratch) {
    let r = '"'
    for (let i = 0, n = s.length; i < n; ++i) {
      const c = s.charAt(i)
      r += c === '"' ? '""' : c
    }
    r += '"'
    s = r
  } else if (simpleQuotes) {
    s = '"' + s + '"'
  }
  return s
}

export function writeCsv(parquetResults: { headers: string[]; records: RowInterface[] }, separator = ";") {
  const { headers, records } = parquetResults;
  let csv = headers.map((h) => quoteCsv(h, separator)).join(separator) + "\n";
  for (const record of records) {
    const row = headers.map((h) => quoteCsv(String(record[h] ?? ""), separator)).join(separator);
    csv += row + "\n";
  }
  return csv;
}

export async function dumpParquetFileAsCsv(filename: string) {
  const parquetResults = await readParquetRecords(filename);
  const csvData = await writeCsv(parquetResults);
  return csvData;
}

export async function readParquetRecords(filename: string) {
  const reader = await ParquetReader.openFile(filename);
  const cursor = reader.getCursor();
  const records = [];

  let record: RowInterface | null = null;
  while ((record = await cursor.next())) {
    records.push(record);
  }

  const schema = reader.getSchema();
  const headers = schema.fieldList.map((field) => field.name);

  await reader.close();
  return { headers, records };
}
