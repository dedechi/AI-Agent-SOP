import React, { useState } from 'react';
import { X, Edit3, Globe, Lock, Users2, ShieldAlert } from 'lucide-react';
import { DocumentItem, DocVisibility, ValidityStatus } from '../types/index.ts';
import { api } from '../services/api.ts';

interface EditDocModalProps {
  doc: DocumentItem;
  onClose: () => void;
  onUpdated: () => void;
}

export const EditDocModal: React.FC<EditDocModalProps> = ({
  doc,
  onClose,
  onUpdated,
}) => {
  const [title, setTitle] = useState(doc.title);
  const [visibility, setVisibility] = useState<DocVisibility>(doc.visibility);
  const [allowDownload, setAllowDownload] = useState(doc.allowDownload);
  const [validityStatus, setValidityStatus] = useState<ValidityStatus>(
    doc.validityStatus
  );
  const [summary, setSummary] = useState(doc.summary);
  const [tagsInput, setTagsInput] = useState(doc.tags.join(', '));
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.updateDocument(doc.id, {
        title,
        visibility,
        allowDownload,
        validityStatus,
        summary,
        tags,
        newVersionNotes: newVersionNotes.trim() ? newVersionNotes : undefined,
      });

      alert('Metadata dokumen berhasil diperbarui!');
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit Metadata & Hak Akses Dokumen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nomor Dokumen
            </label>
            <input
              type="text"
              disabled
              value={doc.docNumber}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 font-mono text-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Judul Dokumen
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          {/* Visibility Selector (RBAC - PRD Bagian 10) */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Tingkat Visibilitas Dokumen
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-vis"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                />
                <span>Publik (Semua Pegawai Terautentikasi)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-vis"
                  value="shared"
                  checked={visibility === 'shared'}
                  onChange={() => setVisibility('shared')}
                />
                <span>Terbagi (Tim Tertentu)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="edit-vis"
                  value="team_only"
                  checked={visibility === 'team_only'}
                  onChange={() => setVisibility('team_only')}
                />
                <span>Hanya Tim Pemilik ({doc.teamName})</span>
              </label>
            </div>
          </div>

          {/* Download Permission Toggle (PRD FR-07) */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Izin Unduh Berkas
              </div>
              <div className="text-[11px] text-slate-500">
                Jika dimatikan, pegawai hanya bisa membaca via pratinjau.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Status Keberlakuan */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status Keberlakuan Dokumen
            </label>
            <select
              value={validityStatus}
              onChange={(e: any) => setValidityStatus(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              <option value="berlaku">Berlaku</option>
              <option value="tidak_berlaku">Tidak Berlaku (Dicabut / Usang)</option>
              <option value="belum_terverifikasi">Belum Terverifikasi</option>
            </select>
          </div>

          {/* Riwayat Versi Baru (PRD FR-06: Simpan riwayat versi tanpa menimpa yang lama) */}
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
            <div className="font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between">
              <span>Catat Versi Pembaruan Dokumen</span>
              <span className="font-mono text-[10px] text-blue-600">
                Versi Saat Ini: {doc.currentVersion}
              </span>
            </div>
            <input
              type="text"
              value={newVersionNotes}
              onChange={(e) => setNewVersionNotes(e.target.value)}
              placeholder="Misal: Penyesuaian formulir lampiran SPJ (otomatis naikkan nomor versi)"
              className="w-full p-2 rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs"
            />
            <div className="text-[10px] text-blue-700 dark:text-blue-300">
              * Mengisi catatan versi akan menyimpan riwayat perubahan baru secara otomatis tanpa menimpa data versi sebelumnya.
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ringkasan Dokumen
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
