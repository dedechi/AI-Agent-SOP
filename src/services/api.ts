import {
  AuditLogItem,
  DocumentItem,
  FeedbackItem,
  SOPTerdampakItem,
  Team,
  User,
  AgentQueryResponse,
} from '../types/index.ts';

class ApiService {
  private currentUserId: string = 'user-dewi';

  setUserId(id: string) {
    this.currentUserId = id;
    localStorage.setItem('ai_agent_user_id', id);
  }

  getUserId(): string {
    return localStorage.getItem('ai_agent_user_id') || this.currentUserId;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-id': this.getUserId(),
    };
  }

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`/api/auth/me?userId=${this.getUserId()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat profil pengguna');
    const data = await res.json();
    return data.user;
  }

  async getUsersAndTeams(): Promise<{ users: User[]; teams: Team[] }> {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Gagal memuat daftar pengguna dan tim');
    return res.json();
  }

  async getDocuments(params?: {
    source?: string;
    type?: string;
    status?: string;
    teamId?: string;
    q?: string;
  }): Promise<{
    documents: DocumentItem[];
    totalAccessible: number;
    insights: {
      totalIndexed: number;
      affectedOrEvaluationNeeded: number;
      lastJdihSync: string;
      isJdihOnline: boolean;
    };
  }> {
    const query = new URLSearchParams();
    if (params?.source) query.set('source', params.source);
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.teamId) query.set('teamId', params.teamId);
    if (params?.q) query.set('q', params.q);

    const res = await fetch(`/api/documents?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat daftar dokumen');
    return res.json();
  }

  async getDocumentById(id: string): Promise<{
    document: DocumentItem;
    canDownload: boolean;
    canManage: boolean;
  }> {
    const res = await fetch(`/api/documents/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Akses ditolak atau dokumen tidak ditemukan');
    }
    return res.json();
  }

  async downloadDocument(id: string): Promise<{
    success: boolean;
    message: string;
    downloadUrl: string;
    docNumber: string;
    title: string;
  }> {
    const res = await fetch(`/api/documents/${id}/download`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal mengunduh dokumen');
    }
    return res.json();
  }

  async createDocument(docData: Partial<DocumentItem>): Promise<DocumentItem> {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(docData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menambahkan dokumen');
    }
    const data = await res.json();
    return data.document;
  }

  async updateDocument(id: string, updateData: any): Promise<DocumentItem> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memperbarui dokumen');
    }
    const data = await res.json();
    return data.document;
  }

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`/api/documents/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal menghapus dokumen');
    }
  }

  async queryAgent(params: {
    query: string;
    mode?: 'ringkas' | 'rinci';
    scopeFilter?: 'all' | 'sop_only' | 'regulasi_only' | 'single_doc';
    singleDocId?: string;
  }): Promise<AgentQueryResponse> {
    const res = await fetch('/api/agent/query', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memproses kueri');
    }
    return res.json();
  }

  async getSOPTerdampak(): Promise<{
    items: SOPTerdampakItem[];
    summary: {
      total: number;
      perluEvaluasi: number;
      sedangDirevisi: number;
      selesai: number;
    };
  }> {
    const res = await fetch('/api/sop-terdampak', {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memuat SOP terdampak');
    }
    return res.json();
  }

  async updateSOPTerdampak(id: string, status: string, notes?: string): Promise<void> {
    const res = await fetch(`/api/sop-terdampak/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error('Gagal memperbarui evaluasi SOP');
  }

  async getFeedback(): Promise<{ feedback: FeedbackItem[] }> {
    const res = await fetch('/api/feedback', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat umpan balik');
    return res.json();
  }

  async submitFeedback(payload: {
    queryText: string;
    answerSummary: string;
    isHelpful: boolean;
    reportedInaccurate?: boolean;
    category?: string;
    userComment?: string;
  }): Promise<FeedbackItem> {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal mengirim umpan balik');
    const data = await res.json();
    return data.feedback;
  }

  async updateFeedbackStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    const res = await fetch(`/api/feedback/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ status, adminNotes }),
    });
    if (!res.ok) throw new Error('Gagal memperbarui status umpan balik');
  }

  async getAuditLogs(): Promise<{ logs: AuditLogItem[] }> {
    const res = await fetch('/api/audit-logs', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat log audit');
    return res.json();
  }

  async triggerJdihSync(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/jdih/sync', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Gagal sinkronisasi JDIH');
    return res.json();
  }

  async toggleJdihOffline(): Promise<{ isOnline: boolean; lastSyncTimestamp: string }> {
    const res = await fetch('/api/jdih/toggle-offline', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Gagal mengubah mode JDIH');
    return res.json();
  }

  async resetDatabase(): Promise<void> {
    await fetch('/api/test/reset', { method: 'POST', headers: this.getHeaders() });
  }
}

export const api = new ApiService();
