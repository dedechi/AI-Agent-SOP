import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Users2,
  Lock,
  FileCheck2,
  Clock,
  FileX2,
} from 'lucide-react';
import { IndexStatus, ValidityStatus, DocVisibility } from '../types/index.ts';

interface ValidityBadgeProps {
  status: ValidityStatus;
  syncDate?: string;
  showDate?: boolean;
  className?: string;
}

export const ValidityBadge: React.FC<ValidityBadgeProps> = ({
  status,
  syncDate,
  showDate = false,
  className = '',
}) => {
  if (status === 'berlaku') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 ${className}`}
        title="Terverifikasi resmi dari database JDIH/arsip regulasi"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>Berlaku</span>
        {showDate && syncDate && (
          <span className="text-emerald-700/80 dark:text-emerald-400/80 font-normal text-[11px]">
            (JDIH, {syncDate.split(',')[0]})
          </span>
        )}
      </span>
    );
  }

  if (status === 'tidak_berlaku') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800 ${className}`}
        title="Menurut JDIH/arsip: dokumen telah dicabut atau dinyatakan tidak berlaku"
      >
        <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>Tidak Berlaku</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 ${className}`}
      title="JDIH tidak terjangkau, sinkronisasi gagal, atau status belum terverifikasi"
    >
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
      <span>Belum Terverifikasi</span>
    </span>
  );
};

export const IndexBadge: React.FC<{ status: IndexStatus; className?: string }> = ({
  status,
  className = '',
}) => {
  if (status === 'terindeks') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${className}`}
      >
        <FileCheck2 className="w-3 h-3 text-slate-500 shrink-0" />
        <span>Terindeks</span>
      </span>
    );
  }

  if (status === 'menunggu') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 ${className}`}
      >
        <Clock className="w-3 h-3 text-sky-500 shrink-0" />
        <span>Menunggu</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 ${className}`}
    >
      <FileX2 className="w-3 h-3 text-red-500 shrink-0" />
      <span>Gagal Indeks</span>
    </span>
  );
};

export const VisibilityBadge: React.FC<{ visibility: DocVisibility; className?: string }> = ({
  visibility,
  className = '',
}) => {
  if (visibility === 'public') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-medium ${className}`}
        title="Dapat diakses oleh seluruh pegawai terautentikasi"
      >
        <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Publik</span>
      </span>
    );
  }

  if (visibility === 'shared') {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-indigo-700 dark:text-indigo-400 font-medium ${className}`}
        title="Dibagikan antar tim tertentu"
      >
        <Users2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span>Terbagi</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-amber-800 dark:text-amber-400 font-medium ${className}`}
      title="Terbatas hanya untuk anggota tim pemilik (dan Super Admin tercatat)"
    >
      <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-500 shrink-0" />
      <span>Hanya Tim</span>
    </span>
  );
};
