import React, { useState } from 'react';
import {
  User as UserIcon,
  Shield,
  ShieldAlert,
  ChevronDown,
  Sun,
  Moon,
  RefreshCw,
  Radio,
  Check,
  LogOut,
  Building,
} from 'lucide-react';
import { User, Role } from '../types/index.ts';
import { ActiveTab } from './Sidebar.tsx';

interface HeaderProps {
  activeTab: ActiveTab;
  currentUser: User | null;
  usersList: User[];
  onSwitchUser: (userId: string | null) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  isJdihOnline: boolean;
  lastJdihSync: string;
  onRefreshJdihSync: () => void;
  isSyncingJdih: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentUser,
  usersList,
  onSwitchUser,
  isDarkMode,
  onToggleDarkMode,
  isJdihOnline,
  lastJdihSync,
  onRefreshJdihSync,
  isSyncingJdih,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'tanya_agent':
        return 'Tanya Agent · Pencarian Terpadu & Rujukan Resmi';
      case 'knowledge_base':
        return 'Knowledge Base · Pusat Dokumen SOP & Regulasi JDIH';
      case 'dasbor_pembaruan':
        return 'Dasbor Pembaruan · Evaluasi SOP Terdampak Regulasi';
      case 'umpan_balik':
        return 'Umpan Balik & Validasi · Peninjauan Respon AI';
      case 'audit_pengaturan':
        return 'Log Audit & Pengaturan · Keamanan RBAC & Integrasi';
      case 'skenario_uji':
        return 'Skenario Uji (PRD 12) · Pengujian 8 Skenario Kepatuhan';
      default:
        return 'AI Agent SOP dan Regulasi';
    }
  };

  const getRoleLabel = (role?: Role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin_tim':
        return 'Admin Tim';
      case 'user':
        return 'Pegawai (User)';
      default:
        return 'Tamu / Tanpa Sesi';
    }
  };

  const getRoleBadgeColor = (role?: Role) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'admin_tim':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'user':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300';
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Breadcrumb Section */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Right Action Tools: JDIH Status Indicator + Role Switcher + Dark Mode */}
      <div className="flex items-center gap-3 shrink-0">
        {/* JDIH Sync Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <Radio
              className={`w-3.5 h-3.5 ${
                isJdihOnline
                  ? 'text-emerald-500 animate-pulse'
                  : 'text-amber-500'
              }`}
            />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {isJdihOnline ? 'JDIH Komdigi Aktif' : 'JDIH Cadangan'}
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <button
            onClick={onRefreshJdihSync}
            disabled={isSyncingJdih}
            title={`Terakhir sinkron: ${lastJdihSync}. Klik untuk sinkronkan sekarang.`}
            className="flex items-center gap-1 text-[11px] text-blue-700 dark:text-blue-400 hover:underline"
          >
            <RefreshCw
              className={`w-3 h-3 ${isSyncingJdih ? 'animate-spin' : ''}`}
            />
            <span className="hidden xl:inline">Sinkronkan</span>
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User & Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 pl-2 pr-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                {currentUser?.name || 'Tamu / Tanpa Login'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getRoleBadgeColor(
                    currentUser?.role
                  )}`}
                >
                  {getRoleLabel(currentUser?.role)}
                </span>
                {currentUser?.teamName && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                    · {currentUser.teamName.split(' ')[0]}
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Switcher Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 p-2 text-xs">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    Ganti Peran Pengguna (Simulasi RBAC)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pilih akun pegawai untuk menguji hak akses per tim dan aturan batasan dokumen.
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {usersList.map((user) => {
                    const isSelected = currentUser?.id === user.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium truncate flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.role === 'super_admin' && (
                              <ShieldAlert className="w-3 h-3 text-purple-600 shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                            <span>{getRoleLabel(user.role)}</span>
                            <span>·</span>
                            <span className="truncate">{user.teamName}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Skenario 2: Simulasi Logout / Pengguna Tanpa Login */}
                <div className="pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      onSwitchUser(null);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Mode Tanpa Login (Uji Skenario 2)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
