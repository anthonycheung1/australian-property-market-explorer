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

const API_BASE_URL =
  'https://property-yield-proxy.tonycheung75.workers.dev';

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
  const areaName =
    typeof yieldData.area_name === 'string'
      ? yieldData.area_name
      : result.suburb ?? suburb.trim();

  const areaLevel =
    typeof yieldData.area_level === 'string'
      ? yieldData.area_level
      : '';

  const asOf =
    typeof yieldData.as_of === 'string'
      ? yieldData.as_of
      : '';

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
