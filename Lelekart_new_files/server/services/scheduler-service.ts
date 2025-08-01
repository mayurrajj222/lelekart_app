import { runFullBackup } from './backup-service';

// Store job information
let scheduledBackupJob: NodeJS.Timeout | null = null;
let nextScheduledBackupTime: Date | null = null;

/**
 * Calculate the next run time
 * @param hour Hour of day to run (0-23)
 * @param minute Minute of hour to run (0-59)
 */
function calculateNextRunTime(hour: number, minute: number): Date {
  const now = new Date();
  const nextRun = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0
  );
  
  // If the time has already passed today, schedule for tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun;
}

/**
 * Schedule daily database backup
 * @param hour Hour of day to run (0-23)
 * @param minute Minute of hour to run (0-59)
 */
export function scheduleDailyBackup(hour: number = 0, minute: number = 0): void {
  // Cancel any existing job
  if (scheduledBackupJob) {
    clearTimeout(scheduledBackupJob);
    scheduledBackupJob = null;
    nextScheduledBackupTime = null;
  }
  
  const nextRunTime = calculateNextRunTime(hour, minute);
  const delay = nextRunTime.getTime() - Date.now();
  
  // Store next scheduled time
  nextScheduledBackupTime = nextRunTime;
  
  console.log(`Scheduled database backup for ${nextRunTime.toLocaleString()}`);
  
  // Schedule the job
  scheduledBackupJob = setTimeout(async () => {
    try {
      console.log('Starting scheduled database backup');
      await runFullBackup();
      console.log('Scheduled database backup completed successfully');
      
      // Schedule next day's backup
      scheduleDailyBackup(hour, minute);
    } catch (error) {
      console.error('Error in scheduled database backup:', error);
      
      // If there was an error, try again in 30 minutes
      const retryDelayMs = 30 * 60 * 1000;
      console.log(`Will retry backup in 30 minutes`);
      
      scheduledBackupJob = setTimeout(() => {
        scheduleDailyBackup(hour, minute);
      }, retryDelayMs);
    }
  }, delay);
}

/**
 * Get information about the next scheduled backup
 */
export function getNextScheduledBackupInfo(): { 
  isScheduled: boolean;
  nextRunTime: Date | null;
  timeUntilNextRun: number | null; // in milliseconds
} {
  if (!scheduledBackupJob || !nextScheduledBackupTime) {
    return { 
      isScheduled: false, 
      nextRunTime: null,
      timeUntilNextRun: null
    };
  }
  
  return {
    isScheduled: true,
    nextRunTime: nextScheduledBackupTime,
    timeUntilNextRun: nextScheduledBackupTime.getTime() - Date.now()
  };
}

/**
 * Cancel the scheduled backup
 */
export function cancelScheduledBackup(): boolean {
  if (scheduledBackupJob) {
    clearTimeout(scheduledBackupJob);
    scheduledBackupJob = null;
    nextScheduledBackupTime = null;
    return true;
  }
  return false;
}

/**
 * Run a backup immediately
 */
export async function runImmediateBackup(): Promise<{
  usersBackupPath: string;
  productsBackupPath: string;
  ordersBackupPath: string;
}> {
  try {
    console.log('Starting immediate database backup');
    const result = await runFullBackup();
    console.log('Immediate database backup completed');
    return result;
  } catch (error) {
    console.error('Error in immediate database backup:', error);
    throw error;
  }
}