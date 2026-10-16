import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  AuditLogItem,
  DocumentItem,
  FeedbackItem,
  Role,
  SOPTerdampakItem,
  User,
  AgentQueryResponse,
  AgentCitation,
  AgentSourceDoc,
} from './src/types/index.ts';
import {
  INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_FEEDBACK,
  INITIAL_SOP_TERDAMPAK,
  TEAMS,
  USERS,
} from './src/data/mockData.ts';
import {
  canUserDownloadDocument,
  canUserManageDocument,
  canUserReadDocument,
  filterDocumentsForUser,
} from './src/services/accessControl.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gemini Client on Server Side
let geminiClient: GoogleGenAI | null = null;
const rawKey = process.env.GEMINI_API_KEY;
if (rawKey && rawKey !== 'MY_GEMINI_API_KEY' && rawKey.trim() !== '') {
  try {
    geminiClient = new GoogleGenAI({
      apiKey: rawKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize Gemini client:', err);
  }
}

// In-Memory Database State
let documents: DocumentItem[] = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
let sopTerdampak: SOPTerdampakItem[] = JSON.parse(JSON.stringify(INITIAL_SOP_TERDAMPAK));
let auditLogs: AuditLogItem[] = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
let feedbackList: FeedbackItem[] = JSON.parse(JSON.stringify(INITIAL_FEEDBACK));
let jdihStatus = {
  isOnline: true,
  lastSyncTimestamp: '15 Oktober 2026, 08:30 WIB',
  totalIndexed: 4,
  portalUrl: 'https://jdih.komdigi.go.id',
};

// Helper: Get user from request header or query
function getAuthenticatedUser(req: Request): User | null {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  if (!userId) {
    // Default to Super Admin for smooth initial loading
    return USERS[0];
  }
  const user = USERS.find((u) => u.id === userId);
  return user || null;
}

// Helper: Add Audit Log
function logAudit(
  user: User,
  action: string,
  details: string,
  targetDocId?: string,
  targetDocTitle?: string,
  isSensitiveAccess?: boolean
) {
  const newLog: AuditLogItem = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB',
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    teamName: user.teamName,
    action,
    details,
    targetDocId,
    targetDocTitle,
    isSensitiveAccess: Boolean(isSensitiveAccess),
    ipAddress: '10.20.' + Math.floor(Math.random() * 10 + 1) + '.' + Math.floor(Math.random() * 200 + 1),
  };
  auditLogs.unshift(newLog);
}

// ======================== API ROUTES ========================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Users and Teams
app.get('/api/users', (req: Request, res: Response) => {
  res.json({ users: USERS, teams: TEAMS });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Tidak terautentikasi' });
  }
  res.json({ user });
});

// Documents List (strictly filtered by RBAC)
app.get('/api/documents', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Akses ditolak: pengguna belum login' });
  }

  // Filter documents strictly by user permissions
  const accessibleDocs = filterDocumentsForUser(documents, user);

  // Optional query filters
  const { source, type, status, q, teamId } = req.query;
  let filtered = accessibleDocs;

  if (source && source !== 'all') {
    filtered = filtered.filter((d) => d.source === source);
  }
  if (type && type !== 'all') {
    filtered = filtered.filter((d) => d.type === type);
  }
  if (status && status !== 'all') {
    filtered = filtered.filter((d) => d.validityStatus === status);
  }
  if (teamId && teamId !== 'all') {
    filtered = filtered.filter((d) => d.teamId === teamId);
  }
  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.docNumber.toLowerCase().includes(query) ||
        d.summary.toLowerCase().includes(query) ||
        d.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  res.json({
    documents: filtered,
    totalAccessible: filtered.length,
    insights: {
      totalIndexed: accessibleDocs.filter((d) => d.indexStatus === 'terindeks').length,
      affectedOrEvaluationNeeded: sopTerdampak.filter((s) => {
        // Only count if user has access to that SOP
        const doc = documents.find((d) => d.id === s.sopId);
        return doc && canUserReadDocument(user, doc) && s.status === 'perlu_evaluasi';
      }).length,
      lastJdihSync: jdihStatus.lastSyncTimestamp,
      isJdihOnline: jdihStatus.isOnline,
    },
  });
});

