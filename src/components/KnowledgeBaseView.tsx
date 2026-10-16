import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileText,
  ExternalLink,
  MoreVertical,
  Download,
  MessageSquareCode,
  Edit,
  Trash2,
  RefreshCw,
  Globe,
  HardDrive,
  Users2,
  Lock,
  Tag,
  AlertCircle,
  Copy,
  Check,
  CheckSquare,
  Square,
  ShieldAlert,
} from 'lucide-react';
import { DocumentItem, User } from '../types/index.ts';
import { ValidityBadge, IndexBadge, VisibilityBadge } from './StatusBadge.tsx';
import { api } from '../services/api.ts';

interface KnowledgeBaseViewProps {
  currentUser: User | null;
  onOpenDocDetail: (docId: string) => void;
  onAskDocInAgent: (docId: string) => void;
  onOpenAddDriveModal: () => void;
  onOpenEditDocModal: (doc: DocumentItem) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  currentUser,
  onOpenDocDetail,
  onAskDocInAgent,
  onOpenAddDriveModal,
  onOpenEditDocModal,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [insights, setInsights] = useState({
    totalIndexed: 0,
    affectedOrEvaluationNeeded: 0,
    lastJdihSync: '',
    isJdihOnline: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');

  // Multi-select batch actions (Admin only)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdminTim = currentUser?.role === 'admin_tim';
  const isAnyAdmin = isSuperAdmin || isAdminTim;

  const loadDocuments = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getDocuments({
        source: filterSource !== 'all' ? filterSource : undefined,
        type: filterType !== 'all' ? filterType : undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        teamId: filterTeam !== 'all' ? filterTeam : undefined,
        q: searchQuery.trim() || undefined,
      });
      setDocuments(data.documents);
      setInsights(data.insights);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [filterSource, filterType, filterStatus, filterTeam, currentUser?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleCopyLink = (doc: DocumentItem) => {
    navigator.clipboard.writeText(doc.sourceUrl);
    setCopiedId(doc.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const res = await api.downloadDocument(doc.id);
      alert(`Unduhan berhasil diverifikasi. Membuka berkas: ${res.title}`);
      window.open(res.downloadUrl, '_blank');
    } catch (err: any) {
      alert(`Gagal mengunduh: ${err.message}`);
    }
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mengarsipkan / menghapus dokumen "${doc.docNumber}"?`
      )
    ) {
      return;
    }
    try {
      await api.deleteDocument(doc.id);
      loadDocuments();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDocIds.length === documents.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter((item) => item !== id));
    } else {
      setSelectedDocIds([...selectedDocIds, id]);
    }
  };

  const handleBatchVisibilityChange = async (visibility: 'public' | 'shared' | 'team_only') => {
    if (selectedDocIds.length === 0) return;
    try {
      for (const id of selectedDocIds) {
        await api.updateDocument(id, { visibility });
      }
      setSelectedDocIds([]);
      loadDocuments();
      alert(`Visibilitas ${selectedDocIds.length} dokumen berhasil diperbarui menjadi "${visibility}".`);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title & Insights Row (PRD Halaman 15) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Knowledge Base: SOP dan Regulasi Resmi</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pusat penyimpanan tautan Google Drive dan data sinkronisasi JDIH terpadu dalam satu pintu akses.
          </p>
        </div>

        {/* Add File / Drive Link Button (Admin only - PRD Halaman 15) */}
        {isAnyAdmin && (
          <button
            onClick={onOpenAddDriveModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tautan Drive</span>
          </button>
        )}
      </div>

      {/* Insight KPI Cards (PRD Halaman 15: NFR-08 calculates only allowed docs for users) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Dokumen Terindeks
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
              {insights.totalIndexed}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Dapat diakses oleh akun Anda (NFR-08)
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Regulasi Berubah / Perlu Evaluasi
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 tabular-nums">
              {insights.affectedOrEvaluationNeeded}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              SOP terdampak pencabutan aturan
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Sinkronisasi JDIH Terakhir
            </div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1.5 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  insights.isJdihOnline ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>{insights.lastJdihSync || '15 Okt 2026, 08:30 WIB'}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {insights.isJdihOnline
                ? 'Koneksi JDIH Komdigi Normal'
                : 'Peringatan: Melebihi 24 Jam (Offline)'}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Globe className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata kunci, nomor surat, tahun, atau ringkasan dokumen..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Cari
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Sumber Filter */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="all">Semua Sumber</option>
            <option value="drive">Google Drive (SOP)</option>
            <option value="jdih">JDIH (Regulasi Hukum)</option>
          </select>

          {/* Jenis Dokumen Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="all">Semua Jenis Dokumen</option>
            <option value="SOP">SOP</option>
            <option value="Peraturan Menteri">Peraturan Menteri</option>
            <option value="Surat Edaran">Surat Edaran</option>
            <option value="Naskah Dinas">Naskah Dinas</option>
          </select>

          {/* Status Keberlakuan Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="all">Semua Status Keberlakuan</option>
            <option value="berlaku">Berlaku (JDIH)</option>
            <option value="tidak_berlaku">Tidak Berlaku / Dicabut</option>
            <option value="belum_terverifikasi">Belum Terverifikasi</option>
          </select>

          {/* Tim Pemilik Filter */}
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="all">Semua Tim Pemilik</option>
            <option value="team-hukor">Biro Hukor</option>
            <option value="team-sdm">Biro SDM</option>
            <option value="team-keu">Biro Keuangan</option>
            <option value="team-spbe">Dit. SPBE</option>
            <option value="team-pdsi">PDSI</option>
          </select>

          {/* Reset Filters */}
          {(filterSource !== 'all' ||
            filterType !== 'all' ||
            filterStatus !== 'all' ||
            filterTeam !== 'all' ||
            searchQuery) && (
            <button
              onClick={() => {
                setFilterSource('all');
                setFilterType('all');
                setFilterStatus('all');
                setFilterTeam('all');
                setSearchQuery('');
              }}
              className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline text-xs ml-auto"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Batch Actions Bar for Admins (PRD Halaman 16) */}
      {isAnyAdmin && selectedDocIds.length > 0 && (
        <div className="p-3 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs animate-in fade-in">
          <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            <span>{selectedDocIds.length} Dokumen Dipilih</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-blue-700 dark:text-blue-300">
              Aksi Massal:
            </span>
            <button
              onClick={() => handleBatchVisibilityChange('public')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 font-medium hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-100 text-[11px]"
            >
              Set Publik
            </button>
            <button
              onClick={() => handleBatchVisibilityChange('team_only')}
              className="px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 font-medium hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-100 text-[11px]"
            >
              Set Hanya Tim
            </button>
            <button
              onClick={() => setSelectedDocIds([])}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-[11px]"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                {isAnyAdmin && (
                  <th className="p-3 pl-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {selectedDocIds.length === documents.length &&
                      documents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                )}
                <th className="p-3 pl-4">Judul Dokumen & Ringkasan</th>
                <th className="p-3">Jenis</th>
                <th className="p-3">Sumber</th>
                <th className="p-3">Tim & Tag</th>
                <th className="p-3">Visibilitas</th>
                <th className="p-3">Status Indeks</th>
                <th className="p-3">Status Berlaku</th>
                <th className="p-3">Diperbarui</th>
                <th className="p-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isAnyAdmin ? 10 : 9}
                    className="p-8 text-center text-slate-400"
                  >
                    Memuat daftar dokumen terindeks...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAnyAdmin ? 10 : 9}
                    className="p-8 text-center text-slate-400"
                  >
                    Tidak ada dokumen yang sesuai dengan filter atau batas izin akses Anda.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);
                  const isOwnerOrSuper =
                    isSuperAdmin ||
                    (isAdminTim && doc.teamId === currentUser?.teamId);

                  return (
                    <tr
                      key={doc.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected
                          ? 'bg-blue-50/40 dark:bg-blue-950/20'
                          : ''
                      }`}
                    >
                      {/* Checkbox (Admin Only - PRD Halaman 16) */}
                      {isAnyAdmin && (
                        <td className="p-3 pl-4">
                          <button
                            onClick={() => toggleSelectOne(doc.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}

                      {/* Judul & Ringkasan AI satu baris */}
                      <td className="p-3 pl-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {doc.docNumber} · {doc.summary}
                        </div>
                      </td>

                      {/* Jenis Chip */}
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {doc.type}
                        </span>
                      </td>

                      {/* Sumber */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          {doc.source === 'drive' ? (
                            <>
                              <HardDrive className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Drive</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>JDIH</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Tim Pemilik & Tag Topik */}
                      <td className="p-3 max-w-[140px]">
                        <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200 truncate">
                          {doc.teamName}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {doc.tags.slice(0, 2).join(', ')}
                        </div>
                      </td>

                      {/* Visibilitas */}
                      <td className="p-3 whitespace-nowrap">
                        <VisibilityBadge visibility={doc.visibility} />
                      </td>

                      {/* Status Indeks */}
                      <td className="p-3 whitespace-nowrap">
                        <IndexBadge status={doc.indexStatus} />
                      </td>

                      {/* Status Berlaku (Lencana Keberlakuan PRD) */}
                      <td className="p-3 whitespace-nowrap">
                        <ValidityBadge
                          status={doc.validityStatus}
                          syncDate={doc.lastSyncDate}
                        />
                      </td>

                      {/* Diperbarui */}
                      <td className="p-3 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                        <div>{doc.currentVersion}</div>
                        <div className="text-[10px] text-slate-400">
                          {doc.lastSyncDate.split(',')[0]}
                        </div>
                      </td>

                      {/* Aksi Kolom */}
                      <td className="p-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          <button
                            onClick={() => onOpenDocDetail(doc.id)}
                            className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                          >
                            Buka
                          </button>

                          {/* Three-dot context menu */}
                          <button
                            onClick={() =>
                              setActiveMenuDocId(
                                activeMenuDocId === doc.id ? null : doc.id
                              )
                            }
                            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Menu Lainnya"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu Items */}
                          {activeMenuDocId === doc.id && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setActiveMenuDocId(null)}
                              />
                              <div className="absolute right-0 top-8 w-52 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-40 p-1.5 text-xs text-left space-y-0.5">
                                <button
                                  onClick={() => {
                                    onAskDocInAgent(doc.id);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium"
                                >
                                  <MessageSquareCode className="w-3.5 h-3.5" />
                                  <span>Tanya Dokumen Ini</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleCopyLink(doc);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  {copiedId === doc.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span>Salin Tautan</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleDownload(doc);
                                    setActiveMenuDocId(null);
                                  }}
                                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Unduh Berkas</span>
                                </button>

                                {isOwnerOrSuper && (
                                  <>
                                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                    <button
                                      onClick={() => {
                                        onOpenEditDocModal(doc);
                                        setActiveMenuDocId(null);
                                      }}
                                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                      <span>Edit Metadata & Hak Akses</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        handleDelete(doc);
                                        setActiveMenuDocId(null);
                                      }}
                                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Arsipkan Dokumen</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
