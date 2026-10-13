
import './Explore.css';

function Explore() {
  return (
    <>
      <div className="explore-page">

        <h1>Explore Australian Property Markets</h1>
        <p>Explore Australian property markets by suburb.</p>

        <section className="search-section">
          <label htmlFor="suburb-search-textbox">
            Suburb/Postcode
          </label>
          <input className="search-box" id="suburb-search-textbox" name="suburb-or-postcode" type="text" placeholder="e.g., Merrylands, NSW 2160" />
        </section>

        <section className="metric-cards">
          <div className="metric-card">
            <h2>Median sale price</h2>
          </div>

          <div className="metric-card">
            <h2>Rental yield</h2>
          </div>
        </section>
      </div>
    </>
  );
}

export default Explore;