// Single Document Detail
app.get('/api/documents/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Akses ditolak: pengguna belum login' });
  }

  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Dokumen tidak ditemukan' });
  }

  if (!canUserReadDocument(user, doc)) {
    logAudit(
      user,
      'UNAUTHORIZED_READ_ATTEMPT',
      `Mencoba membuka dokumen restricted (${doc.docNumber}) tanpa izin yang sesuai.`,
      doc.id,
      doc.title,
      true
    );
    return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki izin untuk melihat dokumen ini' });
  }

  // If Super Admin accesses a sensitive "Hanya Tim" document, record in audit log (PRD NFR-02 item 9)
  if (user.role === 'super_admin' && doc.visibility === 'team_only' && doc.teamId !== user.teamId) {
    logAudit(
      user,
      'SUPER_ADMIN_SENSITIVE_ACCESS',
      `Super Admin membuka dokumen sensitif milik tim ${doc.teamName}.`,
      doc.id,
      doc.title,
      true
    );
  }

  res.json({
    document: doc,
    canDownload: canUserDownloadDocument(user, doc),
    canManage: canUserManageDocument(user, doc),
  });
});

// Download Document (Strict FR-07 & Scenario 7 check)
app.get('/api/documents/:id/download', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Akses ditolak: pengguna belum login' });
  }

  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Dokumen tidak ditemukan' });
  }

  if (!canUserDownloadDocument(user, doc)) {
    logAudit(
      user,
      'UNAUTHORIZED_DOWNLOAD_BLOCKED',
      `Percobaan unduh dokumen ${doc.docNumber} yang izin unduhnya dinonaktifkan.`,
      doc.id,
      doc.title,
      doc.isSensitivePersuratan
    );
    return res.status(403).json({
      error: 'Izin unduh dokumen ini dinonaktifkan oleh Admin Tim. Anda hanya diizinkan membaca dokumen.',
    });
  }

  logAudit(user, 'DOCUMENT_DOWNLOADED', `Mengunduh berkas ${doc.docNumber} (${doc.currentVersion})`, doc.id, doc.title);
  res.json({
    success: true,
    message: 'Izin unduh terverifikasi.',
    downloadUrl: doc.sourceUrl,
    docNumber: doc.docNumber,
    title: doc.title,
  });
});

// Add Document Entry (Drive URL or JDIH)
app.post('/api/documents', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') {
    return res.status(403).json({ error: 'Hanya Admin Tim atau Super Admin yang dapat menambahkan dokumen' });
  }

  const {
    title,
    docNumber,
    year,
    type,
    source,
    sourceUrl,
    visibility,
    sharedWithTeamIds,
    allowDownload,
    summary,
    tags,
    baseRegulations,
    rawText,
    isSensitivePersuratan,
  } = req.body;

  if (!title || !docNumber || !sourceUrl) {
    return res.status(400).json({ error: 'Judul, nomor dokumen, dan tautan wajib diisi' });
  }

  const newDoc: DocumentItem = {
    id: `doc-${Date.now()}`,
    title,
    docNumber,
    year: year || new Date().getFullYear().toString(),
    type: type || 'SOP',
    source: source || 'drive',
    sourceUrl,
    teamId: user.role === 'super_admin' && req.body.teamId ? req.body.teamId : user.teamId,
    teamName: user.role === 'super_admin' && req.body.teamId ? TEAMS.find((t) => t.id === req.body.teamId)?.name || user.teamName : user.teamName,
    visibility: visibility || 'public',
    sharedWithTeamIds: sharedWithTeamIds || [],
    allowDownload: allowDownload ?? true,
    indexStatus: 'terindeks',
    validityStatus: 'berlaku',
    lastSyncDate: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB',
    summary: summary || 'Dokumen resmi terindeks.',
    baseRegulations: baseRegulations || [],
    tags: tags || ['Dokumen Internal'],
    currentVersion: 'v1.0',
    versions: [
      {
        version: 'v1.0',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        changedBy: user.name,
        notes: 'Penerbitan awal dan sinkronisasi teks.',
        fileUrl: sourceUrl,
      },
    ],
    chunks: [
      {
        id: `chk-${Date.now()}-1`,
        sectionOrPasal: 'Ketentuan Utama',
        content: summary || title,
        page: 1,
      },
    ],
    rawText: rawText || `${title}\nNomor: ${docNumber}\nRingkasan: ${summary}`,
    isSensitivePersuratan: Boolean(isSensitivePersuratan),
    uploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  documents.unshift(newDoc);
  logAudit(user, 'DOCUMENT_CREATED', `Menambahkan entri dokumen ${newDoc.docNumber}`, newDoc.id, newDoc.title);

  res.status(201).json({ document: newDoc });
});

