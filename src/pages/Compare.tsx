import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supportedSuburbs } from '../data/suburbs.ts';
import { fetchSuburbPerformance, type SuburbPerformanceData } from '../api/propertyApi';
// import { formatMoney, formatPercent, formatDate } from '../utils/formatters';
import SearchBar from '../components/SearchBar';
// import StatCard from '../components/StatCard';
import ComparisonTable from '../components/ComparisonTable';
import './Compare.css';
import { ChartSkeleton, TableSkeleton, } from '../components/Skeleton';

type SupportedSuburb = typeof supportedSuburbs[number];

interface SuburbComparisonResult {
  suburb: SupportedSuburb;
  data: SuburbPerformanceData | null;
  error: string;
}

// Restore supported suburb selections from the URL.
function getInitialSelectedSuburbs(searchParams: URLSearchParams): SupportedSuburb[] {
  const selectedSuburbs: SupportedSuburb[] = [];

  searchParams.getAll('suburb').forEach((value) => {
    const matchingSuburb = supportedSuburbs.find((supportedSuburb) =>
      supportedSuburb.value.toLowerCase() === value.toLowerCase(),
    );

    if (
      matchingSuburb
      && !selectedSuburbs.some((selectedSuburb) => selectedSuburb.value === matchingSuburb.value)
      && selectedSuburbs.length < 3
    ) {
      selectedSuburbs.push(matchingSuburb);
    }
  });

  return selectedSuburbs;
}

