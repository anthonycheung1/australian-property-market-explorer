import { describe, expect, it } from 'vitest';
import { getGrossYield, getAnnualGrowth } from './calculations';

describe('getGrossYield', () => {
  it('calculates gross rental yield correctly', () => {
    const result = getGrossYield(500, 800000);

    expect(result).toBeCloseTo(0.0325);
  });

  it('returns null when weekly rent is null', () => {
    expect(getGrossYield(null, 800000)).toBeNull();
  });

  it('returns null when property value is null', () => {
    expect(getGrossYield(500, null)).toBeNull();
  });

  it('returns null when weekly rent is negative', () => {
    expect(getGrossYield(-500, 800000)).toBeNull();
  });

  it('returns null when property value is zero', () => {
    expect(getGrossYield(500, 0)).toBeNull();
  });

  it('returns null when inputs are not finite numbers', () => {
    expect(getGrossYield(Infinity, 800000)).toBeNull();
    expect(getGrossYield(500, NaN)).toBeNull();
  });
});

describe('getAnnualGrowth', () => {
  it('calculates annualised growth correctly', () => {
    const result = getAnnualGrowth(100000, 121000, 2);

    expect(result).toBeCloseTo(0.1);
  });

  it('returns null when starting price is zero', () => {
    expect(getAnnualGrowth(0, 121000, 2)).toBeNull();
  });

  it('returns null when ending price is negative', () => {
    expect(getAnnualGrowth(100000, -121000, 2)).toBeNull();
  });

  it('returns null when the number of years is zero', () => {
    expect(getAnnualGrowth(100000, 121000, 0)).toBeNull();
  });

  it('returns null when the number of years is negative', () => {
    expect(getAnnualGrowth(100000, 121000, -2)).toBeNull();
  });

  it('returns null when inputs are not finite numbers', () => {
    expect(getAnnualGrowth(Infinity, 121000, 2)).toBeNull();
    expect(getAnnualGrowth(100000, NaN, 2)).toBeNull();
  });
});