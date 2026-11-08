import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './Explore.css';
import { fetchRentalYield, type RentalYieldData, } from '../api/propertyApi';
import SearchBar from '../components/SearchBar';
import { supportedSuburbs } from '../data/suburbs.ts';
import { StatCardSkeleton } from '../components/Skeleton';

interface RentalYieldRequestState {
  requestKey: string;
  data: RentalYieldData | null;
  error: string;
}

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search state
  const [suburb, setSuburb] = useState(() => searchParams.get('suburb') ?? '');
  const [invalidSearch, setInvalidSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchError, setSearchError] = useState('');

  // API state
  const [requestState, setRequestState] = useState<RentalYieldRequestState | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Read the selected suburb from the URL.
  const searchValue = searchParams.get('suburb');

  // Find the selected suburb in the supported suburbs list.
  const searchSuburb = supportedSuburbs.find((supportedSuburb) =>
    supportedSuburb.value.toLowerCase() === searchValue?.trim().toLowerCase()
    || supportedSuburb.label.toLowerCase() === searchValue?.trim().toLowerCase(),
  );

  // Derive the submitted suburb from the URL.
  const submittedSuburb = searchSuburb?.label ?? '';

  // Identify the current API request, including its retry attempt.
  const requestKey = searchSuburb
    ? `${searchSuburb.value}:${retryCount}`
    : '';

  // Derive the loading state from the current request.
  const loading = Boolean(
    searchSuburb
    && requestState?.requestKey !== requestKey,
  );

  // Only use data returned for the currently selected suburb.
  const yieldData = requestState?.requestKey === requestKey
    ? requestState.data
    : null;

  // Derive the API error from the current request or URL.
  const unsupportedSuburbError = searchValue && !searchSuburb
    ? `"${searchValue}" is not a supported suburb.`
    : '';

  const apiError = searchSuburb
    ? requestState?.requestKey === requestKey
      ? requestState.error
      : ''
    : unsupportedSuburbError || searchError;

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
    if (!searchSuburb) {
      return;
    }

    const controller = new AbortController();

    fetchRentalYield(searchSuburb.value, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setRequestState({
            requestKey,
            data: result,
            error: '',
          });
        }
      })
      .catch((fetchError: unknown) => {
        if (!controller.signal.aborted) {
          console.error('Error fetching rental yield:', fetchError);

          setRequestState({
            requestKey,
            data: null,
            error: fetchError instanceof Error
              ? fetchError.message
              : 'An unexpected error occurred while retrieving rental yield data.',
          });
        }
      });

    // Cancel the request if the search changes or the page unmounts.
    return () => {
      controller.abort();
    };
  }, [searchSuburb, requestKey]);

  // Handle suburb search
  function handleSearch() {
    // Clear suggestions when the user submits a search
    setSuggestions([]);
    setSearchError('');

    if (!isValidSearchBoxInput(suburb)) {
      setInvalidSearch(true);

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('suburb');
      setSearchParams(nextSearchParams, { replace: true });
      return;
    }

    const matchingSuburb = supportedSuburbs.find((supportedSuburb) =>
      supportedSuburb.label.trim().toLowerCase() === suburb.trim().toLowerCase()
      || supportedSuburb.value.trim().toLowerCase() === suburb.trim().toLowerCase(),
    );

    // Check whether a matching suburb was found before updating the URL.
    if (matchingSuburb) {
      setInvalidSearch(false);

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('suburb', matchingSuburb.value);
      setSearchParams(nextSearchParams);
    } else {
      setInvalidSearch(false);
      setSearchError(`"${suburb.trim()}" is not a supported suburb.`);

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

    // Clear existing error messages
    setSearchError('');

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
    setSearchError('');
  }

  // Dismiss the suggestions when the user presses Escape
  function onDismissSuggestions() {
    setSuggestions([]);
  }

  // Find the selected suburb so its detail page can be linked.
  const selectedSuburb = searchSuburb;

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
        validationMessage={searchError}
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