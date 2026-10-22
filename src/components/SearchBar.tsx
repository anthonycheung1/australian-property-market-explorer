
import './SearchBar.css';

interface SearchBarProps {
  suburb: string; // This stores exactly what the user has typed into the input.
  onSuburbChange: (value: string) => void;
  onSuggestionSelect: (value: string) => void;
  onSearch: () => void;
  loading: boolean;
  invalidSearch: boolean;
  suggestedSuburbs: string[]; // This stores (potentially several) matches
}

function SearchBar({
  suburb,
  onSuburbChange,
  onSuggestionSelect,
  onSearch,
  loading,
  invalidSearch,
  suggestedSuburbs
}: SearchBarProps) {
  return (
    <form
      className="search-section"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <label htmlFor="suburb-search-textbox">
        Suburb
      </label>

      <input
        className="search-box"
        id="suburb-search-textbox"
        name="suburb-or-postcode"
        type="text"
        placeholder="e.g., Belmont North"
        value={suburb}
        onChange={(event) =>
          onSuburbChange(event.currentTarget.value)
        }
        aria-invalid={invalidSearch}
        aria-describedby={
          invalidSearch ? 'suburb-search-error' : undefined
        }
      />

      {suggestedSuburbs.length > 0 && (
        <ul id="suburb-suggestions">
          {suggestedSuburbs.map((suburb) => {
            return (
              <li key={suburb}>
                <button
                  type="button"
                  onClick={() => onSuggestionSelect(suburb)}
                >
                  {suburb}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {invalidSearch && (
        <p id="suburb-search-error" role="alert">
          Please enter a suburb.
        </p>
      )}

      <button
        className="search-button"
        type="submit"
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
          {/* <li>St Kilda <span>(VIC)</span></li> */}
          <li>Fortitude Valley <span>(QLD)</span></li>
          <li>Subiaco <span>(WA)</span></li>
          <li>Unley <span>(SA)</span></li>
          <li>Sandy Bay <span>(TAS)</span></li>
          <li>Kambah <span>(ACT)</span></li>
          <li>Nightcliff <span>(NT)</span></li>
        </ul>
      </div>
    </form>
  );
}

export default SearchBar;