import { useId, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import './SearchBar.css';

interface SearchBarProps {
  suburb: string; // This stores exactly what the user has typed into the input.
  onSuburbChange: (value: string) => void;
  onSuggestionSelect: (suburb: string) => void;
  onDismissSuggestions: () => void;
  onSearch: () => void;
  loading: boolean;
  invalidSearch: boolean;
  validationMessage?: string;
  suggestedSuburbs: string[]; // This stores (potentially several) matches
}

function SearchBar({
  suburb,
  onSuburbChange,
  onSuggestionSelect,
  onDismissSuggestions,
  onSearch,
  loading,
  invalidSearch,
  validationMessage = 'Please enter a suburb.',
  suggestedSuburbs,
}: SearchBarProps) {
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  // Generate unique IDs for the input and suggestion list.
  const searchId = useId();
  const inputId = `${searchId}-suburb-search`;
  const suggestionsId = `${searchId}-suburb-suggestions`;
  const errorId = `${searchId}-suburb-error`;

  const suggestionsVisible = suggestedSuburbs.length > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' && suggestionsVisible) {
      event.preventDefault();

      setActiveSuggestionIndex((currentIndex) =>
        currentIndex >= suggestedSuburbs.length - 1
          ? 0
          : currentIndex + 1
      );
    }

    if (event.key === 'ArrowUp' && suggestionsVisible) {
      event.preventDefault();

      setActiveSuggestionIndex((currentIndex) =>
        currentIndex <= 0
          ? suggestedSuburbs.length - 1
          : currentIndex - 1
      );
    }

    if (
      event.key === 'Enter' &&
      activeSuggestionIndex >= 0 &&
      activeSuggestionIndex < suggestedSuburbs.length
    ) {
      event.preventDefault();

      onSuggestionSelect(suggestedSuburbs[activeSuggestionIndex]);
      setActiveSuggestionIndex(-1);
    }

    if (event.key === 'Escape' && suggestionsVisible) {
      event.preventDefault();

      onDismissSuggestions();
      setActiveSuggestionIndex(-1);
    }
  }

  function handleInputChange(value: string) {
    setActiveSuggestionIndex(-1);
    onSuburbChange(value);
  }

  function handleSuggestionClick(suggestion: string) {
    setActiveSuggestionIndex(-1);
    onSuggestionSelect(suggestion);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Prevent another search from being submitted while a search is in progress.
    if (loading) {
      return;
    }

    setActiveSuggestionIndex(-1);
    onSearch();
  }

  return (
    <section className="search-section">
      <form onSubmit={handleSubmit}>
        <label htmlFor={inputId}>Suburb</label>

        <input
          id={inputId}
          name="suburb"
          className="search-box"
          type="text"
          value={suburb}
          onChange={(event) => handleInputChange(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., Belmont North"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={suggestionsVisible}
          aria-controls={suggestionsVisible ? suggestionsId : undefined}
          aria-activedescendant={
            activeSuggestionIndex >= 0 &&
              activeSuggestionIndex < suggestedSuburbs.length
              ? `${suggestionsId}-${activeSuggestionIndex}`
              : undefined
          }
          aria-invalid={invalidSearch}
          aria-describedby={invalidSearch ? errorId : undefined}
        />

        {suggestionsVisible && (
          <div
            className="suggestions-list"
            id={suggestionsId}
            role="listbox"
            aria-label="Suburb suggestions"
          >
            {suggestedSuburbs.map((suggestion, index) => (
              <div
                key={suggestion}
                id={`${suggestionsId}-${index}`}
                className={`suggestion-option ${index === activeSuggestionIndex ? 'active' : ''}`}
                role="option"
                aria-selected={index === activeSuggestionIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {invalidSearch && (
          <p className="validation-error" id={errorId} role="alert">
            {validationMessage}
          </p>
        )}

        <button
          className="search-button"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="availability-note">
        <p className="availability-heading">Currently supported suburbs</p>

        <ul className="availability-list">
          <li>Bondi <span>(NSW)</span></li>
          <li>Belmont North <span>(NSW)</span></li>
          {/* <li>St Kilda <span>(VIC)</span></li> */}
          <li>Fortitude Valley <span>(QLD)</span></li>
          <li>Subiaco <span>(WA)</span></li>
          <li>Unley <span>(SA)</span></li>
          <li>Sandy Bay <span>(TAS)</span></li>
          <li>Kambah <span>(ACT)</span></li>
          <li>Nightcliff <span>(NT)</span></li>
        </ul>
      </div>
    </section>
  );
}

export default SearchBar;