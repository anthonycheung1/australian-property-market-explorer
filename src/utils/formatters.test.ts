import { describe, expect, it } from 'vitest';
import { formatMoney, formatPercent, formatDate } from './formatters';

describe('formatMoney', () => {
  it('formats Australian dollars correctly', () => {
    expect(formatMoney(100000)).toContain('$100,000');
  });

  it('returns N/A when the value is null', () => {
    expect(formatMoney(null)).toBe('N/A');
  });

  it('returns N/A when the value is undefined', () => {
    expect(formatMoney(undefined)).toBe('N/A');
  });

  it('returns N/A when the value is not finite', () => {
    expect(formatMoney(Infinity)).toBe('N/A');
    expect(formatMoney(NaN)).toBe('N/A');
  });
});

describe('formatPercent', () => {
  it('formats decimal values as percentages', () => {
    expect(formatPercent(0.035)).toBe('3.50%');
  });

  it('formats zero correctly', () => {
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('returns N/A when the value is null', () => {
    expect(formatPercent(null)).toBe('N/A');
  });

  it('returns N/A when the value is not finite', () => {
    expect(formatPercent(Infinity)).toBe('N/A');
  });
});

describe('formatDate', () => {
  it('formats dates in Australian format', () => {
    expect(formatDate('2025-01-15')).toBe('15 Jan 2025');
  });

  it('returns Date unavailable when the date is undefined', () => {
    expect(formatDate(undefined)).toBe('Date unavailable');
  });

  it('returns the original value when the date is invalid', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});