/**
 * Offline Storage Service for Extension Officers
 * Allows evidence submission when offline, syncs when back online
 */

interface OfflineEvidence {
  id: string;
  milestoneId: string;
  photos: File[];
  notes: string;
  location: { lat: number; lng: number };
  timestamp: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

const STORAGE_KEY = 'agrochain_offline_evidence';

/**
 * Save evidence to local storage for offline submission
 */
export function saveOfflineEvidence(evidence: Omit<OfflineEvidence, 'id' | 'status'>): string {
  const id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const offlineEvidence: OfflineEvidence = {
    id,
    ...evidence,
    status: 'pending',
  };

  const stored = getOfflineEvidence();
  stored.push(offlineEvidence);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

  return id;
}

/**
 * Get all offline evidence
 */
export function getOfflineEvidence(): OfflineEvidence[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get pending offline evidence count
 */
export function getPendingCount(): number {
  const evidence = getOfflineEvidence();
  return evidence.filter(e => e.status === 'pending').length;
}

/**
 * Update evidence status
 */
export function updateEvidenceStatus(id: string, status: OfflineEvidence['status']): void {
  const stored = getOfflineEvidence();
  const index = stored.findIndex(e => e.id === id);

  if (index !== -1) {
    stored[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
}

/**
 * Remove synced evidence
 */
export function removeSyncedEvidence(): void {
  const stored = getOfflineEvidence();
  const remaining = stored.filter(e => e.status !== 'synced');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
}

/**
 * Check if online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Sync all pending evidence
 */
export async function syncOfflineEvidence(
  uploadFunction: (evidence: OfflineEvidence) => Promise<void>
): Promise<{ success: number; failed: number }> {
  if (!isOnline()) {
    throw new Error('Cannot sync while offline');
  }

  const pending = getOfflineEvidence().filter(e => e.status === 'pending');
  let success = 0;
  let failed = 0;

  for (const evidence of pending) {
    try {
      updateEvidenceStatus(evidence.id, 'syncing');
      await uploadFunction(evidence);
      updateEvidenceStatus(evidence.id, 'synced');
      success++;
    } catch (error: unknown) {
      console.error(`Failed to sync evidence ${evidence.id}:`, error);
      updateEvidenceStatus(evidence.id, 'failed');
      failed++;
    }
  }

  // Clean up synced evidence
  removeSyncedEvidence();

  return { success, failed };
}

/**
 * Setup online/offline listeners
 */
export function setupOfflineListeners(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

/**
 * Get storage size estimate
 */
export function getStorageSize(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return '0 KB';

  const bytes = new Blob([stored]).size;
  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb > 1) return `${mb.toFixed(2)} MB`;
  return `${kb.toFixed(2)} KB`;
}
