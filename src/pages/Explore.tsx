import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Explore.css';
import { fetchRentalYield, type RentalYieldData, } from '../api/propertyApi';
import SearchBar from '../components/SearchBar';
import { supportedSuburbs } from '../data/suburbs.ts';
import { StatCardSkeleton } from '../components/Skeleton';

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [suburb, setSuburb] = useState(() => searchParams.get('suburb') ?? '');
  const [submittedSuburb, setSubmittedSuburb] = useState('');
  const [invalidSearch, setInvalidSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // API state
  const [yieldData, setYieldData] = useState<RentalYieldData | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

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

  // Fetch rental yield data for the suburb stored in the URL.
  useEffect(() => {
    const searchValue = searchParams.get('suburb');

    if (!searchValue) {
      setSubmittedSuburb('');
      setYieldData(null);
      setApiError('');
      setLoading(false);
      return;
    }

    const searchSuburb = supportedSuburbs.find((supportedSuburb) =>
      supportedSuburb.value.toLowerCase() === searchValue.trim().toLowerCase()
      || supportedSuburb.label.toLowerCase() === searchValue.trim().toLowerCase(),
    );

    if (!searchSuburb) {
      setSubmittedSuburb('');
      setYieldData(null);
      setLoading(false);
      setApiError(`"${searchValue}" is not a supported suburb.`);
      return;
    }

    const controller = new AbortController();

    setSuburb(searchSuburb.label);
    setSubmittedSuburb(searchSuburb.label);
    setLoading(true);
    setApiError('');
    setYieldData(null);

    fetchRentalYield(searchSuburb.value, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setYieldData(result);
        }
      })
      .catch((fetchError: unknown) => {
        if (!controller.signal.aborted) {
          console.error('Error fetching rental yield:', fetchError);

          setApiError(fetchError instanceof Error ? fetchError.message : 'An unexpected error occurred while retrieving rental yield data.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    // Cancel the request if the search changes or the page unmounts.
    return () => {
      controller.abort();
    };
  }, [searchParams, retryCount]);

  // Handle suburb search
  function handleSearch() {
    // Clear suggestions when the user submits a search
    setSuggestions([]);

    if (!isValidSearchBoxInput(suburb)) {
      setInvalidSearch(true);
      setYieldData(null);
      setApiError('');

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('suburb');
      setSearchParams(nextSearchParams, { replace: true });
      return;
    }

    const searchSuburb = supportedSuburbs.find((supportedSuburb) =>
      supportedSuburb.label.trim().toLowerCase() === suburb.trim().toLowerCase()
      || supportedSuburb.value.trim().toLowerCase() === suburb.trim().toLowerCase(),
    );

    // Check whether a matching suburb was found before updating the URL.
    if (searchSuburb) {
      setInvalidSearch(false);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('suburb', searchSuburb.value);
      setSearchParams(nextSearchParams);
    } else {
      setInvalidSearch(false);
      setSubmittedSuburb('');
      setLoading(false);
      setApiError(`"${suburb.trim()}" is not a supported suburb.`);
      setYieldData(null);

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('suburb');
      setSearchParams(nextSearchParams, { replace: true });
    }
  }

  // Retry fetching rental yield data for the submitted suburb.
  function handleRetry() {
    setRetryCount((currentCount) => currentCount + 1);
  }

  // Handle changes to the search input
  function onSuburbChange(value: string) {
    setSuburb(value);
    // Clear the previous search heading and prevents the old suburb's detail link from appearing,
    // and clear the previous rental-yield results so they aren't mistaken for results for the newly edited input.
    setSubmittedSuburb('');
    setYieldData(null);

    // Clear existing error messages
    setApiError('');

    // Remove the previous search from the URL when the user edits the input.
    if (searchParams.has('suburb')) {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('suburb');
      setSearchParams(nextSearchParams, { replace: true });
    }

    // Find suburbs whose labels contain the user's input
    const suggestedSuburbs = value.trim().length === 0 ? [] : supportedSuburbs.filter((supportedSuburb) => {
      return supportedSuburb.label.toLowerCase().includes(value.trim().toLowerCase());
    });

    // Store the matching suburb labels as suggestions
    setSuggestions(suggestedSuburbs.map((supportedSuburb) => {
      return supportedSuburb.label;
    }));

    if (isValidSearchBoxInput(value)) {
      setInvalidSearch(false);
    }
  }

  // Handle selection of a suggested suburb
  function onSuggestionSelect(value: string) {
    setSuburb(value);
    setSuggestions([]);
    setInvalidSearch(false);
    setApiError('');
  }

  // Dismiss the suggestions when the user presses Escape
  function onDismissSuggestions() {
    setSuggestions([]);
  }

  // Find the selected suburb so its detail page can be linked.
  const selectedSuburb = supportedSuburbs.find(
    (supportedSuburb) => supportedSuburb.label === submittedSuburb
  );

  // Check whether rental yield data is available for either property type.
  const hasRentalYieldData = yieldData !== null && (yieldData.house !== null || yieldData.unit !== null);

  return (
    <div className="explore-page">
      {/* Suburb search */}
      <SearchBar
        suburb={suburb}
        onSuburbChange={onSuburbChange}
        onSuggestionSelect={onSuggestionSelect}
        onDismissSuggestions={onDismissSuggestions}
        onSearch={handleSearch}
        loading={loading}
        invalidSearch={invalidSearch}
        suggestedSuburbs={suggestions}
      />

      {/* Page introduction */}
      <section className="page-intro">
        <h1>Explore Australian Property Markets</h1>
        <p>Explore Australian property markets by suburb.</p>
      </section>

      {/* Search status and errors */}
      {submittedSuburb !== '' && (
        <h2 className="search-results-heading" aria-live="polite">
          Search results for {submittedSuburb}
        </h2>
      )}

      {loading && (
        <p role="status" aria-live="polite">
          Retrieving property data for {submittedSuburb}...
        </p>
      )}

      {apiError !== '' && (
        <div className="explore-error-panel" role="alert">
          <p>{apiError}</p>

          {submittedSuburb !== '' && (
            <button
              type="button"
              className="retry-button"
              onClick={handleRetry}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {/* Rental yield results */}
      <section
        className="metric-cards"
        aria-label="Rental yield results"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <div className="metric-card">
              <h2>House gross rental yield</h2>
              <p>
                {yieldData ? formatYield(yieldData.house) : '—'}
              </p>
            </div>

            <div className="metric-card">
              <h2>Unit gross rental yield</h2>
              <p>
                {yieldData ? formatYield(yieldData.unit) : '—'}
              </p>
            </div>
          </>
        )}
      </section>

      {/* Explain when the API request succeeded but no rental yield figures were available. */}
      {yieldData && !hasRentalYieldData && !loading && (
        <p className="explore-empty-state">
          Rental yield data is not currently available for houses or units in this suburb.
          Other market statistics may still be available.
        </p>
      )}

      {/* Link to the detailed suburb page */}
      {selectedSuburb && yieldData && !loading && !apiError && (
        <p className="suburb-details-link">
          <Link
            to={`/suburb/${selectedSuburb.state.toLowerCase()}/${selectedSuburb.value.toLowerCase().replaceAll(' ', '-')}`}
          >
            View detailed market data for {selectedSuburb.label}
          </Link>
        </p>
      )}

      {/* Data source information */}
      {yieldData && (
        <p className="data-source">
          Data source information: {yieldData.area_name}
          {yieldData.as_of && ` · Updated ${yieldData.as_of}`}
        </p>
      )}
    </div>
  );
}

export default Explore;