// Update Document (Visibility, Download Permission, Metadata, Revision)
app.put('/api/documents/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Belum login' });

  const docIndex = documents.findIndex((d) => d.id === req.params.id);
  if (docIndex === -1) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

  const currentDoc = documents[docIndex];
  if (!canUserManageDocument(user, currentDoc)) {
    return res.status(403).json({ error: 'Anda tidak memiliki hak untuk mengedit dokumen ini' });
  }

  const {
    visibility,
    allowDownload,
    title,
    summary,
    validityStatus,
    tags,
    sharedWithTeamIds,
    newVersionNotes,
  } = req.body;

  const previousVisibility = currentDoc.visibility;
  if (visibility !== undefined) currentDoc.visibility = visibility;
  if (allowDownload !== undefined) currentDoc.allowDownload = allowDownload;
  if (title !== undefined) currentDoc.title = title;
  if (summary !== undefined) currentDoc.summary = summary;
  if (validityStatus !== undefined) currentDoc.validityStatus = validityStatus;
  if (tags !== undefined) currentDoc.tags = tags;
  if (sharedWithTeamIds !== undefined) currentDoc.sharedWithTeamIds = sharedWithTeamIds;

  // Version bump if notes provided
  if (newVersionNotes) {
    const versionParts = currentDoc.currentVersion.replace('v', '').split('.');
    const nextMinor = (parseInt(versionParts[1] || '0', 10) + 1).toString();
    const nextVer = `v${versionParts[0] || '1'}.${nextMinor}`;
    currentDoc.currentVersion = nextVer;
    currentDoc.versions.unshift({
      version: nextVer,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      changedBy: user.name,
      notes: newVersionNotes,
      fileUrl: currentDoc.sourceUrl,
    });
  }

  currentDoc.updatedAt = new Date().toISOString();
  documents[docIndex] = currentDoc;

  // Log action
  let detailMsg = `Memperbarui dokumen ${currentDoc.docNumber}.`;
  if (previousVisibility !== currentDoc.visibility) {
    detailMsg += ` Visibilitas diubah dari ${previousVisibility} menjadi ${currentDoc.visibility}.`;
  }
  logAudit(user, 'DOCUMENT_UPDATED', detailMsg, currentDoc.id, currentDoc.title, currentDoc.isSensitivePersuratan);

  res.json({ document: currentDoc });
});

// Delete or Archive Document
app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Belum login' });

  const doc = documents.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

  if (!canUserManageDocument(user, doc)) {
    return res.status(403).json({ error: 'Anda tidak memiliki hak untuk menghapus dokumen tim ini' });
  }

  documents = documents.filter((d) => d.id !== req.params.id);
  logAudit(user, 'DOCUMENT_DELETED', `Menghapus / mengarsipkan dokumen ${doc.docNumber}`, doc.id, doc.title);
  res.json({ success: true, message: 'Dokumen berhasil dihapus' });
});

