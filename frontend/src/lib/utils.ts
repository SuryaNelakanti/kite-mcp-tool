import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind CSS classes with clsx and tailwind-merge
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency with Indian Rupee symbol
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number, decimals = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

// Format date to a readable string
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date and time to a readable string
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Format a number with commas as thousand separators
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Truncate a string to a specified length and add ellipsis
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

// Generate a unique ID
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Debounce a function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Format instrument name for display
export function formatInstrumentName(name: string): string {
  if (!name) return '';
  // Convert to title case
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Calculate percentage change
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

// Format order status
export function formatOrderStatus(status: string): string {
  const statusMap: Record<string, string> = {
    COMPLETE: 'Complete',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    OPEN: 'Open',
    TRIGGER_PENDING: 'Trigger Pending',
  };
  return statusMap[status] || status;
}

// Format transaction type
export function formatTransactionType(type: string): string {
  const typeMap: Record<string, string> = {
    BUY: 'Buy',
    SELL: 'Sell',
  };
  return typeMap[type] || type;
}

// Validate email address
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Format instrument symbol
export function formatSymbol(symbol: string): string {
  if (!symbol) return '';
  return symbol.replace('NSE:', '').replace('BSE:', '');
}

// Get color based on value (positive/negative)
export function getValueColor(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}

// Format time in HH:MM:SS format
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Format large numbers with K, M, B suffixes
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Generate a random color based on a string
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

// Format instrument token
export function formatToken(token: string | number): string {
  if (!token) return '';
  return token.toString().replace(/(\d{4})(?=\d)/g, '$1 ');
}
