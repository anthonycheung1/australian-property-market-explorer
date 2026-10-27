export interface RentalYieldData {
  area_name: string;
  area_level: string;
  as_of: string;
  house: number | null;
  unit: number | null;
}

interface RentalYieldResponse {
  data?: Record<string, unknown>;
  suburb?: string;
  error?: string;
}

type UnknownRecord = Record<string, unknown>;

const API_BASE_URL = 'https://property-yield-proxy.tonycheung75.workers.dev';

// Check whether a value is an object.
function isRecord(value: unknown): value is UnknownRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

// Convert a value into a number when possible.
function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const number = Number(value);

    return Number.isFinite(number) ? number : null;
  }

  return null;
}

// Extract a number from either a direct value or a nested object.
function firstNumber(value: unknown): number | null {
  const number = toNumber(value);

  if (number !== null) {
    return number;
  }

  if (!isRecord(value)) {
    return null;
  }

  for (const key of [
    'value',
    'median',
    'amount',
    'price',
    'rent',
    'yield',
    'yield_pct',
    'percentage',
    'count',
    'days',
  ]) {
    const result = firstNumber(value[key]);

    if (result !== null) {
      return result;
    }
  }

  return null;
}

// Fetch rental yield data for a suburb.
export async function fetchRentalYield(
  suburb: string,
): Promise<RentalYieldData> {
  const url = new URL(API_BASE_URL);

  url.searchParams.set('suburb', suburb.trim());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  let result: RentalYieldResponse;

  try {
    result = (await response.json()) as RentalYieldResponse;
  } catch {
    throw new Error(
      'The market data service returned an invalid response.',
    );
  }

  if (!response.ok) {
    throw new Error(
      result.error ??
        `Request failed: ${response.status}`,
    );
  }

  if (!isRecord(result.data)) {
    throw new Error(
      'The API response did not contain market data.',
    );
  }

  // The rental yield data is nested inside data.yield_pct.
  const yieldData = result.data.yield_pct;

  if (!isRecord(yieldData)) {
    console.error(
      'Rental yield data not found.',
      Object.keys(result.data),
    );

    throw new Error(
      'The API response did not contain rental yield data.',
    );
  }

  // Extract the house and unit yields.
  const house = firstNumber(yieldData.house);
  const unit = firstNumber(yieldData.unit);

  // Read the metadata from the rental yield object.
  const areaName = typeof yieldData.area_name === 'string' ? yieldData.area_name : result.suburb ?? suburb.trim();
  const areaLevel = typeof yieldData.area_level === 'string' ? yieldData.area_level : '';
  const asOf = typeof yieldData.as_of === 'string' ? yieldData.as_of : '';

  const rentalYield: RentalYieldData = {
    area_name: areaName,
    area_level: areaLevel,
    as_of: asOf,
    house,
    unit,
  };

  console.log('Rental yield data:', rentalYield);

  return rentalYield;
}

// One observation in a historical price or rent series.
export interface MarketDataPoint {
  date: string;
  value: number;
}

// Current market values for houses and units.
export interface MarketValueByPropertyType {
  area_name?: string;
  area_level?: string;
  as_of?: string;
  house?: number | null;
  unit?: number | null;
}

// Historical observations for houses and units.
export interface MarketHistoryByPropertyType {
  area_name?: string;
  area_level?: string;
  house?: MarketDataPoint[] | null;
  unit?: MarketDataPoint[] | null;
}

// Growth values are decimals.
// For example, 0.0847 represents 8.47% growth.
export interface GrowthPeriods {
  '1yr'?: number | null;
  '3yr'?: number | null;
  '5yr'?: number | null;
  '10yr'?: number | null;
}

// Price growth has nested growth periods for each property type.
export interface PriceGrowthData {
  area_name?: string;
  area_level?: string;
  house?: GrowthPeriods | null;
  unit?: GrowthPeriods | null;
  as_of?: string;
}

// Historical transaction counts for a property type.
export interface TransactionHistory {
  value?: number | null;
  series?: MarketDataPoint[] | null;
}

// Transaction volume contains nested objects, not simple numbers.
export interface TransactionVolumeData {
  area_name?: string;
  area_level?: string;
  metric?: string;
  house?: TransactionHistory | null;
  unit?: TransactionHistory | null;
}

// Market data returned by the existing Cloudflare Worker.
export interface SuburbPerformanceData {
  median_sale_price?: MarketValueByPropertyType | null;
  median_sale_price_series?: MarketHistoryByPropertyType | null;
  median_rent?: MarketValueByPropertyType | null;
  median_rent_series?: MarketHistoryByPropertyType | null;
  price_growth?: PriceGrowthData | null;
  yield_pct?: MarketValueByPropertyType | null;
  days_on_market?: MarketValueByPropertyType | null;
  transaction_volume?: TransactionVolumeData | null;
}

// The response envelope returned by the API proxy.
interface SuburbPerformanceResponse {
  data?: unknown;
  suburb?: string;
  error?: string;
}

// Fetch suburb performance data.
export async function fetchSuburbPerformance(suburb: string,): Promise<SuburbPerformanceData> {
  const url = new URL(API_BASE_URL);

  url.searchParams.set('suburb', suburb.trim());

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  let result: SuburbPerformanceResponse;

  try {
    result = (await response.json()) as SuburbPerformanceResponse;
  } catch {
    throw new Error('The market data service returned an invalid response.',);
  }

  if (!response.ok) {
    throw new Error(result.error ?? `Request failed: ${response.status}`,);
  }

  if (!isRecord(result.data)) {
    throw new Error('The API response did not contain suburb performance data.',);
  }

  return result.data as SuburbPerformanceData;
}
