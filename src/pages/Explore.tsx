import { useState } from 'react';
import './Explore.css';

function Explore() {
  const [suburb, setSuburb] = useState('');
  const [submittedSuburb, setSubmittedSuburb] = useState('');
  const [invalidSearch, setInvalidSearch] = useState(false);

  function isValidSearchBoxInput(input) {
    return input.trim() !== '';
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
          placeholder="e.g., Merrylands, NSW 2160"
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
          onClick={() => {
            if (isValidSearchBoxInput(suburb)) {
              setSubmittedSuburb(suburb.trim());
              setInvalidSearch(false);
            }
            else {
              setSubmittedSuburb('');
              setInvalidSearch(true);
            }
          }}
        >
          Submit
        </button>
      </section>

      {submittedSuburb !== '' && (
        <p>
          Search results for {submittedSuburb}
        </p>
      )}

      <section className="metric-cards">
        <div className="metric-card">
          <h2>Median sale price</h2>
        </div>

        <div className="metric-card">
          <h2>Rental yield</h2>
        </div>
      </section>
    </div>
  );
}

export default Explore;