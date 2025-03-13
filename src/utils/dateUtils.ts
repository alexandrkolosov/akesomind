/**
 * Utilities for date and time formatting
 */

/**
 * Formats a date string or Date object to a human-readable format
 * @param date - Date string (ISO format) or Date object
 * @returns Formatted date string (e.g., "May 12, 2024")
 */
export function formatDate(date: string | Date): string {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Formats a time string or Date object to a human-readable time format
 * @param time - Time string (ISO format) or Date object
 * @returns Formatted time string (e.g., "2:00 PM")
 */
export function formatTime(time: string | Date): string {
  if (!time) return '-';
  
  const timeObj = typeof time === 'string' ? new Date(time) : time;
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(timeObj);
}

/**
 * Format date and time together
 * @param dateTimeString - ISO datetime string or date object
 * @returns formatted date and time string (e.g., "Jan 15, 2023 at 2:30 PM")
 */
export function formatDateTime(dateTimeString: string | Date): string {
  if (!dateTimeString) return '';
  
  const date = typeof dateTimeString === 'string' ? new Date(dateTimeString) : dateTimeString;
  
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Check if a date is in the past
 * @param dateString - ISO date string or date object
 * @returns boolean indicating if the date is in the past
 */
export function isPastDate(dateString: string | Date): boolean {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  return date < now;
}

/**
 * Get relative time description (e.g., "2 days ago", "in 3 hours")
 * @param dateString - ISO date string or date object
 * @returns string with relative time description
 */
export function getRelativeTimeDescription(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays === -1) return 'Yesterday';
  if (diffHours < 0) return `${Math.abs(diffHours)} hours ago`;
  if (diffMins < 0) return `${Math.abs(diffMins)} minutes ago`;
  if (diffSecs < 0) return 'Just now';
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `in ${diffMins} minutes`;
  if (diffHours < 24) return `in ${diffHours} hours`;
  if (diffDays === 1) return 'Tomorrow';
  return `in ${diffDays} days`;
}

/**
 * Gets the current date in ISO format (YYYY-MM-DD)
 * @returns Current date in ISO format
 */
export function getCurrentDateISO(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Calculates the difference between two dates in days
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  // Convert both dates to milliseconds
  const d1Ms = d1.getTime();
  const d2Ms = d2.getTime();
  
  // Calculate the difference in milliseconds
  const differenceMs = Math.abs(d1Ms - d2Ms);
  
  // Convert back to days and return
  return Math.floor(differenceMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a duration in minutes to a readable format
 * @param durationMinutes - Duration in minutes
 * @returns Formatted duration (e.g., "1 hour 30 minutes")
 */
export function formatDuration(durationMinutes: number): string {
  if (!durationMinutes || durationMinutes <= 0) return '-';
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  if (minutes > 0) {
    if (result) result += ' ';
    result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  return result;
} 