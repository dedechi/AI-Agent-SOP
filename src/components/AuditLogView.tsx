import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Radio,
  Users,
  Building,
  KeyRound,
  Lock,
  FileCheck2,
  AlertTriangle,
  Globe,
  Sliders,
} from 'lucide-react';
import { AuditLogItem, Team, User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuditLogViewProps {
  currentUser: User | null;
  usersList: User[];
  teamsList: Team[];
  isJdihOnline: boolean;
  lastJdihSync: string;
  onRefreshJdih: () => void;
  isSyncingJdih: boolean;
  onToggleJdihOffline: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  currentUser,
  usersList,
  teamsList,
  isJdihOnline,
  lastJdihSync,
  onRefreshJdih,
  isSyncingJdih,
  onToggleJdihOffline,
}) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [onlySensitive, setOnlySensitive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'audit_logs' | 'teams_users' | 'jdih_config'>(
    'audit_logs'
  );

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data.logs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentUser?.id]);

  const filteredLogs = logs.filter((l) => {
    if (onlySensitive && !l.isSensitiveAccess) return false;
    if (filterAction !== 'all' && !l.action.includes(filterAction)) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-purple-600" />
          <span>Log Audit Keamanan & Pengaturan RBAC (FR-08, FR-11, FR-16)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Kepatuhan hak akses minimum, pencatatan jejak audit akses dokumen sensitif, serta konfigurasi sinkronisasi JDIH.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('audit_logs')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'audit_logs'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Jejak Log Audit ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('jdih_config')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'jdih_config'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Konfigurasi Sinkronisasi JDIH
        </button>
        <button
          onClick={() => setActiveTab('teams_users')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeTab === 'teams_users'
              ? 'border-purple-600 text-purple-700 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Direktori Tim & Pengguna ({usersList.length})
        </button>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="p-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                <option value="all">Semua Jenis Aksi</option>
                <option value="QUERY">Kueri AI Agent</option>
                <option value="UNAUTHORIZED">Pelanggaran / Blokir Akses</option>
                <option value="PROMPT_INJECTION">Deteksi Prompt Injection</option>
                <option value="DOWNLOAD">Aksi Unduhan Berkas</option>
                <option value="SUPER_ADMIN">Akses Super Admin</option>
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={onlySensitive}
                  onChange={(e) => setOnlySensitive(e.target.checked)}
                />
                <span>Hanya Akses Dokumen Sensitif / Insiden Keamanan</span>
              </label>
            </div>

            <button
              onClick={loadLogs}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Muat Ulang Log</span>
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 pl-4">Waktu (WIB)</th>
                    <th className="p-3">Pengguna & Peran</th>
                    <th className="p-3">Unit / Tim</th>
                    <th className="p-3">Aksi Sistem</th>
                    <th className="p-3">Rincian Peristiwa</th>
                    <th className="p-3 pr-4">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Memuat rekaman log audit...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Tidak ada log audit yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                          log.isSensitiveAccess
                            ? 'bg-amber-50/30 dark:bg-amber-950/20'
                            : ''
                        }`}
                      >
                        <td className="p-3 pl-4 whitespace-nowrap text-[11px] text-slate-500 font-mono">
                          {log.timestamp}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {log.userName}
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              log.userRole === 'super_admin'
                                ? 'bg-purple-100 text-purple-800'
                                : log.userRole === 'admin_tim'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {log.userRole}
                          </span>
                        </td>

                        <td className="p-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {log.teamName}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                              {log.action}
                            </span>
                            {log.isSensitiveAccess && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                                SENSITIF
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 max-w-md">
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                            {log.details}
                          </p>
                          {log.targetDocTitle && (
                            <div className="text-[10px] text-blue-600 font-medium truncate mt-0.5">
                              Target: {log.targetDocTitle}
                            </div>
                          )}
                        </td>

                        <td className="p-3 pr-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                          {log.ipAddress || '10.20.1.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JDIH CONFIGURATION */}
      {activeTab === 'jdih_config' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Integrasi & Sinkronisasi Regulasi JDIH Komdigi (FR-16)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Menjaga keabsahan status keberlakuan regulasi induk secara otomatis dari portal resmi jdih.komdigi.go.id.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onRefreshJdih}
                  disabled={isSyncingJdih}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isSyncingJdih ? 'animate-spin' : ''}`}
                  />
                  <span>Sinkronkan Sekarang</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  Status Koneksi JDIH
                </div>
                <div className="mt-1 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isJdihOnline ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <span>{isJdihOnline ? 'Online (Terhubung)' : 'Offline / Gangguan'}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  Waktu Sinkronisasi Terakhir
                </div>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  {lastJdihSync}
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">
                  Frekuensi Sinkronisasi
                </div>
                <div className="mt-1 font-semibold text-slate-800 dark:text-slate-200">
                  Setiap 12 Jam (Otomatis)
                </div>
              </div>
            </div>

            {/* Simulasi JDIH Offline Toggle for Skenario 8 */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-700" />
                  <span>Uji Skenario 8: Simulasi JDIH Offline / Gagal Sinkronisasi</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-relaxed">
                  Aktifkan toggle ini untuk menguji bagaimana AI Agent menangani situasi ketika JDIH tidak dapat diakses (PRD NFR-09 & Skenario 8: status ditandai Belum Terverifikasi dan panel JDIH tertanam dimunculkan).
                </p>
              </div>

              <button
                onClick={onToggleJdihOffline}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                  isJdihOnline
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isJdihOnline ? 'Matikan Akses JDIH' : 'Nyalakan Kembali JDIH'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TEAMS & USERS DIRECTORY */}
      {activeTab === 'teams_users' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white">
              Daftar Pegawai & Hak Akses Instansi
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="p-3 pl-4">Nama Pegawai & NIP</th>
                    <th className="p-3">Peran (RBAC)</th>
                    <th className="p-3">Unit / Tim Kerja</th>
                    <th className="p-3">Email Dinas</th>
                    <th className="p-3 pr-4">Jabatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 pl-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          NIP. {u.nip}
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'admin_tim'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {u.teamName}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="p-3 pr-4 text-slate-600 dark:text-slate-400">
                        {u.position}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
