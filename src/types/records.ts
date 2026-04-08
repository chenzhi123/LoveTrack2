export type StoredRecord = {
  id: string;
  created_at: string;
  text_content: string;
  file_name: string | null;
  mime_type: string | null;
  file_size: number;
  file_data: string | null;
};
