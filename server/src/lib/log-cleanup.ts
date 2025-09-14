import fs from 'node:fs'
import path from 'node:path'

/**
 * Sistema di rotazione e cleanup dei log files
 */

export interface LogCleanupOptions {
  logDir: string
  maxFiles: number
  retentionDays: number
}

/**
 * Pulisce i file di log vecchi basandosi sui parametri di retention
 */
export const cleanupOldLogs = async (options: LogCleanupOptions): Promise<void> => {
  const { logDir, maxFiles, retentionDays } = options
  
  try {
    if (!fs.existsSync(logDir)) {
      return
    }
    
    const files = fs.readdirSync(logDir)
    const logFiles = files
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filepath = path.join(logDir, file)
        const stats = fs.statSync(filepath)
        return {
          name: file,
          path: filepath,
          mtime: stats.mtime,
          size: stats.size
        }
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()) // Più recenti prima
    
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000))
    
    // Rimuovi file più vecchi della retention policy
    const filesToRemove = logFiles.filter(file => file.mtime < cutoffDate)
    
    // Rimuovi file in eccesso se ne abbiamo più del limite
    if (logFiles.length > maxFiles) {
      const excessFiles = logFiles.slice(maxFiles)
      filesToRemove.push(...excessFiles)
    }
    
    // Rimuovi i file duplicati dall'array
    const uniqueFilesToRemove = filesToRemove.filter((file, index, self) => 
      self.findIndex(f => f.path === file.path) === index
    )
    
    for (const file of uniqueFilesToRemove) {
      try {
        fs.unlinkSync(file.path)
        console.log(`Removed old log file: ${file.name} (${(file.size / 1024).toFixed(1)} KB, modified: ${file.mtime.toISOString()})`)
      } catch (error) {
        console.warn(`Failed to remove log file ${file.name}:`, error)
      }
    }
    
    if (uniqueFilesToRemove.length > 0) {
      console.log(`Log cleanup completed: removed ${uniqueFilesToRemove.length} old files`)
    }
    
  } catch (error) {
    console.warn('Log cleanup failed:', error)
  }
}

/**
 * Ottiene statistiche sui file di log
 */
export const getLogStats = (logDir: string): { totalFiles: number; totalSize: number; files: Array<{ name: string; size: number; modified: Date }> } => {
  try {
    if (!fs.existsSync(logDir)) {
      return { totalFiles: 0, totalSize: 0, files: [] }
    }
    
    const files = fs.readdirSync(logDir)
    const logFiles = files
      .filter(file => file.endsWith('.log'))
      .map(file => {
        const filepath = path.join(logDir, file)
        const stats = fs.statSync(filepath)
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime
        }
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime())
    
    const totalSize = logFiles.reduce((sum, file) => sum + file.size, 0)
    
    return {
      totalFiles: logFiles.length,
      totalSize,
      files: logFiles
    }
  } catch (error) {
    console.warn('Failed to get log stats:', error)
    return { totalFiles: 0, totalSize: 0, files: [] }
  }
}