// Calculate the gross yield
export function getGrossYield(weeklyRent: number | null | undefined, propertyValue: number | null | undefined,): number | null {
  if (weeklyRent == null || !Number.isFinite(weeklyRent) || weeklyRent < 0) {
    return null;
  }

  if (propertyValue == null || !Number.isFinite(propertyValue) || propertyValue <= 0) {
    return null;
  }

  return weeklyRent * 52 / propertyValue;
}

// Calculate the annualised property price growth
export function getAnnualGrowth(startPrice: number | null | undefined, endPrice: number | null | undefined, years: number,): number | null {
  if (startPrice == null || !Number.isFinite(startPrice) || startPrice <= 0) {
    return null;
  }

  if (endPrice == null || !Number.isFinite(endPrice) || endPrice <= 0) {
    return null;
  }

  if (!Number.isFinite(years) || years <= 0) {
    return null;
  }

  return Math.pow(endPrice / startPrice, 1 / years) - 1;
}