import Dexie, { type Table } from "dexie";
import { nanoid } from "nanoid";

export type LocalRecord = {
  id: string;
  created_at: string;
  text_content: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number;
  file_data: string | null;
};

class LocalRecordsDB extends Dexie {
  records!: Table<LocalRecord, string>;

  constructor() {
    super("LoveTrackRecordsLocal");
    this.version(1).stores({
      records: "id, created_at",
    });
  }
}

export const localRecordsDb = new LocalRecordsDB();

export async function addLocalRecord(input: {
  text: string;
  file?: File | null;
}): Promise<LocalRecord> {
  let file_name: string | null = null;
  let mime_type: string | null = null;
  let file_size = 0;
  let file_data: string | null = null;
  if (input.file && input.file.size > 0) {
    file_name = input.file.name;
    mime_type = input.file.type || "application/octet-stream";
    file_size = input.file.size;
    file_data = await blobToBase64(input.file);
  }
  const row: LocalRecord = {
    id: nanoid(),
    created_at: new Date().toISOString(),
    text_content: input.text,
    file_name,
    mime_type,
    file_size,
    file_data,
  };
  await localRecordsDb.records.add(row);
  return row;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result;
      if (typeof s !== "string") {
        reject(new Error("read_failed"));
        return;
      }
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function listLocalRecords(
  sort: "asc" | "desc",
  q: string,
): Promise<LocalRecord[]> {
  let rows = await localRecordsDb.records.toArray();
  rows.sort((a, b) =>
    sort === "asc"
      ? a.created_at.localeCompare(b.created_at)
      : b.created_at.localeCompare(a.created_at),
  );
  const qq = q.trim().toLowerCase();
  if (qq) {
    rows = rows.filter(
      (r) =>
        r.text_content.toLowerCase().includes(qq) ||
        (r.file_name?.toLowerCase().includes(qq) ?? false),
    );
  }
  return rows;
}

export async function deleteLocalRecord(id: string): Promise<void> {
  await localRecordsDb.records.delete(id);
}
