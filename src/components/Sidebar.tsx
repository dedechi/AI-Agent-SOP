import React from 'react';
import {
  MessageSquareCode,
  Library,
  GitPullRequestDraft,
  MessageSquareHeart,
  ShieldAlert,
  TestTubes,
  Building2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Role, User } from '../types/index.ts';

export type ActiveTab =
  | 'tanya_agent'
  | 'knowledge_base'
  | 'dasbor_pembaruan'
  | 'umpan_balik'
  | 'audit_pengaturan'
  | 'skenario_uji';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User | null;
  affectedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  affectedCount = 0,
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdminTim = currentUser?.role === 'admin_tim';
  const isAnyAdmin = isSuperAdmin || isAdminTim;

  const navItems = [
    {
      id: 'tanya_agent' as ActiveTab,
      label: 'Tanya Agent',
      desc: 'Pencarian & Tanya Jawab AI',
      icon: MessageSquareCode,
      allowed: true,
    },
    {
      id: 'knowledge_base' as ActiveTab,
      label: 'Knowledge Base',
      desc: 'Arsip SOP & Regulasi',
      icon: Library,
      allowed: true,
    },
    {
      id: 'dasbor_pembaruan' as ActiveTab,
      label: 'Dasbor Pembaruan',
      desc: 'Regulasi Berubah & SOP Terdampak',
      icon: GitPullRequestDraft,
      badge: affectedCount > 0 ? affectedCount : undefined,
      allowed: isAnyAdmin,
    },
    {
      id: 'umpan_balik' as ActiveTab,
      label: 'Umpan Balik & Validasi',
      desc: 'Tinjau Jawaban Pegawai',
      icon: MessageSquareHeart,
      allowed: isAnyAdmin,
    },
    {
      id: 'audit_pengaturan' as ActiveTab,
      label: 'Log Audit & Pengaturan',
      desc: 'RBAC, Akses, & JDIH Sync',
      icon: ShieldAlert,
      allowed: isAnyAdmin,
    },
    {
      id: 'skenario_uji' as ActiveTab,
      label: 'Skenario Uji (PRD 12)',
      desc: 'Verifikasi 8 Skenario Uji',
      icon: TestTubes,
      allowed: true,
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between h-screen sticky top-0 z-20">
      <div>
        {/* Brand Lockup */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate tracking-tight">
              AI Agent SOP & Regulasi
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Portal Terpadu Instansi
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems
            .filter((item) => item.allowed)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors group relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isActive
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs truncate flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                      {item.desc}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
        </nav>
      </div>

      {/* Footer Info: Government JDIH Link & System Version */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2">
        <a
          href="https://jdih.komdigi.go.id"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
        >
          <span className="truncate">Portal JDIH Komdigi</span>
          <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-70" />
        </a>

        <div className="px-2.5 text-[10px] text-slate-400 dark:text-slate-500">
          <span>AI Agent SOP v1.0 · Single Source of Truth</span>
        </div>
      </div>
    </aside>
  );
};