// AI AGENT QUERY (RAG Engine with Pre-model Access Filter + Prompt Injection Defense)
app.post('/api/agent/query', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Akses ditolak: silakan login terlebih dahulu' });
  }

  const { query, mode = 'ringkas', scopeFilter = 'all', singleDocId } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Pertanyaan tidak boleh kosong' });
  }

  const cleanQuery = query.trim();

  // 1. PROMPT INJECTION DEFENSE (PRD Bagian 6 Butir 7, Bagian 10 Butir 10, Skenario 4)
  const injectionPatterns = [
    /abaikan (aturan|sistem|perintah|instruksi)/i,
    /tampilkan semua (surat|rahasia|dokumen internal|password|kredensial)/i,
    /override/i,
    /ignore all previous instructions/i,
    /system prompt/i,
    /jailbreak/i,
    /bocorkan/i,
  ];

  const isInjection = injectionPatterns.some((pattern) => pattern.test(cleanQuery));
  if (isInjection) {
    logAudit(
      user,
      'PROMPT_INJECTION_DEFENSE_TRIGGERED',
      `Percobaan manipulasi prompt terdeteksi: "${cleanQuery.slice(0, 100)}". Akses ditolak dan dicatat.`,
      undefined,
      undefined,
      true
    );
    return res.json({
      answer:
        'Permintaan tidak dapat diproses: Sistem mendeteksi adanya upaya manipulasi instruksi keamanan. Sesuai kebijakan tata kelola instansi, isi pertanyaan dan dokumen diperlakukan sebagai data terisolasi. Insiden ini telah dicatat dalam Audit Log Keamanan.',
      mode,
      citations: [],
      sourceDocs: [],
      isNotFound: true,
      contactAdmin: true,
      showJdihBackup: false,
      queryDurationMs: Date.now() - startTime,
    } as AgentQueryResponse);
  }

  // 2. PRE-MODEL ACCESS FILTER (PRD NFR-02 Butir 4: Dokumen di luar hak penanya tidak pernah sampai ke model AI)
  const accessibleDocs = filterDocumentsForUser(documents, user).filter((d) => d.indexStatus === 'terindeks');

  // Check if query is targeting a single document ("Tanya Dokumen Ini" mode)
  let candidateDocs = accessibleDocs;
  if (scopeFilter === 'single_doc' && singleDocId) {
    candidateDocs = accessibleDocs.filter((d) => d.id === singleDocId);
    if (candidateDocs.length === 0) {
      // Document is either non-existent or user is unauthorized!
      // Must respond "tidak ditemukan" without leaking title or existence (PRD Skenario 1)
      logAudit(
        user,
        'UNAUTHORIZED_SINGLE_DOC_QUERY',
        `Kueri diarahkan ke dokumen target yang tidak diizinkan. Agen mengembalikan tidak ditemukan.`,
        singleDocId,
        undefined,
        true
      );
      return res.json({
        answer:
          'Tidak ditemukan sumber yang dapat Anda akses untuk pertanyaan ini. Dokumen mungkin tidak terdaftar atau berada di luar batas izin unit kerja Anda. Silakan hubungi Admin Tim pengelola dokumen untuk permohonan akses.',
        mode,
        citations: [],
        sourceDocs: [],
        isNotFound: true,
        contactAdmin: true,
        showJdihBackup: false,
        queryDurationMs: Date.now() - startTime,
      } as AgentQueryResponse);
    }
  } else if (scopeFilter === 'sop_only') {
    candidateDocs = candidateDocs.filter((d) => d.type === 'SOP' || d.source === 'drive');
  } else if (scopeFilter === 'regulasi_only') {
    candidateDocs = candidateDocs.filter((d) => d.source === 'jdih' || d.type.includes('Peraturan') || d.type.includes('Edaran'));
  }

  // 3. SPECIAL SCENARIO 8 CHECK (JDIH offline / sync disabled & query asks for regulation status)
  const isAskingRegulationStatus =
    /status|berlaku|jdih|peraturan|pmk|permen|undang/i.test(cleanQuery);
  if (!jdihStatus.isOnline && isAskingRegulationStatus) {
    logAudit(
      user,
      'JDIH_OFFLINE_FALLBACK',
      `JDIH sedang offline/sinkronisasi gagal saat kueri regulasi. Agen mengaktifkan panel cadangan JDIH.`
    );
    return res.json({
      answer:
        'Sistem sinkronisasi JDIH saat ini sedang tidak terjangkau (offline / sinkronisasi tertunda > 24 jam). Sesuai ketentuan NFR-09 dan FR-17, AI Agent tidak diperkenankan mengarang atau memastikan status keberlakuan tanpa data JDIH yang segar. Status regulasi saat ini ditandai sebagai [Belum Terverifikasi]. Anda dapat memverifikasi status secara mandiri melalui tautan portal JDIH Komdigi pada panel di samping/bawah.',
      mode,
      citations: [],
      sourceDocs: [],
      warning: {
        type: 'unverified',
        title: 'Status Regulasi Belum Terverifikasi',
        message: 'Koneksi ke JDIH Komdigi terputus. AI Agent mengalihkan ke mode pengecekan manual.',
      },
      isNotFound: false,
      contactAdmin: true,
      showJdihBackup: true,
      jdihBackupReason: 'Koneksi JDIH Komdigi tidak terjangkau atau sinkronisasi lebih dari 24 jam.',
      queryDurationMs: Date.now() - startTime,
    } as AgentQueryResponse);
  }

  // 4. RETRIEVAL & GROUNDING: Find matching documents & chunks
  const queryTokens = cleanQuery
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  interface RankedChunk {
    doc: DocumentItem;
    chunk: DocumentItem['chunks'][0];
    score: number;
  }

  const scoredChunks: RankedChunk[] = [];

  for (const doc of candidateDocs) {
    let docBaseScore = 0;
    const docText = `${doc.title} ${doc.docNumber} ${doc.summary} ${doc.tags.join(' ')}`.toLowerCase();

    for (const token of queryTokens) {
      if (docText.includes(token)) docBaseScore += 2;
    }

    for (const chunk of doc.chunks) {
      let chunkScore = docBaseScore;
      const chunkText = `${chunk.sectionOrPasal} ${chunk.content}`.toLowerCase();
      for (const token of queryTokens) {
        if (chunkText.includes(token)) chunkScore += 3;
      }
      if (chunkScore > 0) {
        scoredChunks.push({ doc, chunk, score: chunkScore });
      }
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  const topChunks = scoredChunks.slice(0, 4);

  // If no matching documents found in user's accessible scope (PRD Bagian 6: Aturan human review)
  if (topChunks.length === 0) {
    logAudit(
      user,
      'AGENT_QUERY_NOT_FOUND',
      `Pertanyaan: "${cleanQuery.slice(0, 80)}" - Sumber tidak ditemukan pada dokumen terindeks yang dapat diakses pengguna.`
    );
    return res.json({
      answer:
        'Tidak ditemukan sumber atau SOP/regulasi yang sesuai dalam arsip terindeks yang diizinkan untuk Anda. AI Agent dilarang berspekulasi atau menggunakan pengetahuan umum di luar dokumen resmi. Silakan hubungi Admin Tim pengelola SOP terkait untuk konfirmasi prosedur lebih lanjut.',
      mode,
      citations: [],
      sourceDocs: [],
      isNotFound: true,
      contactAdmin: true,
      showJdihBackup: isAskingRegulationStatus,
      jdihBackupReason: 'Regulasi yang ditanyakan belum terindeks di Knowledge Base instansi.',
      queryDurationMs: Date.now() - startTime,
    } as AgentQueryResponse);
  }

  // Extract unique matched docs
  const matchedDocsMap = new Map<string, DocumentItem>();
  for (const item of topChunks) {
    matchedDocsMap.set(item.doc.id, item.doc);
  }
  const matchedDocs = Array.from(matchedDocsMap.values());

  // Check for revoked/expired validity status (PRD Halaman 4 Butir 2 & Halaman 17)
  const hasRevoked = matchedDocs.some((d) => d.validityStatus === 'tidak_berlaku');
  const hasUnverified = matchedDocs.some((d) => d.validityStatus === 'belum_terverifikasi');

  let warning: AgentQueryResponse['warning'] = undefined;
  if (hasRevoked) {
    const revokedDoc = matchedDocs.find((d) => d.validityStatus === 'tidak_berlaku')!;
    warning = {
      type: 'revoked_or_expired',
      title: 'Peringatan: Dokumen Acuan Tidak Berlaku',
      message: `Dokumen "${revokedDoc.docNumber}" berstatus TIDAK BERLAKU menurut database JDIH/arsip resmi. Keputusan administratif tidak boleh mengacu pada regulasi yang telah dicabut.`,
      replacementDocs: revokedDoc.replacementDocTitle
        ? [{ id: revokedDoc.replacementDocId || '', title: revokedDoc.replacementDocTitle, number: revokedDoc.replacementDocTitle.split(':')[0] || 'Regulasi Pengganti' }]
        : undefined,
    };
  } else if (hasUnverified) {
    warning = {
      type: 'unverified',
      title: 'Perhatian: Status Regulasi Belum Terverifikasi',
      message: 'Satu atau lebih rujukan belum terverifikasi dengan data sinkronisasi JDIH terbaru. Verifikasi ulang dengan Biro Hukum disarankan.',
    };
  }

  // Build Citations
  const citations: AgentCitation[] = topChunks.map((item, idx) => ({
    citationId: idx + 1,
    docId: item.doc.id,
    docTitle: item.doc.title,
    docNumber: item.doc.docNumber,
    year: item.doc.year,
    sectionOrPasal: item.chunk.sectionOrPasal,
    excerpt: item.chunk.content,
    source: item.doc.source,
    validityStatus: item.doc.validityStatus,
    syncDate: item.doc.lastSyncDate,
    sourceUrl: item.doc.sourceUrl,
  }));

  const sourceDocs: AgentSourceDoc[] = matchedDocs.map((d) => ({
    id: d.id,
    title: d.title,
    docNumber: d.docNumber,
    year: d.year,
    type: d.type,
    source: d.source,
    validityStatus: d.validityStatus,
    syncDate: d.lastSyncDate,
    allowDownload: canUserDownloadDocument(user, d),
    visibility: d.visibility,
    teamName: d.teamName,
  }));

  // Build AI Prompt Grounding
  const promptContext = topChunks
    .map(
      (item, idx) =>
        `[RUJUKAN ${idx + 1}]\n` +
        `Dokumen: ${item.doc.title} (${item.doc.docNumber})\n` +
        `Status Keberlakuan: ${item.doc.validityStatus === 'berlaku' ? 'BERLAKU' : item.doc.validityStatus === 'tidak_berlaku' ? 'TIDAK BERLAKU (DICABUT)' : 'BELUM TERVERIFIKASI'}\n` +
        `Bagian/Pasal: ${item.chunk.sectionOrPasal}\n` +
        `Kutipan Resmi:\n"${item.chunk.content}"\n`
    )
    .join('\n');

  const systemPrompt = `Anda adalah AI Agent SOP dan Regulasi untuk instansi pemerintah.
Tugas Anda: Menjawab pertanyaan administratif pegawai instansi secara akurat, resmi, dan bertanggung jawab HANYA berdasarkan rujukan dokumen terindeks yang diberikan di bawah.

ATURAN WAJIB (STRICT GUARDRAILS):
1. Jawab HANYA menggunakan informasi dari teks rujukan di bawah. DILARANG MENGARANG nomor surat, tahun, pasal, atau prosedur.
2. Gunakan bahasa Indonesia baku dan profesional.
3. Gaya Penjelasan: ${
    mode === 'rinci'
      ? 'Jelaskan secara RINCI dan sistematis LANGKAH DEMI LANGKAH dengan urutan nomor/prosedur yang jelas.'
      : 'Berikan jawaban RINGKAS, padat, langsung pada poin inti administratif dalam 2-3 paragraf pendek.'
  }
4. Wajib menyertakan penanda rujukan seperti [1], [2] pada kalimat yang merujuk rujukan tertentu.
5. Bila dokumen acuan berstatus TIDAK BERLAKU, WAJIB ingatkan pegawai bahwa dokumen tersebut telah dicabut/tidak berlaku dan tunjuk aturan pengganti jika tercantum.
6. Catatan penutup penting: "Catatan: AI Agent bersifat pendukung dan keputusan akhir tetap berada pada pejabat berwenang."

KONTEKS DOKUMEN RESMI TERINDIKASI:
${promptContext}

PERTANYAAN PEGAWAI:
"${cleanQuery}"
`;

  let generatedAnswer = '';

  if (geminiClient) {
    try {
      const generatePromise = geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: systemPrompt,
        config: {
          temperature: 0.1, // Low temperature for high factual accuracy & zero hallucination
        },
      });

      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini timeout')), 3000)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      generatedAnswer = response?.text || '';
    } catch (err: any) {
      console.error('Gemini API call skipped or timed out, using grounded RAG response:', err?.message || err);
    }
  }

  // Fallback high-quality structured answer if API key is not set or network fails
  if (!generatedAnswer) {
    if (mode === 'rinci') {
      generatedAnswer =
        `Berdasarkan dokumen resmi yang terindeks:\n\n` +
        topChunks
          .map(
            (c, i) =>
              `**Langkah ${i + 1}: ${c.chunk.sectionOrPasal}** [${i + 1}]\n${c.chunk.content}`
          )
          .join('\n\n') +
        `\n\n*Catatan: AI Agent bersifat pendukung administratif dan keputusan akhir tetap berada pada pejabat berwenang.*`;
    } else {
      generatedAnswer =
        `Sesuai rujukan resmi pada ${topChunks[0].doc.docNumber} (${topChunks[0].chunk.sectionOrPasal}) [1], ` +
        `${topChunks[0].chunk.content.replace(/\n/g, ' ')}\n\n` +
        (topChunks.length > 1
          ? `Adapun ketentuan pendukung tercantum dalam ${topChunks[1].doc.docNumber} [2]: ${topChunks[1].chunk.content.slice(0, 150)}...\n\n`
          : '') +
        `*Catatan: AI Agent bersifat pendukung administratif dan keputusan akhir tetap berada pada pejabat berwenang.*`;
    }
  }

  // Record successful query audit log
  logAudit(
    user,
    'AI_AGENT_QUERY_SUCCESS',
    `Pertanyaan: "${cleanQuery.slice(0, 80)}" dijawab dengan ${topChunks.length} rujukan (${matchedDocs.map((d) => d.docNumber).join(', ')}).`
  );

  res.json({
    answer: generatedAnswer,
    mode,
    citations,
    sourceDocs,
    warning,
    isNotFound: false,
    contactAdmin: false,
    showJdihBackup: isAskingRegulationStatus && jdihStatus.isOnline,
    queryDurationMs: Date.now() - startTime,
  } as AgentQueryResponse);
});

