import React, { useState, useEffect } from 'react';
import {
  MessageSquareHeart,
  ThumbsUp,
  ThumbsDown,
  Flag,
  CheckCircle,
  Clock,
  Sparkles,
  Users,
  Search,
  MessageCircle,
} from 'lucide-react';
import { FeedbackItem, User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface UmpanBalikViewProps {
  currentUser: User | null;
}

export const UmpanBalikView: React.FC<UmpanBalikViewProps> = ({ currentUser }) => {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'inaccurate' | 'helpful'>('all');

  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getFeedback();
      setFeedback(data.feedback);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat umpan balik');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.updateFeedbackStatus(id, status, adminNote.trim() ? adminNote : undefined);
      setActiveFeedbackId(null);
      setAdminNote('');
      loadData();
      alert(`Status umpan balik diperbarui menjadi "${status}".`);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const filteredItems = feedback.filter((f) => {
    if (filterType === 'inaccurate') return f.reportedInaccurate;
    if (filterType === 'helpful') return f.isHelpful;
    return true;
  });

  const totalHelpful = feedback.filter((f) => f.isHelpful).length;
  const totalInaccurate = feedback.filter((f) => f.reportedInaccurate).length;
  const satisfactionRate =
    feedback.length > 0 ? Math.round((totalHelpful / feedback.length) * 100) : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <MessageSquareHeart className="w-6 h-6 text-rose-600" />
          <span>Umpan Balik Pengguna & Validasi Jawaban (FR-10, FR-11)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Meninjau penilaian kepuasan pegawai atas respon AI Agent serta menindaklanjuti laporan kesalahan rujukan pasal/regulasi.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">
            Total Umpan Balik
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {feedback.length}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
            Tingkat Kepuasan Pegawai
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
            {satisfactionRate}%
          </div>
        </div>

        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase">
            Jawaban Membantu
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
            {totalHelpful}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
            Laporan Jawaban Keliru
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
            {totalInaccurate}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filterType === 'all'
              ? 'bg-blue-700 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Semua ({feedback.length})
        </button>
        <button
          onClick={() => setFilterType('inaccurate')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            filterType === 'inaccurate'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Laporan Keliru ({totalInaccurate})</span>
        </button>
        <button
          onClick={() => setFilterType('helpful')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            filterType === 'helpful'
              ? 'bg-emerald-700 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>Membantu ({totalHelpful})</span>
        </button>
      </div>

      {/* Feedback Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Memuat daftar umpan balik pegawai...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            Tidak ada umpan balik yang sesuai dengan kategori ini.
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.isHelpful ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <ThumbsUp className="w-3 h-3" />
                        <span>Membantu</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                        <ThumbsDown className="w-3 h-3" />
                        <span>Tidak Membantu</span>
                      </span>
                    )}

                    {item.reportedInaccurate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        <Flag className="w-3 h-3 text-amber-600" />
                        <span>Laporan Kekeliruan</span>
                      </span>
                    )}

                    <span className="text-slate-400 font-mono text-[11px]">
                      {item.timestamp}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                    "{item.queryText}"
                  </h4>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    item.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.status === 'reviewed'
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Status: {item.status.toUpperCase()}
                </span>
              </div>

              {/* User Details */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Pengirim: {item.userName} ({item.userTeam})
                </div>
                <div>
                  <strong>Ringkasan Respon AI:</strong> {item.answerSummary}
                </div>
                {item.userComment && (
                  <div className="pt-1 text-slate-900 dark:text-white font-medium italic">
                    Catatan Pegawai: "{item.userComment}"
                  </div>
                )}
              </div>

              {/* Admin Validation Section */}
              {activeFeedbackId === item.id ? (
                <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                  <label className="block text-[11px] font-semibold text-blue-900 dark:text-blue-200">
                    Catatan Validasi Admin Tim:
                  </label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Misal: Sudah diverifikasi dengan Biro Hukum, SOP sedang diperbarui..."
                    className="w-full p-2 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                      className="px-3 py-1 rounded bg-sky-600 text-white font-semibold text-xs"
                    >
                      Tandai Telah Ditinjau (Reviewed)
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                      className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold text-xs"
                    >
                      Tandai Selesai (Resolved)
                    </button>
                    <button
                      onClick={() => setActiveFeedbackId(null)}
                      className="px-3 py-1 rounded text-slate-500 hover:bg-slate-100 text-xs"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-1">
                  {item.adminNotes ? (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      Tanggapan Admin: "{item.adminNotes}"
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Belum ada catatan validasi dari Admin Tim.
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setActiveFeedbackId(item.id);
                      setAdminNote(item.adminNotes || '');
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors"
                  >
                    Tinjau & Validasi
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
