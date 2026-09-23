import type { ReminderStatus } from '../lib/types';

const LABELS: Record<ReminderStatus, string> = {
  SCHEDULED: 'Scheduled',
  CALLING: 'Calling',
  ANSWERED: 'Answered',
  COMPLETED: 'Completed',
  NO_ANSWER: 'No answer',
  BUSY: 'Busy',
  FAILED: 'Failed',
  CANCELED: 'Canceled'
};

export function statusLabel(status: ReminderStatus): string {
  return LABELS[status] ?? status;
}

export function StatusChip({ status }: { status: ReminderStatus }) {
  return <span className={`chip chip-${status.toLowerCase()}`}>{statusLabel(status)}</span>;
}