// SOP Terdampak Dashboard (FR-09)
app.get('/api/sop-terdampak', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') {
    return res.status(403).json({ error: 'Dasbor pembaruan hanya dapat diakses oleh Admin Tim atau Super Admin' });
  }

  let list = sopTerdampak;
  if (user.role === 'admin_tim') {
    // Only see affected SOPs for own team
    list = list.filter((s) => s.teamId === user.teamId);
  }

  res.json({
    items: list,
    summary: {
      total: list.length,
      perluEvaluasi: list.filter((s) => s.status === 'perlu_evaluasi').length,
      sedangDirevisi: list.filter((s) => s.status === 'sedang_direvisi').length,
      selesai: list.filter((s) => s.status === 'selesai').length,
    },
  });
});

app.put('/api/sop-terdampak/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') {
    return res.status(403).json({ error: 'Akses ditolak' });
  }

  const itemIndex = sopTerdampak.findIndex((s) => s.id === req.params.id);
  if (itemIndex === -1) return res.status(404).json({ error: 'Data tidak ditemukan' });

  const item = sopTerdampak[itemIndex];
  if (user.role === 'admin_tim' && user.teamId !== item.teamId) {
    return res.status(403).json({ error: 'Anda hanya dapat mengevaluasi SOP milik tim Anda' });
  }

  const { status, notes } = req.body;
  if (status) item.status = status;
  if (notes) item.notes = notes;
  item.lastEvaluatedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  sopTerdampak[itemIndex] = item;
  logAudit(user, 'SOP_EVALUATION_UPDATED', `Evaluasi SOP ${item.sopNumber} diubah status menjadi "${item.status}"`);

  res.json({ item });
});

