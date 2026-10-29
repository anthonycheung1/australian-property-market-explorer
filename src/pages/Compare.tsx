import { useState } from 'react';
import { supportedSuburbs } from '../data/suburbs.ts';
import SearchBar from '../components/SearchBar';
import './Compare.css';

type SupportedSuburb = typeof supportedSuburbs[number];

function Compare() {
  // Store the suburb currently entered into the search field.
  const [suburb, setSuburb] = useState('');

  // Store the suburbs selected for comparison.
  const [selectedSuburbs, setSelectedSuburbs] = useState<SupportedSuburb[]>([]);

  // Store the current search validation state.
  const [invalidSearch, setInvalidSearch] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Control whether suburb suggestions should be displayed.
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);

  // Find supported suburbs that match the search input.
  const suggestedSuburbs = suburb.trim() && !suggestionsDismissed
    ? supportedSuburbs
      .filter((supportedSuburb) =>
        supportedSuburb.label.toLowerCase().includes(suburb.trim().toLowerCase())
        || supportedSuburb.value.toLowerCase().includes(suburb.trim().toLowerCase()),
      )
      .map((supportedSuburb) => supportedSuburb.label)
    : [];

  // Update the search input and allow suggestions to appear again.
  function handleSuburbChange(value: string) {
    setSuburb(value);
    setInvalidSearch(false);
    setSearchError('');
    setSuggestionsDismissed(false);
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

    setSelectedSuburbs((currentSuburbs) => [
      ...currentSuburbs,
      matchingSuburb,
    ]);

    setSuburb('');
    setInvalidSearch(false);
    setSearchError('');
    setSuggestionsDismissed(false);
  }

  // Remove a suburb from the comparison.
  function handleRemoveSuburb(suburbToRemove: SupportedSuburb) {
    setSelectedSuburbs((currentSuburbs) =>
      currentSuburbs.filter((selectedSuburb) =>
        selectedSuburb.state !== suburbToRemove.state
        || selectedSuburb.value !== suburbToRemove.value,
      ),
    );
  }

  return (
    <div className="compare-page">
      <header className="compare-heading">
        <p className="compare-eyebrow">
          PROPERTY MARKET EXPLORER
        </p>

        <h1>Compare suburbs</h1>

        <p>
          Select up to three Australian suburbs to compare their property markets.
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
          onDismissSuggestions={() => setSuggestionsDismissed(true)}
          onSearch={handleSearch}
          loading={false}
          invalidSearch={invalidSearch}
          suggestedSuburbs={suggestedSuburbs}
        />

        {searchError && (
          <p className="compare-error" role="alert">
            {searchError}
          </p>
        )}

        <p className="compare-count">
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
          <p className="compare-limit-message">
            You've reached the maximum of three suburbs. Remove a suburb before adding another.
          </p>
        )}
      </section>
    </div>
  );
}

export default Compare;