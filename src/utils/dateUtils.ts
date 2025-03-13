/**
 * Utilities for date and time formatting
 */

/**
 * Format a date string to a localized display format
 * @param dateString - ISO date string or date object
 * @returns formatted date string (e.g., "Jan 15, 2023")
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format a time string to a localized display format
 * @param timeString - ISO time string or date object
 * @returns formatted time string (e.g., "2:30 PM")
 */
export function formatTime(timeString: string | Date): string {
  if (!timeString) return '';
  
  const date = typeof timeString === 'string' ? new Date(timeString) : timeString;
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
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