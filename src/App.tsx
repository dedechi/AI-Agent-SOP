import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  ActiveTab,
} from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { TanyaAgentView } from './components/TanyaAgentView.tsx';
import { KnowledgeBaseView } from './components/KnowledgeBaseView.tsx';
import { DocumentDetailModal } from './components/DocumentDetailModal.tsx';
import { AddDriveDocModal } from './components/AddDriveDocModal.tsx';
import { EditDocModal } from './components/EditDocModal.tsx';
import { DasborPembaruanView } from './components/DasborPembaruanView.tsx';
import { UmpanBalikView } from './components/UmpanBalikView.tsx';
import { AuditLogView } from './components/AuditLogView.tsx';
import { SkenarioUjiView } from './components/SkenarioUjiView.tsx';
import { DocumentItem, Team, User } from './types/index.ts';
import { api } from './services/api.ts';
import { Lock, LogIn, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('tanya_agent');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Document modals state
  const [selectedDetailDocId, setSelectedDetailDocId] = useState<string | null>(null);
  const [showAddDriveModal, setShowAddDriveModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentItem | null>(null);

  // Single doc context filter for Tanya Agent ("Tanya dokumen ini")
  const [singleDocAgentId, setSingleDocAgentId] = useState<string | null>(null);

  // JDIH status
  const [isJdihOnline, setIsJdihOnline] = useState(true);
  const [lastJdihSync, setLastJdihSync] = useState('15 Oktober 2026, 08:30 WIB');
  const [isSyncingJdih, setIsSyncingJdih] = useState(false);

  // KPI count of affected SOPs for badge in sidebar
  const [affectedCount, setAffectedCount] = useState(0);

  // Initialize data
  useEffect(() => {
    // Check saved theme
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Load users & current user
    api
      .getUsersAndTeams()
      .then((data) => {
        setUsersList(data.users);
        setTeamsList(data.teams);
        const storedUserId = api.getUserId();
        const found = data.users.find((u) => u.id === storedUserId) || data.users[0];
        setCurrentUser(found);
      })
      .catch((err) => console.error(err));

    // Load initial SOP count
    api
      .getSOPTerdampak()
      .then((d) => setAffectedCount(d.summary.perluEvaluasi))
      .catch(() => {});
  }, []);

  const handleToggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  };

  const handleSwitchUser = (userId: string | null) => {
    if (!userId) {
      // Skenario 2: Unauthenticated state
      setCurrentUser(null);
      return;
    }
    api.setUserId(userId);
    const user = usersList.find((u) => u.id === userId) || null;
    setCurrentUser(user);

    // Refresh affected count
    api
      .getSOPTerdampak()
      .then((d) => setAffectedCount(d.summary.perluEvaluasi))
      .catch(() => {});
  };

  const handleRefreshJdihSync = async () => {
    setIsSyncingJdih(true);
    try {
      const res = await api.triggerJdihSync();
      setIsJdihOnline(true);
      setLastJdihSync(new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB');
      alert('Sinkronisasi JDIH Komdigi berhasil diperbarui.');
    } catch (err: any) {
      alert(`Gagal sinkronisasi JDIH: ${err.message}`);
    } finally {
      setIsSyncingJdih(false);
    }
  };

  const handleToggleJdihOffline = async () => {
    try {
      const res = await api.toggleJdihOffline();
      setIsJdihOnline(res.isOnline);
      setLastJdihSync(res.lastSyncTimestamp);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    }
  };

  const handleAskDocInAgent = (docId: string) => {
    setSingleDocAgentId(docId);
    setActiveTab('tanya_agent');
  };

  return (
    <div className={`min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex antialiased`}>
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        affectedCount={affectedCount}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          currentUser={currentUser}
          usersList={usersList}
          onSwitchUser={handleSwitchUser}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          isJdihOnline={isJdihOnline}
          lastJdihSync={lastJdihSync}
          onRefreshJdihSync={handleRefreshJdihSync}
          isSyncingJdih={isSyncingJdih}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          {/* Skenario Uji 2: Pengguna tanpa login */}
          {!currentUser ? (
            <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Autentikasi Pegawai Diperlukan (Skenario Uji 2)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sesuai PRD Bagian 10 & Skenario 2: Sistem AI Agent SOP dan Regulasi menggabungkan dokumen internal instansi sehingga wajib login dengan akun dinas resmi.
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleSwitchUser('user-dewi')}
                  className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login Sebagai Dewi Chibanjar (Super Admin)</span>
                </button>
                <button
                  onClick={() => handleSwitchUser('user-ahmad')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
                >
                  <span>Login Sebagai Ahmad Fauzi (Pegawai SPBE)</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'tanya_agent' && (
                <TanyaAgentView
                  currentUser={currentUser}
                  onOpenDocDetail={(id) => setSelectedDetailDocId(id)}
                  initialSingleDocId={singleDocAgentId}
                  onClearSingleDocFilter={() => setSingleDocAgentId(null)}
                />
              )}

              {activeTab === 'knowledge_base' && (
                <KnowledgeBaseView
                  currentUser={currentUser}
                  onOpenDocDetail={(id) => setSelectedDetailDocId(id)}
                  onAskDocInAgent={handleAskDocInAgent}
                  onOpenAddDriveModal={() => setShowAddDriveModal(true)}
                  onOpenEditDocModal={(doc) => setEditingDoc(doc)}
                />
              )}

              {activeTab === 'dasbor_pembaruan' && (
                <DasborPembaruanView
                  currentUser={currentUser}
                  onOpenDocDetail={(id) => setSelectedDetailDocId(id)}
                />
              )}

              {activeTab === 'umpan_balik' && (
                <UmpanBalikView currentUser={currentUser} />
              )}

              {activeTab === 'audit_pengaturan' && (
                <AuditLogView
                  currentUser={currentUser}
                  usersList={usersList}
                  teamsList={teamsList}
                  isJdihOnline={isJdihOnline}
                  lastJdihSync={lastJdihSync}
                  onRefreshJdih={handleRefreshJdihSync}
                  isSyncingJdih={isSyncingJdih}
                  onToggleJdihOffline={handleToggleJdihOffline}
                />
              )}

              {activeTab === 'skenario_uji' && (
                <SkenarioUjiView
                  currentUser={currentUser}
                  onSwitchUser={handleSwitchUser}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Detail Dokumen Modal */}
      {selectedDetailDocId && (
        <DocumentDetailModal
          docId={selectedDetailDocId}
          onClose={() => setSelectedDetailDocId(null)}
          onAskDocInAgent={handleAskDocInAgent}
          currentUser={currentUser}
        />
      )}

      {/* Tambah Tautan Drive Modal (FR-14) */}
      {showAddDriveModal && (
        <AddDriveDocModal
          onClose={() => setShowAddDriveModal(false)}
          onDocCreated={() => {
            // Document created, refresh if needed
          }}
          currentUser={currentUser}
          teams={teamsList}
        />
      )}

      {/* Edit Dokumen Modal (FR-06, FR-07) */}
      {editingDoc && (
        <EditDocModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onUpdated={() => {
            setEditingDoc(null);
          }}
        />
      )}
    </div>
  );
}