// Feedback & Validation (FR-10)
app.get('/api/feedback', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') {
    return res.status(403).json({ error: 'Hanya Admin yang dapat meninjau umpan balik' });
  }

  let list = feedbackList;
  if (user.role === 'admin_tim') {
    list = list.filter((f) => f.userTeam.toLowerCase().includes(user.teamName.toLowerCase()) || f.userTeam.includes(user.teamId));
  }

  res.json({ feedback: list });
});

app.post('/api/feedback', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user) return res.status(401).json({ error: 'Belum login' });

  const { queryText, answerSummary, isHelpful, reportedInaccurate, category, userComment } = req.body;
  const newFeedback: FeedbackItem = {
    id: `fb-${Date.now()}`,
    queryText: queryText || 'Pertanyaan Pengguna',
    answerSummary: answerSummary || '',
    userId: user.id,
    userName: user.name,
    userTeam: user.teamName,
    isHelpful: Boolean(isHelpful),
    reportedInaccurate: Boolean(reportedInaccurate),
    category: category || (reportedInaccurate ? 'sumber_keliru' : undefined),
    userComment: userComment || '',
    status: 'open',
    timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB',
  };

  feedbackList.unshift(newFeedback);
  logAudit(user, 'FEEDBACK_SUBMITTED', `Mengirimkan umpan balik jawaban (${isHelpful ? 'Membantu' : 'Tidak Membantu'})`);

  res.status(201).json({ feedback: newFeedback });
});

