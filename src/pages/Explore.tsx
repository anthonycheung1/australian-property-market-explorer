
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
      value: 'Bondi'
    },
    {
      label: 'Belmont North, NSW',
      value: 'Belmont North'
    },
    /*
    {
      label: 'St Kilda, VIC',
      value: 'St Kilda'
    },
    */
    {
      label: 'Fortitude Valley, QLD',
      value: 'Fortitude Valley'
    },
    {
      label: 'Subiaco, WA',
      value: 'Subiaco'
    },
    {
      label: 'Unley, SA',
      value: 'Unley'
    },
    {
      label: 'Sandy Bay, TAS',
      value: 'Sandy Bay'
    },
    {
      label: 'Kambah, ACT',
      value: 'Kambah'
    },
    {
      label: 'Nightcliff, NT',
      value: 'Nightcliff'
    },
  ];

  // Search state
  const [suburb, setSuburb] = useState('');
  const [submittedSuburb, setSubmittedSuburb] = useState('');
  const [invalidSearch, setInvalidSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]); // An array of strings.

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

    const searchSuburb = supportedSuburbs.find(supportedSuburb => supportedSuburb.label.trim().toLowerCase() === suburb.trim().toLowerCase());
    // Test whether .find() found a matching object (if it didn't, searchSuburb will be undefined), and
    // check whether a matching suburb was found before starting the API request.
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
    }
    else {
      setInvalidSearch(false);
      setSubmittedSuburb('');
      setLoading(false);
      setApiError('This is not a supported suburb.');
      setYieldData(null);
    }
  }

  return (
    <div className="explore-page">
      {/* Suburb search */}
      <SearchBar
        suburb={suburb}
        onSuburbChange={(value) => {
          setSuburb(value);
          // Clear existing error messages, if any
          setApiError('');

          // Calculate matching suburbs here
          const suggestedSuburbs = value.trim().length === 0 ? [] : supportedSuburbs.filter((suburb) => {
            // Return a condition that checks whether name contains the user's input.
            return suburb.label.toLowerCase().includes(value.trim().toLowerCase());
          });
          // Set suggestions equal to each of the suburbs in suggestedSuburbs
          setSuggestions(
            suggestedSuburbs.map((suburb) => {
              return suburb.label;
            })
          );

          if (isValidSearchBoxInput(value)) {
            setInvalidSearch(false);
          }
        }}
        onSuggestionSelect={(value) => {
          setSuburb(value);
          setSuggestions([]);
          setInvalidSearch(false);
          setApiError('');
        }}
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