function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Store the suburb currently entered into the search field.
  const [suburb, setSuburb] = useState('');

  // Derive the selected suburbs from the URL.
  const selectedSuburbs = useMemo(
    () => getInitialSelectedSuburbs(searchParams),
    [searchParams],
  );

  // Store the market data returned for each selected suburb.
  const [comparisonResults, setComparisonResults] = useState<SuburbComparisonResult[]>([]);

  // Store the loading and error states.
  const [loading, setLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState('');
  const [invalidSearch, setInvalidSearch] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Allow the user to retry failed requests.
  const [retryCount, setRetryCount] = useState(0);

  // Control whether suburb suggestions should be displayed.
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  // Update the URL whenever the comparison selection changes.
  function updateComparisonUrl(suburbs: SupportedSuburb[]) {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('suburb');

    suburbs.forEach((selectedSuburb) => {
      nextSearchParams.append('suburb', selectedSuburb.value);
    });

    setSearchParams(nextSearchParams);
  }

  // Find supported suburbs that match the search input.
  const suggestedSuburbs = suburb.trim() && !suggestionsDismissed
    ? supportedSuburbs.filter((supportedSuburb) => supportedSuburb.label.toLowerCase().includes(suburb.trim().toLowerCase()) || supportedSuburb.value.toLowerCase().includes(suburb.trim().toLowerCase()),).map((supportedSuburb) => supportedSuburb.label)
    : [];

  // Update the search input and allow suggestions to appear again.
  function handleSuburbChange(value: string) {
    setSuburb(value);
    setInvalidSearch(false);
    setSearchError('');
    setSuggestionsDismissed(false);
  }

  // Dismiss suburb suggestions.
  function handleDismissSuggestions() {
    setSuggestionsDismissed(true);
  }

  // Select a suburb from the search suggestions.
  function handleSuggestionSelect(suggestion: string) {
    setSuburb(suggestion);
    setInvalidSearch(false);
    setSearchError('');
    setSuggestionsDismissed(true);
  }

  // Add the searched suburb to the comparison.
  function handleSearch() {
    setInvalidSearch(false);
    setSearchError('');
    setSuggestionsDismissed(true);

    const searchValue = suburb.trim().toLowerCase();

    if (!searchValue) {
      setInvalidSearch(true);
      setSearchError('Enter a suburb to add it to the comparison.');
      return;
    }

    const matchingSuburb = supportedSuburbs.find((supportedSuburb) =>
      supportedSuburb.label.toLowerCase() === searchValue
      || supportedSuburb.value.toLowerCase() === searchValue,
    );

    if (!matchingSuburb) {
      setInvalidSearch(true);
      setSearchError('This suburb is not currently supported.');
      return;
    }

    const alreadySelected = selectedSuburbs.some((selectedSuburb) =>
      selectedSuburb.state === matchingSuburb.state
      && selectedSuburb.value === matchingSuburb.value,
    );

    if (alreadySelected) {
      setInvalidSearch(true);
      setSearchError('This suburb has already been added.');
      return;
    }

    if (selectedSuburbs.length >= 3) {
      setInvalidSearch(true);
      setSearchError('You can compare a maximum of three suburbs.');
      return;
    }

    const updatedSuburbs = [
      ...selectedSuburbs,
      matchingSuburb,
    ];

    updateComparisonUrl(updatedSuburbs);

    setSuburb('');
    setInvalidSearch(false);
    setSearchError('');
    setSuggestionsDismissed(false);
  }

  // Remove a suburb from the comparison.
  function handleRemoveSuburb(suburbToRemove: SupportedSuburb) {
    const updatedSuburbs = selectedSuburbs.filter((selectedSuburb) =>
      selectedSuburb.state !== suburbToRemove.state
      || selectedSuburb.value !== suburbToRemove.value,
    );

    updateComparisonUrl(updatedSuburbs);
  }

  // Fetch market data for all selected suburbs concurrently.
  useEffect(() => {
    const controller = new AbortController();

    async function fetchComparisonData() {
      if (selectedSuburbs.length === 0) {
        setComparisonResults([]);
        setComparisonError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setComparisonError('');
      setComparisonResults([]);

      // Start all requests without waiting for each one individually.
      const results = await Promise.allSettled(
        selectedSuburbs.map((selectedSuburb) =>
          fetchSuburbPerformance(selectedSuburb.value, controller.signal),
        ),
      );

      if (controller.signal.aborted) {
        return;
      }

      // Keep each result associated with its selected suburb.
      const newComparisonResults: SuburbComparisonResult[] = results.map(
        (result, index) => {
          if (result.status === 'fulfilled') {
            return {
              suburb: selectedSuburbs[index],
              data: result.value,
              error: '',
            };
          }

          return {
            suburb: selectedSuburbs[index],
            data: null,
            error: result.reason instanceof Error
              ? result.reason.message
              : 'Unable to load market data for this suburb.',
          };
        },
      );

      setComparisonResults(newComparisonResults);

      // Show an overall error if every request failed.
      if (newComparisonResults.every((result) => result.data === null)) {
        setComparisonError('Unable to load market data for any of the selected suburbs. Check the errors below and try again.',);
      }

      setLoading(false);
    }

    fetchComparisonData().catch((fetchError: unknown) => {
      if (!controller.signal.aborted) {
        setComparisonError(
          fetchError instanceof Error
            ? fetchError.message
            : 'An unexpected error occurred while loading comparison data.',
        );
        setLoading(false);
      }
    });

    // Cancel outstanding requests when the selection changes or the page unmounts.
    return () => {
      controller.abort();
    };
  }, [selectedSuburbs, retryCount]);

  // Retry fetching market data for the currently selected suburbs.
  function handleRetry() {
    setRetryCount((currentCount) => currentCount + 1);
  }

  return (
    <div className="compare-page">
      <header className="compare-heading">
        <p className="compare-eyebrow">
          PROPERTY MARKET EXPLORER
        </p>

        <h1>Compare suburbs</h1>

        <p>
          Compare property prices, rents and rental yields across up to three Australian suburbs.
        </p>
      </header>

      <section className="compare-section">
        <h2>Add a suburb</h2>

        <p className="compare-description">
          Search for a supported suburb to add it to your comparison.
        </p>

        <SearchBar
          suburb={suburb}
          onSuburbChange={handleSuburbChange}
          onSuggestionSelect={handleSuggestionSelect}
          onDismissSuggestions={handleDismissSuggestions}
          onSearch={handleSearch}
          loading={false}
          invalidSearch={invalidSearch}
          validationMessage={searchError}
          suggestedSuburbs={suggestedSuburbs}
        />

        <p className="compare-count" role="status" aria-live="polite">
          {selectedSuburbs.length} of 3 suburbs selected
        </p>
      </section>

      <section className="compare-section">
        <h2>Selected suburbs</h2>

        {selectedSuburbs.length === 0 ? (
          <p className="compare-empty">
            No suburbs selected yet. Search for a suburb above to get started.
          </p>
        ) : (
          <div className="selected-suburbs">
            {selectedSuburbs.map((selectedSuburb) => (
              <article
                className="selected-suburb-card"
                key={`${selectedSuburb.state}-${selectedSuburb.value}`}
              >
                <div className="selected-suburb-details">
                  <h3>{selectedSuburb.label}</h3>

                  <p>
                    {selectedSuburb.state} · Australia
                  </p>
                </div>

                <button
                  type="button"
                  className="remove-suburb-button"
                  onClick={() => handleRemoveSuburb(selectedSuburb)}
                  aria-label={`Remove ${selectedSuburb.label} from comparison`}
                >
                  Remove
                </button>
              </article>
            ))}
          </div>
        )}

        {selectedSuburbs.length === 3 && (
          <p className="compare-limit-message" role="status">
            You've reached the maximum of three suburbs. Remove a suburb before adding another.
          </p>
        )}
      </section>


      {selectedSuburbs.length > 0 && (
        <section
          className="compare-section"
          aria-busy={loading}
        >
          <h2>Market comparison</h2>

          <p className="compare-description">
            Compare the latest available market statistics for your selected suburbs.
          </p>

          {loading && (
            <div className="comparison-loading">
              <p className="compare-loading" role="status" aria-live="polite">
                Loading market data for {selectedSuburbs.length} {selectedSuburbs.length === 1 ? 'suburb' : 'suburbs'}...
              </p>

              <section className="comparison-chart-section">
                <h3>Compare market metrics</h3>
                <ChartSkeleton />
              </section>

              <section className="comparison-table-section">
                <h3>Market data comparison</h3>
                <TableSkeleton />
              </section>
            </div>
          )}

          {!loading && comparisonError && (
            <div className="compare-error-panel" role="alert">
              <p>{comparisonError}</p>

              <ul className="comparison-error-list">
                {comparisonResults.map((result) => (
                  <li key={`${result.suburb.state}-${result.suburb.value}`}>
                    <strong>{result.suburb.label}:</strong> {result.error}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="retry-button"
                onClick={handleRetry}
              >
                Try again
              </button>
            </div>
          )}

          {!loading && comparisonResults.length > 0 && (
            <ComparisonTable results={comparisonResults} />
          )}
        </section>
      )}

      <p className="compare-disclaimer">
        Figures are supplied by the market data provider. Median values and rental yields are indicative market statistics, not valuations or investment advice.
      </p>
    </div>
  );
}

export default Compare;