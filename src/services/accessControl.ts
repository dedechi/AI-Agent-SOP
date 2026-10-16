import { DocumentItem, Role, User } from '../types/index.ts';

/**
 * Validates whether a user can READ a document based on the PRD RBAC Matrix:
 * - Super Admin: Can read all documents
 * - Admin Tim: Can read own team documents, shared with their team, and public documents
 * - User: Can read public documents, documents shared with their team, and own team documents (if not restricted)
 */
export function canUserReadDocument(user: User, doc: DocumentItem): boolean {
  if (!user) return false;

  // Super Admin can read everything (audit logged if sensitive)
  if (user.role === 'super_admin') {
    return true;
  }

  // Public documents can be read by any authenticated user
  if (doc.visibility === 'public') {
    return true;
  }

  // Admin Tim or User in the same team
  if (doc.teamId === user.teamId) {
    return true;
  }

  // Document shared with user's team
  if (doc.visibility === 'shared' && doc.sharedWithTeamIds?.includes(user.teamId)) {
    return true;
  }

  return false;
}

/**
 * Validates whether a user can DOWNLOAD a document:
 * Per PRD FR-07: Download permission is strictly separate from read permission.
 * Even if user can read, if allowDownload is false, only Super Admin or Admin of owner team can download.
 */
export function canUserDownloadDocument(user: User, doc: DocumentItem): boolean {
  if (!canUserReadDocument(user, doc)) return false;

  // Super Admin can always download
  if (user.role === 'super_admin') return true;

  // Admin of the document's owner team can download
  if (user.role === 'admin_tim' && user.teamId === doc.teamId) {
    return true;
  }

  // Otherwise, strictly obey allowDownload flag
  return Boolean(doc.allowDownload);
}

/**
 * Validates whether a user can EDIT / MANAGE a document:
 * - Super Admin: Can edit all documents
 * - Admin Tim: Can edit only documents owned by their team
 * - User: Cannot edit
 */
export function canUserManageDocument(user: User, doc: DocumentItem): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'admin_tim' && user.teamId === doc.teamId) return true;
  return false;
}

/**
 * Filters a list of documents strictly to only those the user is permitted to read.
 * This is applied BEFORE any context or search results reach the UI or AI model (NFR-02 item 4).
 */
export function filterDocumentsForUser(docs: DocumentItem[], user: User): DocumentItem[] {
  return docs.filter((doc) => canUserReadDocument(user, doc));
}
