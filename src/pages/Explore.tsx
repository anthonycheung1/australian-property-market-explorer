import { useState } from 'react';
import './Explore.css';
import {
  fetchRentalYield,
  type RentalYieldData,
} from '../api/propertyApi';
import SearchBar from '../components/SearchBar';

function Explore() {
  // Suburbs that can be searched
  const supportedSuburbs = [
    {
      label: 'Bondi, NSW',
      value: 'Bondi',
    },
    {
      label: 'Belmont North, NSW',
      value: 'Belmont North',
    },
    {
      label: 'Fortitude Valley, QLD',
      value: 'Fortitude Valley',
    },
    {
      label: 'Subiaco, WA',
      value: 'Subiaco',
    },
    {
      label: 'Unley, SA',
      value: 'Unley',
    },
    {
      label: 'Sandy Bay, TAS',
      value: 'Sandy Bay',
    },
    {
      label: 'Kambah, ACT',
      value: 'Kambah',
    },
    {
      label: 'Nightcliff, NT',
      value: 'Nightcliff',
    },
  ];

  // Search state
  const [suburb, setSuburb] = useState('');
  const [submittedSuburb, setSubmittedSuburb] = useState('');
  const [invalidSearch, setInvalidSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
    // Clear suggestions when the user submits a search
    setSuggestions([]);

    if (!isValidSearchBoxInput(suburb)) {
      setSubmittedSuburb('');
      setInvalidSearch(true);
      setYieldData(null);
      setApiError('');
      return;
    }

    const searchSuburb = supportedSuburbs.find(
      (supportedSuburb) =>
        supportedSuburb.label.trim().toLowerCase() ===
        suburb.trim().toLowerCase()
    );

    // Check whether a matching suburb was found before starting the API request.
    if (searchSuburb) {
      setInvalidSearch(false);
      setSubmittedSuburb(searchSuburb.label);
      setLoading(true);
      setApiError('');
      setYieldData(null);

      try {
        const result = await fetchRentalYield(searchSuburb.value);
        setYieldData(result);
      } catch (error) {
        console.error('Error fetching rental yield:', error);

        setApiError(
          'Unable to retrieve rental yield data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    } else {
      setInvalidSearch(false);
      setSubmittedSuburb('');
      setLoading(false);
      setApiError('This is not a supported suburb.');
      setYieldData(null);
    }
  }

  // Handle changes to the search input
  function onSuburbChange(value: string) {
    setSuburb(value);

    // Clear existing error messages
    setApiError('');

    // Find suburbs whose labels contain the user's input
    const suggestedSuburbs =
      value.trim().length === 0
        ? []
        : supportedSuburbs.filter((supportedSuburb) => {
            return supportedSuburb.label
              .toLowerCase()
              .includes(value.trim().toLowerCase());
          });

    // Store the matching suburb labels as suggestions
    setSuggestions(
      suggestedSuburbs.map((supportedSuburb) => {
        return supportedSuburb.label;
      })
    );

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