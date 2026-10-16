import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  Building,
  HardDrive,
  Globe,
  Download,
  MessageSquareCode,
  AlertTriangle,
  History,
  FileCheck,
  ShieldCheck,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { DocumentItem, User } from '../types/index.ts';
import { ValidityBadge, IndexBadge, VisibilityBadge } from './StatusBadge.tsx';
import { api } from '../services/api.ts';

interface DocumentDetailModalProps {
  docId: string | null;
  onClose: () => void;
  onAskDocInAgent: (docId: string) => void;
  currentUser: User | null;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  docId,
  onClose,
  onAskDocInAgent,
  currentUser,
}) => {
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [canDownload, setCanDownload] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'versions' | 'relations'>('preview');

  useEffect(() => {
    if (!docId) return;
    setIsLoading(true);
    setErrorMsg(null);
    api
      .getDocumentById(docId)
      .then((data) => {
        setDoc(data.document);
        setCanDownload(data.canDownload);
        setCanManage(data.canManage);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Gagal memuat dokumen');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [docId]);

  if (!docId) return null;

  const handleDownload = async () => {
    if (!doc) return;
    try {
      const res = await api.downloadDocument(doc.id);
      alert(`Unduhan terverifikasi. Membuka tautan berkas: ${res.title}`);
      window.open(res.downloadUrl, '_blank');
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                {doc?.type || 'Dokumen'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {doc?.docNumber}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {doc?.title || 'Detail Dokumen'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Memeriksa hak akses dan memuat metadata dokumen...
            </div>
          ) : errorMsg ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : doc ? (
            <>
              {/* Metadata Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Status Berlaku
                  </div>
                  <div className="mt-1">
                    <ValidityBadge status={doc.validityStatus} />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Visibilitas
                  </div>
                  <div className="mt-1">
                    <VisibilityBadge visibility={doc.visibility} />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Tim Pemilik
                  </div>
                  <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {doc.teamName}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Versi Terkini
                  </div>
                  <div className="mt-1 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {doc.currentVersion}
                  </div>
                </div>
              </div>

              {/* Status Warning Banner if Revoked / Expired */}
              {doc.validityStatus === 'tidak_berlaku' && (
                <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20 text-xs text-rose-900 dark:text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Dokumen Ini Berstatus Tidak Berlaku (Dicabut)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Dokumen ini tidak boleh dijadikan rujukan aktif tindakan administratif.
                    {doc.replacementDocTitle && (
                      <span className="block mt-1">
                        <strong>Dokumen Pengganti:</strong> {doc.replacementDocTitle}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Tabs for Preview, Versions, Relations */}
              <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`pb-2 transition-colors border-b-2 ${
                    activeTab === 'preview'
                      ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pratinjau Teks Dokumen
                </button>
                <button
                  onClick={() => setActiveTab('versions')}
                  className={`pb-2 transition-colors border-b-2 ${
                    activeTab === 'versions'
                      ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Riwayat Versi ({doc.versions.length})
                </button>
                <button
                  onClick={() => setActiveTab('relations')}
                  className={`pb-2 transition-colors border-b-2 ${
                    activeTab === 'relations'
                      ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Regulasi Dasar & Relasi ({doc.baseRegulations?.length || 0})
                </button>
              </div>

              {/* Tab Content: Preview */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {doc.rawText || doc.summary}
                  </div>

                  {doc.chunks.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        Pasal / Bagian Terindeks ke AI Agent:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {doc.chunks.map((chk) => (
                          <div
                            key={chk.id}
                            className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                          >
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {chk.sectionOrPasal}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3">
                              "{chk.content}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Content: Versions (PRD FR-06: Riwayat versi tanpa menimpa) */}
              {activeTab === 'versions' && (
                <div className="space-y-3">
                  {doc.versions.map((ver, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                            {ver.version}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{ver.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          {ver.notes}
                        </p>
                        <div className="text-[10px] text-slate-400">
                          Oleh: {ver.changedBy}
                        </div>
                      </div>

                      <a
                        href={ver.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Buka versi ini"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Content: Relations & Base Regulations */}
              {activeTab === 'relations' && (
                <div className="space-y-3 text-xs">
                  {(!doc.baseRegulations || doc.baseRegulations.length === 0) ? (
                    <div className="p-4 text-center text-slate-400">
                      Tidak ada regulasi dasar hukum yang ditautkan pada dokumen ini.
                    </div>
                  ) : (
                    doc.baseRegulations.map((reg) => (
                      <div
                        key={reg.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {reg.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Nomor: {reg.number} ({reg.year})
                          </div>
                          {reg.statusKeterangan && (
                            <div className="text-[11px] text-rose-600 font-medium">
                              {reg.statusKeterangan}
                            </div>
                          )}
                        </div>
                        <ValidityBadge status={reg.validityStatus} />
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer Actions (PRD FR-07: Download permission enforced) */}
        {doc && (
          <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onAskDocInAgent(doc.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <MessageSquareCode className="w-4 h-4" />
                <span>Tanya Dokumen Ini di AI Agent</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {canDownload ? (
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Berkas Asli</span>
                </button>
              ) : (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs cursor-not-allowed border border-slate-200 dark:border-slate-700"
                  title="Izin unduh dinonaktifkan oleh Admin Tim. Anda hanya diizinkan membaca secara online."
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Izin Unduh Dinonaktifkan</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
