import React, { useState } from 'react';
import {
  X,
  Plus,
  HardDrive,
  FileCheck2,
  Lock,
  Globe,
  Users2,
  Sparkles,
  Link2,
} from 'lucide-react';
import { DocType, DocVisibility, Team, User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AddDriveDocModalProps {
  onClose: () => void;
  onDocCreated: () => void;
  currentUser: User | null;
  teams: Team[];
}

export const AddDriveDocModal: React.FC<AddDriveDocModalProps> = ({
  onClose,
  onDocCreated,
  currentUser,
  teams,
}) => {
  const [driveUrl, setDriveUrl] = useState('');
  const [title, setTitle] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [year, setYear] = useState('2026');
  const [type, setType] = useState<DocType>('SOP');
  const [selectedTeamId, setSelectedTeamId] = useState(
    currentUser?.role === 'super_admin' ? 'team-keu' : currentUser?.teamId || 'team-sdm'
  );
  const [visibility, setVisibility] = useState<DocVisibility>('public');
  const [allowDownload, setAllowDownload] = useState(true);
  const [summary, setSummary] = useState('');
  const [rawText, setRawText] = useState('');
  const [baseRegulation, setBaseRegulation] = useState('');
  const [tagsInput, setTagsInput] = useState('Internal, Prosedur');
  const [isSensitive, setIsSensitive] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [simulatedExtracting, setSimulatedExtracting] = useState(false);

  const handleSimulateExtract = () => {
    if (!driveUrl) {
      alert('Silakan tempelkan tautan Google Drive terlebih dahulu');
      return;
    }
    setSimulatedExtracting(true);
    setTimeout(() => {
      setSimulatedExtracting(false);
      if (!title) setTitle('SOP Penyelenggaraan Rapat Daring & Rekaman Notulensi');
      if (!docNumber) setDocNumber('SOP-TI-09/2026');
      if (!summary)
        setSummary(
          'Mengatur tata tertib penyelenggaraan rapat resmi kedinasan secara hybrid/daring, rekaman cloud aman, dan batas distribusi notulensi maksimal 24 jam.'
        );
      if (!rawText)
        setRawText(
          `STANDAR OPERASIONAL PROSEDUR RAPAT DARING KEDINASAN\nNomor: SOP-TI-09/2026\n1. Ketentuan Platform: Menggunakan akun dinas berlisensi.\n2. Presensi: Kehadiran tercatat otomatis via form kehadiran digital.\n3. Keamanan: Notulensi dan rekaman rapat sensitif disimpan di Drive folder terenkripsi.`
        );
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !docNumber || !driveUrl) {
      alert('Judul, nomor dokumen, dan tautan Drive wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await api.createDocument({
        title,
        docNumber,
        year,
        type,
        source: 'drive',
        sourceUrl: driveUrl,
        teamId: selectedTeamId,
        visibility,
        allowDownload,
        summary: summary || title,
        rawText: rawText || summary,
        tags: tags.length > 0 ? tags : ['SOP'],
        isSensitivePersuratan: isSensitive,
      });

      alert('Dokumen berhasil ditambahkan dan berstatus "Terindeks"!');
      onDocCreated();
      onClose();
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Tambah Entri dari Tautan Google Drive (FR-14)
              </h3>
              <p className="text-[11px] text-slate-500">
                Hubungkan dokumen SOP atau persuratan resmi ke Knowledge Base instansi.
              </p>
            </div>
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
          {/* Tautan Drive */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tautan Google Drive (Berkas Word / PDF) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="url"
                  required
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleSimulateExtract}
                disabled={simulatedExtracting}
                className="px-3 py-2 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{simulatedExtracting ? 'Mengekstrak...' : 'Ekstrak Otomatis'}</span>
              </button>
            </div>
          </div>

          {/* Grid: Judul & Nomor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Judul Dokumen SOP <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: SOP Penyelenggaraan Rapat Daring"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Dokumen <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Contoh: SOP-TI-09/2026"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Grid: Jenis & Tahun & Tim */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jenis Dokumen
              </label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="SOP">SOP</option>
                <option value="Surat Edaran">Surat Edaran</option>
                <option value="Naskah Dinas">Naskah Dinas</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tahun
              </label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tim Pemilik
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={currentUser?.role !== 'super_admin'}
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs disabled:opacity-60"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Visibilitas & Izin Unduh (PRD FR-07) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tingkat Visibilitas (RBAC)
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vis"
                    value="public"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                  />
                  <span>Publik (Semua Pegawai)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vis"
                    value="shared"
                    checked={visibility === 'shared'}
                    onChange={() => setVisibility('shared')}
                  />
                  <span>Terbagi (Tim Tertentu)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vis"
                    value="team_only"
                    checked={visibility === 'team_only'}
                    onChange={() => setVisibility('team_only')}
                  />
                  <span>Hanya Tim Pemilik Saja</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kontrol Unduhan & Sensitivitas
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                  />
                  <span>Izinkan Unduh Berkas Asli</span>
                </label>
                <div className="text-[10px] text-slate-400 pl-5">
                  Bila tidak dicentang, pengguna hanya dapat membaca online.
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isSensitive}
                    onChange={(e) => setIsSensitive(e.target.checked)}
                  />
                  <span className="text-amber-800 dark:text-amber-400 font-medium">
                    Kategori Dokumen Rahasia / Sensitif
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Ringkasan & Teks Terindeks */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ringkasan Singkat SOP (AI Summary)
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Deskripsi ringkas tujuan dan batasan SOP..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teks Dokumen Terindeks (Sumber Jawaban Agent)
            </label>
            <textarea
              rows={4}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Teks pasal atau langkah SOP hasil ekstraksi..."
              className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tag Topik (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan & Indeks Dokumen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
