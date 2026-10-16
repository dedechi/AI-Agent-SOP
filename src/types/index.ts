export type Role = 'super_admin' | 'admin_tim' | 'user';

export interface User {
  id: string;
  name: string;
  nip: string;
  email: string;
  role: Role;
  teamId: string;
  teamName: string;
  avatar: string;
  position: string;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  description: string;
  adminIds: string[];
  memberCount: number;
}

export type DocSource = 'drive' | 'jdih';

export type DocType =
  | 'SOP'
  | 'Surat Edaran'
  | 'Peraturan Menteri'
  | 'Keputusan Menteri'
  | 'Peraturan Pemerintah'
  | 'Undang-Undang'
  | 'Naskah Dinas';

export type DocVisibility = 'public' | 'shared' | 'team_only';
export type IndexStatus = 'terindeks' | 'menunggu' | 'gagal';
export type ValidityStatus = 'berlaku' | 'tidak_berlaku' | 'belum_terverifikasi';

export interface DocumentChunk {
  id: string;
  sectionOrPasal: string;
  content: string;
  page?: number;
}

export interface DocVersion {
  version: string;
  date: string;
  changedBy: string;
  notes: string;
  fileUrl: string;
}

export interface BaseRegulationRef {
  id: string;
  title: string;
  number: string;
  year: string;
  validityStatus: ValidityStatus;
  statusKeterangan?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  docNumber: string;
  year: string;
  type: DocType;
  source: DocSource;
  sourceUrl: string;
  teamId: string;
  teamName: string;
  visibility: DocVisibility;
  sharedWithTeamIds: string[]; // for 'shared' visibility
  allowDownload: boolean; // separate from read permission
  indexStatus: IndexStatus;
  validityStatus: ValidityStatus;
  lastSyncDate: string; // e.g. "15 Oktober 2026, 08:30 WIB"
  summary: string;
  baseRegulations?: BaseRegulationRef[];
  replacementDocId?: string;
  replacementDocTitle?: string;
  tags: string[];
  currentVersion: string;
  versions: DocVersion[];
  chunks: DocumentChunk[];
  rawText: string;
  isSensitivePersuratan?: boolean;
  uploadedAt: string;
  updatedAt: string;
}

export interface SOPTerdampakItem {
  id: string;
  sopId: string;
  sopTitle: string;
  sopNumber: string;
  teamId: string;
  teamName: string;
  baseRegId: string;
  baseRegTitle: string;
  baseRegNumber: string;
  changeReason: string;
  severity: 'tinggi' | 'sedang' | 'rendah';
  status: 'perlu_evaluasi' | 'sedang_direvisi' | 'selesai';
  lastEvaluatedDate?: string;
  notes?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  teamName: string;
  action: string;
  targetDocId?: string;
  targetDocTitle?: string;
  details: string;
  isSensitiveAccess?: boolean;
  ipAddress?: string;
}

export interface FeedbackItem {
  id: string;
  queryText: string;
  answerSummary: string;
  userId: string;
  userName: string;
  userTeam: string;
  isHelpful: boolean;
  reportedInaccurate: boolean;
  category?: 'sumber_keliru' | 'status_kadaluarsa' | 'langkah_tidak_lengkap' | 'lainnya';
  userComment?: string;
  adminNotes?: string;
  status: 'open' | 'reviewed' | 'resolved';
  timestamp: string;
}

export interface AgentCitation {
  citationId: number;
  docId: string;
  docTitle: string;
  docNumber: string;
  year: string;
  sectionOrPasal: string;
  excerpt: string;
  source: DocSource;
  validityStatus: ValidityStatus;
  syncDate: string;
  sourceUrl: string;
}

export interface AgentSourceDoc {
  id: string;
  title: string;
  docNumber: string;
  year: string;
  type: DocType;
  source: DocSource;
  validityStatus: ValidityStatus;
  syncDate: string;
  allowDownload: boolean;
  visibility: DocVisibility;
  teamName: string;
}

export interface AgentQueryResponse {
  answer: string;
  mode: 'ringkas' | 'rinci';
  citations: AgentCitation[];
  sourceDocs: AgentSourceDoc[];
  warning?: {
    type: 'revoked_or_expired' | 'unverified' | 'mixed_status';
    title: string;
    message: string;
    replacementDocs?: { id: string; title: string; number: string }[];
  };
  isNotFound: boolean;
  contactAdmin: boolean;
  showJdihBackup: boolean;
  jdihBackupReason?: string;
  queryDurationMs: number;
}
