// Format values as Australian dollars.
export function formatMoney(value: number | null | undefined,): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0, }).format(value);
}

// Format decimal growth and yield values as percentages.
export function formatPercent(value: number | null | undefined,): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'N/A';
  }

  return `${(value * 100).toFixed(2)}%`;
}

// Format a date for display.
export function formatDate(value: string | undefined,): string {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', });
}