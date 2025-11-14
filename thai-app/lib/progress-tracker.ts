// Simple in-memory progress tracker with detailed logs
interface ProgressData {
  progress: number;
  message: string;
  logs: string[];
}

const progressStore = new Map<string, ProgressData>();

export function setProgress(jobId: string, progress: number, message: string) {
  const existing = progressStore.get(jobId);
  const logs = existing?.logs || [];

  // Add timestamp to log message
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;

  // Keep last 50 log entries
  const updatedLogs = [...logs, logEntry].slice(-50);

  progressStore.set(jobId, { progress, message, logs: updatedLogs });
  console.log(`[Progress ${jobId}] ${progress}% - ${message}`);
}

export function addLog(jobId: string, logMessage: string) {
  const existing = progressStore.get(jobId);
  if (!existing) {
    setProgress(jobId, 0, logMessage);
    return;
  }

  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${logMessage}`;
  const updatedLogs = [...existing.logs, logEntry].slice(-50);

  progressStore.set(jobId, {
    ...existing,
    logs: updatedLogs
  });

  console.log(`[Log ${jobId}] ${logMessage}`);
}

export function getProgress(jobId: string) {
  return progressStore.get(jobId) || { progress: 0, message: 'Initializing...', logs: [] };
}

export function clearProgress(jobId: string) {
  progressStore.delete(jobId);
}
