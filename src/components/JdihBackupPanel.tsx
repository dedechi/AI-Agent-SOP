import React, { useState } from 'react';
import {
  ExternalLink,
  Search,
  AlertTriangle,
  Globe,
  Maximize2,
  Minimize2,
  X,
  ShieldCheck,
} from 'lucide-react';

interface JdihBackupPanelProps {
  reason?: string;
  onClose?: () => void;
  searchKeyword?: string;
}

export const JdihBackupPanel: React.FC<JdihBackupPanelProps> = ({
  reason = 'Mode cadangan verifikasi manual JDIH Komdigi aktif.',
  onClose,
  searchKeyword = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const portalBaseUrl = 'https://jdih.komdigi.go.id';
  const searchUrl = searchKeyword
    ? `${portalBaseUrl}/pencarian?q=${encodeURIComponent(searchKeyword)}`
    : `${portalBaseUrl}/produk_hukum`;

  return (
    <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-4 transition-all space-y-3">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
              Panel Cadangan Portal JDIH Komdigi (FR-17)
            </h4>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              {reason}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
            title={isExpanded ? 'Perkecil Panel' : 'Perbesar Panel'}
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              title="Tutup Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Safety Notice per PRD */}
      <div className="text-[11px] bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50 text-slate-700 dark:text-slate-300 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span>
            <strong>Aturan Kejujuran AI:</strong> Isi halaman web JDIH pada panel ini hanya disediakan untuk inspeksi mandiri oleh pengguna, dan <strong>tidak dijadikan sebagai sumber spekulatif</strong> jawaban otomatis AI Agent tanpa sinkronisasi valid.
          </span>
        </div>
      </div>

      {/* Action Buttons: Tab Baru & Pencarian Teks */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <a
          href={portalBaseUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Buka JDIH Komdigi di Tab Baru</span>
        </a>

        <a
          href={searchUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span>Pencarian Teks JDIH {searchKeyword ? `"${searchKeyword}"` : ''}</span>
        </a>
      </div>

      {/* Embedded Iframe Preview with Fallback Handler */}
      <div
        className={`w-full rounded-lg border border-amber-200 dark:border-amber-900/40 overflow-hidden bg-white dark:bg-slate-950 transition-all ${
          isExpanded ? 'h-96' : 'h-52'
        }`}
      >
        {!iframeError ? (
          <iframe
            src={portalBaseUrl}
            title="Portal JDIH Komdigi"
            className="w-full h-full border-0"
            onError={() => setIframeError(true)}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Situs JDIH Komdigi memblokir penayangan dalam panel tertanam (X-Frame-Options: SAMEORIGIN)
            </p>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md">
              Sesuai PRD FR-17: Bila penayangan tertanam diblokir situs, gunakan tombol "Buka JDIH Komdigi di Tab Baru" di atas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
