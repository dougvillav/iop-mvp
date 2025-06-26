
// Utility functions for formatting numbers and text
export const formatCompactNumber = (value: number, currency?: string): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M ${currency}`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K ${currency}`;
  }
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency
  }).format(value);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
