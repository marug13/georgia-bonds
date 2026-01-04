import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format number as Georgian Lari
 */
export function formatLari(amount: number): string {
  return `₾${amount.toFixed(2)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Calculate time remaining until date
 */
export function getTimeRemaining(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Closed';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  }
}

/**
 * Get category display name in Georgian
 */
export function getCategoryNameKa(category: string): string {
  const categories: Record<string, string> = {
    POLITICS: 'პოლიტიკა',
    SPORTS: 'სპორტი',
    ECONOMY: 'ეკონომიკა',
    CULTURE: 'კულტურა',
    WEATHER: 'ამინდი',
    ENTERTAINMENT: 'გართობა',
  };
  return categories[category] || category;
}

/**
 * Get category color
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    POLITICS: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    SPORTS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ECONOMY: 'bg-green-500/10 text-green-400 border-green-500/20',
    CULTURE: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    WEATHER: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    ENTERTAINMENT: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  return colors[category] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
}
