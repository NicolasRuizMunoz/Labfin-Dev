export type FileStatus = 'PENDING' | 'STAGED' | 'CONFIRMED' | 'UPLOADED' | 'ACTIVE' | 'FAILED';

export type FileEntry = {
  id: number;
  organization_id: number;
  licitacion_id?: number | null;
  original_filename: string;
  status: FileStatus;
  is_active: boolean;
  s3_key_original?: string | null;
  s3_key_processed?: string | null;
  uploaded_at: string;               // ISO
  processed_at?: string | null;      // ISO
  file_type?: string | null;
  checksum?: string | null;
};

export type GroupedFiles = Record<FileStatus, FileEntry[]>;
