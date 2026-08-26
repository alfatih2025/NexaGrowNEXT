/**
 * Format a date string or Date into a human-readable relative time string in Indonesian.
 * e.g. "Baru saja", "5 menit lalu", "2 jam lalu", "1 hari lalu"
 */
export function timeAgo(date: string | Date | null | undefined): string {
  if (!date) return 'Tidak diketahui';

  const now = Date.now();
  const then = new Date(date).getTime();

  if (isNaN(then)) return 'Tidak diketahui';

  const diffMs = now - then;
  if (diffMs < 0) return 'Baru saja';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 30) return 'Baru saja';
  if (seconds < 60) return `${seconds} detik lalu`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;

  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}
