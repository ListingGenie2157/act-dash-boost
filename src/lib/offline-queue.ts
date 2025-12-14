import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AttemptQueueItem {
  id?: number;
  questionId: string;
  choiceOrder: number[];
  correctIdx: number;
  selectedIdx?: number;
  formId: string;
  questionOrd: number;
  userId: string;
  timestamp: number;
}

interface OfflineQueueDB extends DBSchema {
  attemptQueue: {
    key: number;
    value: AttemptQueueItem;
    indexes: { 'timestampIndex': number };
  };
}

let db: IDBPDatabase<OfflineQueueDB> | null = null;

async function initDB() {
  if (!db) {
    db = await openDB<OfflineQueueDB>('offline-queue-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('attemptQueue')) {
          const store = db.createObjectStore('attemptQueue', { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestampIndex', 'timestamp');
        }
      },
    });
  }
  return db;
}

export async function queueAttemptOffline(attempt: Omit<AttemptQueueItem, 'id' | 'timestamp'>) {
  const database = await initDB();
  const item: AttemptQueueItem = {
    ...attempt,
    timestamp: Date.now(),
  };
  
  await database.add('attemptQueue', item);
  logger.warn('Queued attempt offline:', item);
}

export async function flushOfflineQueue() {
  const database = await initDB();
  const items = await database.getAll('attemptQueue');
  
  if (items.length === 0) return;
  
  logger.warn(`Flushing ${items.length} offline attempts`);
  
  let syncedCount = 0;
  let failedCount = 0;
  
  for (const item of items) {
    try {
      const { error } = await supabase
        .from('attempts')
        .upsert({
          user_id: item.userId,
          question_id: item.questionId,
          choice_order: item.choiceOrder,
          correct_idx: item.correctIdx,
          selected_idx: item.selectedIdx,
          form_id: item.formId,
          question_ord: item.questionOrd,
        }, {
          onConflict: 'user_id,question_id,form_id'
        });
      
      if (error) throw error;
      
      // Remove successfully synced item
      if (item.id) {
        await database.delete('attemptQueue', item.id);
        syncedCount++;
      }
      
    } catch (error) {
      logger.error('Failed to sync attempt:', error);
      failedCount++;
      // Keep item in queue for retry
    }
  }
  
  if (syncedCount > 0) {
    logger.info(`✓ Synced ${syncedCount} offline attempts`);
  }
  
  if (failedCount > 0) {
    logger.warn(`⚠ Failed to sync ${failedCount} attempts - will retry later`);
  }
}

export async function getQueuedAttemptsCount(): Promise<number> {
  const database = await initDB();
  return await database.count('attemptQueue');
}

// Auto-flush when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.warn('Back online, flushing offline queue');
    flushOfflineQueue().catch((error) => {
      logger.error('Failed to flush offline queue:', error);
      // Schedule retry after 5 seconds
      setTimeout(() => {
        logger.warn('Retrying offline queue flush...');
        flushOfflineQueue().catch((retryError) => {
          logger.error('Retry failed:', retryError);
        });
      }, 5000);
    });
  });
}
