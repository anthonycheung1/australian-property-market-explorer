
import { useState } from 'react';
import './Explore.css';
import {
  fetchRentalYield,
  type RentalYieldData,
} from '../api/propertyApi';

function Explore() {
  // Search state
  const [suburb, setSuburb] = useState('');
  const [submittedSuburb, setSubmittedSuburb] = useState('');
  const [invalidSearch, setInvalidSearch] = useState(false);

  // API state
  const [yieldData, setYieldData] = useState<RentalYieldData | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Validate search input
  function isValidSearchBoxInput(input: string) {
    return input.trim() !== '';
  }

  // Format rental yield as a percentage
  function formatYield(value: number | null) {
    if (value === null) {
      return 'Data unavailable';
    }

    return `${(value * 100).toFixed(2)}%`;
  }

  // Handle suburb search
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
    setLoading(true);
    setApiError('');
    setYieldData(null);

    try {
      const result = await fetchRentalYield(searchSuburb);
      setYieldData(result);
    } catch (error) {
      console.error('Error fetching rental yield:', error);

      setApiError(
        'Unable to retrieve rental yield data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="explore-page">
      {/* Page introduction */}
      <section className="page-intro">
        <h1>Explore Australian Property Markets</h1>
        <p>Explore Australian property markets by suburb.</p>
      </section>

      {/* Suburb search */}
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

        <div className="availability-note">
          <p className="availability-heading">
            Demo limitation: supported suburbs
          </p>

          <ul className="availability-list">
            <li>Bondi <span>(NSW)</span></li>
            <li>Belmont North <span>(NSW)</span></li>
            <li>St Kilda <span>(VIC)</span></li>
            <li>Fortitude Valley <span>(QLD)</span></li>
            <li>Subiaco <span>(WA)</span></li>
            <li>Unley <span>(SA)</span></li>
            <li>Sandy Bay <span>(TAS)</span></li>
            <li>Kambah <span>(ACT)</span></li>
            <li>Nightcliff <span>(NT)</span></li>
          </ul>
        </div>
      </section>

      {/* Search status and errors */}
      {submittedSuburb !== '' && (
        <h2 className="search-results-heading">
          Search results for {submittedSuburb}
        </h2>
      )}

      {loading && (
        <p role="status">Retrieving property data...</p>
      )}

      {apiError !== '' && (
        <p role="alert">{apiError}</p>
      )}

      {/* Rental yield results */}
      <section className="metric-cards">
        <div className="metric-card">
          <h2>House gross rental yield</h2>
          <p>
            {yieldData
              ? formatYield(yieldData.house)
              : '—'}
          </p>
        </div>

        <div className="metric-card">
          <h2>Unit gross rental yield</h2>
          <p>
            {yieldData
              ? formatYield(yieldData.unit)
              : '—'}
          </p>
        </div>
      </section>

      {/* Data source information */}
      {yieldData && (
        <p className="data-source">
          Data for {yieldData.area_name}
          {yieldData.as_of && ` · Updated ${yieldData.as_of}`}
        </p>
      )}
    </div>
  );
}

export default Explore;