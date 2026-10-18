
export interface RentalYieldData {
  area_name: string;
  area_level: string;
  as_of: string;
  house: number | null;
  unit: number | null;
}

interface RentalYieldResponse {
  data: RentalYieldData;
}

// Fetch rental yield data for a suburb
export async function fetchRentalYield(
  suburb: string
): Promise<RentalYieldData> {
  const url =
    `https://property-yield-proxy.tonycheung75.workers.dev/?suburb=${encodeURIComponent(suburb)}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorBody = await response.text();

    console.error(
      'Rental yield request failed:',
      response.status,
      errorBody
    );

    throw new Error(`Request failed: ${response.status}`);
  }

  const result: RentalYieldResponse = await response.json();

  if (!result.data) {
    throw new Error(
      'The API response did not contain rental yield data.'
    );
  }

  return result.data;
}