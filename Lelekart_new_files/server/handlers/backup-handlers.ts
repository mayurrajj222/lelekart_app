import { Request, Response } from 'express';
import fs from 'fs';
import { 
  runFullBackup, 
  listBackups, 
  getBackupFilePath 
} from '../services/backup-service';
import { 
  scheduleDailyBackup, 
  getNextScheduledBackupInfo, 
  cancelScheduledBackup, 
  runImmediateBackup 
} from '../services/scheduler-service';

/**
 * Start an immediate backup
 */
export async function startBackup(req: Request, res: Response) {
  try {
    const result = await runImmediateBackup();
    res.status(200).json({
      message: 'Backup completed successfully',
      files: result
    });
  } catch (error) {
    console.error('Error starting backup:', error);
    res.status(500).json({ error: 'Failed to start backup' });
  }
}

/**
 * Schedule or update daily backup
 */
export function scheduleBackup(req: Request, res: Response) {
  try {
    const { hour, minute } = req.body;
    
    // Validate time inputs
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);
    
    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
      return res.status(400).json({ error: 'Hour must be between 0 and 23' });
    }
    
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      return res.status(400).json({ error: 'Minute must be between 0 and 59' });
    }
    
    scheduleDailyBackup(hourNum, minuteNum);
    
    const info = getNextScheduledBackupInfo();
    res.status(200).json({
      message: 'Backup scheduled successfully',
      nextBackup: info
    });
  } catch (error) {
    console.error('Error scheduling backup:', error);
    res.status(500).json({ error: 'Failed to schedule backup' });
  }
}

/**
 * Get backup schedule info
 */
export function getScheduleInfo(req: Request, res: Response) {
  try {
    const info = getNextScheduledBackupInfo();
    res.status(200).json(info);
  } catch (error) {
    console.error('Error getting backup schedule info:', error);
    res.status(500).json({ error: 'Failed to get backup schedule info' });
  }
}

/**
 * Cancel scheduled backup
 */
export function cancelBackup(req: Request, res: Response) {
  try {
    const result = cancelScheduledBackup();
    
    if (result) {
      res.status(200).json({ message: 'Scheduled backup cancelled successfully' });
    } else {
      res.status(404).json({ message: 'No scheduled backup found to cancel' });
    }
  } catch (error) {
    console.error('Error cancelling backup:', error);
    res.status(500).json({ error: 'Failed to cancel backup' });
  }
}

/**
 * Get list of all backups
 */
export function getBackups(req: Request, res: Response) {
  try {
    const backups = listBackups();
    res.status(200).json(backups);
  } catch (error) {
    console.error('Error getting backups list:', error);
    res.status(500).json({ error: 'Failed to get backups list' });
  }
}

/**
 * Download a backup file
 */
export function downloadBackup(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    
    // Security check - make sure the filename starts with users-, products-, or orders-backup-
    if (!filename.match(/^(users|products|orders)-backup-.*\.csv$/)) {
      return res.status(400).json({ error: 'Invalid backup filename' });
    }
    
    const filePath = getBackupFilePath(filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    // Send file
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ error: 'Failed to download backup' });
  }
}

/**
 * Delete a backup file
 */
export function deleteBackup(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    
    // Security check - make sure the filename starts with users-, products-, or orders-backup-
    if (!filename.match(/^(users|products|orders)-backup-.*\.csv$/)) {
      return res.status(400).json({ error: 'Invalid backup filename' });
    }
    
    const filePath = getBackupFilePath(filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Backup file not found' });
    }
    
    // Delete file
    fs.unlinkSync(filePath);
    
    res.status(200).json({ message: 'Backup file deleted successfully' });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ error: 'Failed to delete backup' });
  }
}