app.put('/api/feedback/:id', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') return res.status(403).json({ error: 'Akses ditolak' });

  const fbIndex = feedbackList.findIndex((f) => f.id === req.params.id);
  if (fbIndex === -1) return res.status(404).json({ error: 'Umpan balik tidak ditemukan' });

  const { status, adminNotes } = req.body;
  if (status) feedbackList[fbIndex].status = status;
  if (adminNotes) feedbackList[fbIndex].adminNotes = adminNotes;

  logAudit(user, 'FEEDBACK_REVIEWED', `Admin meninjau laporan umpan balik ${feedbackList[fbIndex].id}`);
  res.json({ feedback: feedbackList[fbIndex] });
});

// Audit Logs (FR-11, NFR-06)
app.get('/api/audit-logs', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') {
    return res.status(403).json({ error: 'Hanya Admin Tim atau Super Admin yang dapat membaca log audit' });
  }

  let logs = auditLogs;
  if (user.role === 'admin_tim') {
    // Admin Tim can only see logs relevant to their team (PRD Matriks Halaman 11)
    logs = logs.filter((l) => l.teamName === user.teamName || l.userId === user.id);
  }

  res.json({ logs });
});

// JDIH Sync API & Offline Toggle for Testing (FR-16, FR-17, Skenario 8)
app.post('/api/jdih/sync', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') {
    return res.status(403).json({ error: 'Hanya Admin yang dapat memicu sinkronisasi JDIH' });
  }

  const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB';
  jdihStatus.lastSyncTimestamp = nowStr;
  jdihStatus.isOnline = true;

  // Update lastSyncDate on JDIH documents
  documents.forEach((d) => {
    if (d.source === 'jdih') {
      d.lastSyncDate = nowStr;
    }
  });

  logAudit(user, 'JDIH_MANUAL_SYNC', 'Memulai sinkronisasi manual ke portal JDIH Komdigi. 4 regulasi berhasil diverifikasi.');
  res.json({
    success: true,
    message: 'Sinkronisasi JDIH Komdigi berhasil diperbarui.',
    status: jdihStatus,
  });
});

