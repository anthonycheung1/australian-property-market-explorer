import { useState } from 'react';
import './Explore.css';

interface RentalYieldData {
  area_name: string;
  area_level: string;
  as_of: string;
  house: number | null;
  unit: number | null;
}

interface RentalYieldResponse {
  data: RentalYieldData;
}

function Explore() {
  const [suburb, setSuburb] = useState('');
  const [submittedSuburb, setSubmittedSuburb] = useState('');
  const [invalidSearch, setInvalidSearch] = useState(false);

  const [yieldData, setYieldData] = useState<RentalYieldData | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function isValidSearchBoxInput(input: string) {
    return input.trim() !== '';
  }

  async function fetchRentalYield(searchSuburb: string) {
    setLoading(true);
    setApiError('');
    setYieldData(null);

    try {
      const url =
        `https://property-yield-proxy.tonycheung75.workers.dev/?suburb=${encodeURIComponent(searchSuburb)}`;

      const response = await fetch(url, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorBody = await response.text();

        console.error(
          'Rental yield request failed:',
          response.status,
          errorBody
        );

        throw new Error(
          `Request failed: ${response.status} ${errorBody}`
        );
      }

      const result: RentalYieldResponse = await response.json();

      if (!result.data) {
        throw new Error('The API response did not contain rental yield data.');
      }

      setYieldData(result.data);
    } catch (error) {
      console.error('Error fetching rental yield:', error);

      setApiError(
        'Unable to retrieve rental yield data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!isValidSearchBoxInput(suburb)) {
      setSubmittedSuburb('');
      setInvalidSearch(true);
      setYieldData(null);
      setApiError('');
      return;
    }

    const searchSuburb = suburb.trim();

    setInvalidSearch(false);
    setSubmittedSuburb(searchSuburb);

    await fetchRentalYield(searchSuburb);
  }

  function formatYield(value: number | null) {
    if (value === null || value === undefined) {
      return 'Data unavailable';
    }

    return `${(value * 100).toFixed(2)}%`;
  }

  return (
    <div className="explore-page">
      <h1>Explore Australian Property Markets</h1>
      <p>Explore Australian property markets by suburb.</p>

      <section className="search-section">
        <label htmlFor="suburb-search-textbox">
          Suburb/Postcode
        </label>

        <input
          className="search-box"
          id="suburb-search-textbox"
          name="suburb-or-postcode"
          type="text"
          placeholder="e.g., Belmont North"
          value={suburb}
          onChange={(event) => {
            const value = event.currentTarget.value;

            setSuburb(value);

            if (isValidSearchBoxInput(value)) {
              setInvalidSearch(false);
            }
          }}
          aria-invalid={invalidSearch}
          aria-describedby={
            invalidSearch ? 'suburb-search-error' : undefined
          }
        />

        {invalidSearch && (
          <p id="suburb-search-error" role="alert">
            Please enter a suburb or postcode.
          </p>
        )}

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Submit'}
        </button>
      </section>

      {submittedSuburb !== '' && (
        <p>Search results for {submittedSuburb}</p>
      )}

      {loading && <p>Retrieving property data...</p>}

      {apiError !== '' && (
        <p role="alert">{apiError}</p>
      )}

      <section className="metric-cards">
        <div className="metric-card">
          <h2>House gross rental yield</h2>

          {yieldData && (
            <p>{formatYield(yieldData.house)}</p>
          )}
        </div>

        <div className="metric-card">
          <h2>Unit gross rental yield</h2>

          {yieldData && (
            <p>{formatYield(yieldData.unit)}</p>
          )}
        </div>
      </section>

      {yieldData && (
        <p>
          Data for {yieldData.area_name}
          {yieldData.as_of && ` · Updated ${yieldData.as_of}`}
        </p>
      )}
    </div>
  );
}

export default Explore;