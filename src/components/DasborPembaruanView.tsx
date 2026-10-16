import React, { useState, useEffect } from 'react';
import {
  GitPullRequestDraft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Save,
  Building,
  FileText,
  Filter,
} from 'lucide-react';
import { SOPTerdampakItem, User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface DasborPembaruanViewProps {
  currentUser: User | null;
  onOpenDocDetail: (docId: string) => void;
}

export const DasborPembaruanView: React.FC<DasborPembaruanViewProps> = ({
  currentUser,
  onOpenDocDetail,
}) => {
  const [items, setItems] = useState<SOPTerdampakItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    perluEvaluasi: 0,
    sedangDirevisi: 0,
    selesai: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editing state for an item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('perlu_evaluasi');
  const [editNotes, setEditNotes] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getSOPTerdampak();
      setItems(data.items);
      setSummary(data.summary);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat dasbor pembaruan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  const handleStartEdit = (item: SOPTerdampakItem) => {
    setEditingId(item.id);
    setEditStatus(item.status);
    setEditNotes(item.notes || '');
  };

  const handleSaveEvaluation = async (id: string) => {
    try {
      await api.updateSOPTerdampak(id, editStatus, editNotes);
      setEditingId(null);
      loadData();
      alert('Status evaluasi SOP berhasil disimpan.');
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const getSeverityBadge = (sev: 'tinggi' | 'sedang' | 'rendah') => {
    switch (sev) {
      case 'tinggi':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Dampak Tinggi
          </span>
        );
      case 'sedang':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Dampak Sedang
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Dampak Rendah
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'perlu_evaluasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Perlu Evaluasi</span>
          </span>
        );
      case 'sedang_direvisi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950 dark:text-sky-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Sedang Direvisi</span>
          </span>
        );
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Penyesuaian Selesai</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <GitPullRequestDraft className="w-6 h-6 text-amber-600" />
          <span>Dasbor Pembaruan Regulasi & Evaluasi SOP (FR-09)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {currentUser?.role === 'super_admin'
            ? 'Memantau seluruh SOP instansi yang terpengaruh oleh pencabutan atau pembaruan regulasi induk dari JDIH.'
            : `Memantau SOP milik ${currentUser?.teamName} yang terpengaruh perubahan regulasi induk JDIH.`}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">
            Total SOP Terdampak
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
            {summary.total}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">
            Perlu Evaluasi Segera
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
            {summary.perluEvaluasi}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/40 dark:bg-sky-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 uppercase">
            Sedang Direvisi Tim
          </div>
          <div className="text-2xl font-bold font-mono text-sky-700 dark:text-sky-300 mt-1">
            {summary.sedangDirevisi}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
            Penyesuaian Selesai
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
            {summary.selesai}
          </div>
        </div>
      </div>

      {/* Table of Impacted SOPs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3 pl-4">Dokumen SOP Terdampak</th>
                <th className="p-3">Tim Pemilik</th>
                <th className="p-3">Regulasi Dasar Berubah (JDIH)</th>
                <th className="p-3">Dampak & Alasan Evaluasi</th>
                <th className="p-3">Tingkat Keparahan</th>
                <th className="p-3">Status Evaluasi</th>
                <th className="p-3 pr-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Memuat data SOP terdampak...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Tidak ada SOP terdampak perubahan regulasi untuk lingkup tim Anda.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isEditing = editingId === item.id;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-3 pl-4 max-w-xs">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {item.sopTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {item.sopNumber}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {item.teamName}
                      </td>

                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {item.baseRegNumber}
                        </div>
                        <div className="text-[11px] text-rose-600 dark:text-rose-400">
                          Status: Dicabut / Berubah di JDIH
                        </div>
                      </td>

                      <td className="p-3 max-w-sm">
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.changeReason}
                        </p>
                        {item.notes && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 italic">
                            Catatan: {item.notes}
                          </div>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {getSeverityBadge(item.severity)}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                            >
                              <option value="perlu_evaluasi">Perlu Evaluasi</option>
                              <option value="sedang_direvisi">Sedang Direvisi</option>
                              <option value="selesai">Selesai</option>
                            </select>
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Catatan tindak lanjut..."
                              className="w-full p-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                            />
                          </div>
                        ) : (
                          getStatusBadge(item.status)
                        )}
                      </td>

                      <td className="p-3 pr-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveEvaluation(item.id)}
                                className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Simpan</span>
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-2 py-1 rounded text-slate-500 hover:bg-slate-100 text-xs"
                              >
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => onOpenDocDetail(item.sopId)}
                                className="px-2.5 py-1 rounded text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                              >
                                Lihat SOP
                              </button>
                              <button
                                onClick={() => handleStartEdit(item)}
                                className="px-2.5 py-1 rounded text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100"
                              >
                                Evaluasi
                              </button>
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