app.post('/api/jdih/toggle-offline', (req: Request, res: Response) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role === 'user') {
    return res.status(403).json({ error: 'Hanya Admin yang dapat mengubah simulasi JDIH' });
  }

  jdihStatus.isOnline = !jdihStatus.isOnline;
  if (!jdihStatus.isOnline) {
    jdihStatus.lastSyncTimestamp = '14 Oktober 2026, 02:00 WIB (> 24 Jam yang lalu)';
  } else {
    jdihStatus.lastSyncTimestamp = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB';
  }

  logAudit(
    user,
    'JDIH_STATUS_TOGGLED',
    `Status koneksi JDIH disimulasikan: ${jdihStatus.isOnline ? 'ONLINE' : 'OFFLINE (Gagal Sinkronisasi)'}`
  );

  res.json({
    success: true,
    isOnline: jdihStatus.isOnline,
    lastSyncTimestamp: jdihStatus.lastSyncTimestamp,
  });
});

// Reset Database to Seed (Convenient for test runners)
app.post('/api/test/reset', (req: Request, res: Response) => {
  documents = JSON.parse(JSON.stringify(INITIAL_DOCUMENTS));
  sopTerdampak = JSON.parse(JSON.stringify(INITIAL_SOP_TERDAMPAK));
  auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  feedbackList = JSON.parse(JSON.stringify(INITIAL_FEEDBACK));
  jdihStatus.isOnline = true;
  jdihStatus.lastSyncTimestamp = '15 Oktober 2026, 08:30 WIB';
  res.json({ success: true, message: 'Database reset to initial state' });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const http = await import('http');
  const httpServer = http.createServer(app);

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`Server AI Agent SOP dan Regulasi running on http://localhost:${PORT}`);
  });
}

startServer();
