import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supportedSuburbs } from '../data/suburbs.ts';
import { fetchSuburbPerformance, type MarketDataPoint, type SuburbPerformanceData, } from '../api/propertyApi';
import './Suburb.css';

// Store the result of fetching market data.
interface SuburbResult {
  suburb: string;
  data: SuburbPerformanceData | null;
  error: string;
}

type PropertyType = 'house' | 'unit' | 'all';

// Format values as Australian dollars.
function formatMoney(value: number | null | undefined,): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0, }).format(value);
}

// Format decimal growth and yield values as percentages.
function formatPercent(value: number | null | undefined,): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 'N/A';
  }

  return `${(value * 100).toFixed(2)}%`;
}

// Format a date for display.
function formatDate(value: string | undefined,): string {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', });
}

// Keep positive, plausible sale prices.
// The minimum is based on the current median for that property type.
function getValidPriceHistory(points: MarketDataPoint[] | null | undefined, currentMedian: number | null | undefined,): MarketDataPoint[] {
  if (!Array.isArray(points)) {
    return [];
  }

  const minimumPlausiblePrice = typeof currentMedian === 'number' && Number.isFinite(currentMedian) && currentMedian > 0 ? currentMedian * 0.1 : 0;

  return points
    .filter((point) => {
      return (typeof point.date === 'string' && !Number.isNaN(Date.parse(point.date)) && typeof point.value === 'number' && Number.isFinite(point.value) && point.value > minimumPlausiblePrice);
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Convert historical observations into an SVG path.
// The returned coordinates are relative to the chart's plot area.
function buildPath(
  points: MarketDataPoint[],
  minDate: number,
  maxDate: number,
  minPrice: number,
  maxPrice: number,
  width: number,
  height: number,
): string {
  if (points.length === 0) {
    return '';
  }

  const dateRange = maxDate - minDate || 1;
  const priceRange = maxPrice - minPrice || 1;

  return points
    .map((point, index) => {
      const x = ((new Date(point.date).getTime() - minDate) / dateRange) * width;
      const y = height - ((point.value - minPrice) / priceRange) * height;

      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}

// Format chart-axis prices in a compact form.
function formatAxisPrice(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}m`;
  }

  return `$${Math.round(value / 1_000)}k`;
}

function Suburb() {
  const { state, suburb } = useParams();

  // Find the matching suburb, if the URL parameters are valid.
  const matchingSuburb = supportedSuburbs.find((supportedSuburb) => supportedSuburb.state.toLowerCase() === state?.toLowerCase() && supportedSuburb.value.toLowerCase().replaceAll(' ', '-') === suburb?.toLowerCase(),);

  // Store the most recently completed request.
  const [result, setResult] = useState<SuburbResult | null>(null);

  // Store the selected property type.
  const [propertyType, setPropertyType] = useState<PropertyType>('all');

  // Fetch performance data whenever the selected suburb changes.
  useEffect(() => {
    if (!matchingSuburb) {
      return;
    }

    let cancelled = false;
    const selectedSuburb = matchingSuburb.value;

    fetchSuburbPerformance(selectedSuburb)
      .then((data) => {
        if (!cancelled) {
          setResult({ suburb: selectedSuburb, data, error: '', });
        }
      })
      .catch((fetchError: unknown) => {
        if (!cancelled) {
          setResult({ suburb: selectedSuburb, data: null, error: fetchError instanceof Error ? fetchError.message : 'Unable to load suburb performance data.', });
        }
      });

    // Prevent an outdated request from updating the page.
    return () => {
      cancelled = true;
    };
  }, [matchingSuburb]);

  // Only use a result that belongs to the currently selected suburb.
  const currentResult = result?.suburb === matchingSuburb?.value ? result : null;
  const performanceData = currentResult?.data ?? null;
  const error = currentResult?.error ?? '';
  const loading = matchingSuburb !== undefined && currentResult === null;

  // Display an error for missing or unsupported suburbs.
  if (!state || !suburb || !matchingSuburb) {
    return <h1>Suburb not found</h1>;
  }

  const medianPrice = performanceData?.median_sale_price;
  const medianRent = performanceData?.median_rent;
  const yields = performanceData?.yield_pct;
  const daysOnMarket = performanceData?.days_on_market;
  const growth = performanceData?.price_growth;
  const housePriceHistory = getValidPriceHistory(performanceData?.median_sale_price_series?.house, medianPrice?.house,);
  const unitPriceHistory = getValidPriceHistory(performanceData?.median_sale_price_series?.unit, medianPrice?.unit,);
  const originalHouseCount = performanceData?.median_sale_price_series?.house?.length ?? 0;
  const originalUnitCount = performanceData?.median_sale_price_series?.unit?.length ?? 0;
  const excludedHouseCount = originalHouseCount - housePriceHistory.length;
  const excludedUnitCount = originalUnitCount - unitPriceHistory.length;

  // Determine which property types should be visible.
  const showHouses = propertyType === 'house' || propertyType === 'all';
  const showUnits = propertyType === 'unit' || propertyType === 'all';

  // Only include selected property types when building the chart.
  const displayedHouseHistory = showHouses ? housePriceHistory : [];
  const displayedUnitHistory = showUnits ? unitPriceHistory : [];

  // Use only displayed observations to calculate the chart scale.
  const chartPoints = [
    ...displayedHouseHistory,
    ...displayedUnitHistory,
  ];

  const chartWidth = 820;
  const chartHeight = 300;
  const leftPadding = 72;
  const rightPadding = 24;
  const topPadding = 20;
  const bottomPadding = 42;
  const plotWidth = chartWidth - leftPadding - rightPadding;
  const plotHeight = chartHeight - topPadding - bottomPadding;

  const timestamps = chartPoints.map((point) =>
    new Date(point.date).getTime(),
  );

  const prices = chartPoints.map((point) => point.value);
  const minDate = timestamps.length > 0 ? Math.min(...timestamps) : 0;
  const maxDate = timestamps.length > 0 ? Math.max(...timestamps) : 1;

  const rawMinPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const rawMaxPrice = prices.length > 0 ? Math.max(...prices) : 1;

  // Give the chart some vertical space if every observation has the same price.
  const pricePadding = rawMinPrice === rawMaxPrice ? Math.max(rawMaxPrice * 0.1, 1_000) : 0;

  const minPrice = Math.max(0, rawMinPrice - pricePadding);
  const maxPrice = rawMaxPrice + pricePadding;

  const housePath = buildPath(
    displayedHouseHistory,
    minDate,
    maxDate,
    minPrice,
    maxPrice,
    plotWidth,
    plotHeight,
  );

  const unitPath = buildPath(
    displayedUnitHistory,
    minDate,
    maxDate,
    minPrice,
    maxPrice,
    plotWidth,
    plotHeight,
  );

  const hasChartData = chartPoints.length > 0;

  // Report excluded observations only for the selected property types.
  const excludedObservations: string[] = [];

  if (showHouses && excludedHouseCount > 0) {
    excludedObservations.push(`houses: ${excludedHouseCount}`);
  }

  if (showUnits && excludedUnitCount > 0) {
    excludedObservations.push(`units: ${excludedUnitCount}`);
  }

  const growthPeriods = [
    { label: '1 year', key: '1yr' as const },
    { label: '3 years', key: '3yr' as const },
    { label: '5 years', key: '5yr' as const },
    { label: '10 years', key: '10yr' as const },
  ];

  const chartDescription =
    propertyType === 'all' ? 'Historical median sale prices for houses and units' : `Historical median sale prices for ${propertyType === 'house' ? 'houses' : 'units'}`;

  return (
    <div className="suburb-page">
      <header className="suburb-heading">
        <p className="suburb-eyebrow">
          PROPERTY MARKET EXPLORER
        </p>

        <h1>{matchingSuburb.value}</h1>

        <p>{matchingSuburb.state} · Australia</p>

        {performanceData && (
          <p className="data-date">
            Market data as of{' '} {formatDate(medianPrice?.as_of ?? yields?.as_of ?? growth?.as_of,)}
          </p>
        )}
      </header>

      <fieldset className="property-type-selector">
        <legend>Property type</legend>

        <label>
          <input
            type="radio"
            name="propertyType"
            value="house"
            checked={propertyType === 'house'}
            onChange={() => setPropertyType('house')}
          />
          House
        </label>

        <label>
          <input
            type="radio"
            name="propertyType"
            value="unit"
            checked={propertyType === 'unit'}
            onChange={() => setPropertyType('unit')}
          />
          Unit
        </label>

        <label>
          <input
            type="radio"
            name="propertyType"
            value="all"
            checked={propertyType === 'all'}
            onChange={() => setPropertyType('all')}
          />
          All
        </label>
      </fieldset>

      {loading && (
        <p className="status-message" role="status">
          Loading suburb market data…
        </p>
      )}

      {!loading && error && (
        <div className="error-message" role="alert">
          <h2>Unable to load market data</h2>

          <p>{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && performanceData && (
        <>
          <section className="suburb-section">
            <h2>Market overview</h2>

            <p className="section-description">
              A snapshot of prices, rents and market conditions for the selected property type.
            </p>

            <div className="metric-grid">
              {showHouses && (
                <article className="metric-card">
                  <h3>Median house price</h3>
                  <p className="metric-value">
                    {formatMoney(medianPrice?.house)}
                  </p>
                  <p className="metric-detail">Houses</p>
                </article>
              )}

              {showUnits && (
                <article className="metric-card">
                  <h3>Median unit price</h3>
                  <p className="metric-value">
                    {formatMoney(medianPrice?.unit)}
                  </p>
                  <p className="metric-detail">Units</p>
                </article>
              )}

              {showHouses && (
                <article className="metric-card">
                  <h3>Weekly house rent</h3>
                  <p className="metric-value">
                    {formatMoney(medianRent?.house)}
                  </p>
                  <p className="metric-detail">Per week</p>
                </article>
              )}

              {showUnits && (
                <article className="metric-card">
                  <h3>Weekly unit rent</h3>
                  <p className="metric-value">
                    {formatMoney(medianRent?.unit)}
                  </p>
                  <p className="metric-detail">Per week</p>
                </article>
              )}

              {showHouses && (
                <article className="metric-card">
                  <h3>House rental yield</h3>
                  <p className="metric-value">
                    {formatPercent(yields?.house)}
                  </p>
                  <p className="metric-detail">Gross yield</p>
                </article>
              )}

              {showUnits && (
                <article className="metric-card">
                  <h3>Unit rental yield</h3>
                  <p className="metric-value">
                    {formatPercent(yields?.unit)}
                  </p>
                  <p className="metric-detail">Gross yield</p>
                </article>
              )}

              {showHouses && (
                <article className="metric-card">
                  <h3>House days on market</h3>
                  <p className="metric-value">
                    {daysOnMarket?.house == null ? 'N/A' : `${daysOnMarket.house} days`}
                  </p>
                  <p className="metric-detail">Houses</p>
                </article>
              )}

              {showUnits && (
                <article className="metric-card">
                  <h3>Unit days on market</h3>
                  <p className="metric-value">
                    {daysOnMarket?.unit == null ? 'N/A' : `${daysOnMarket.unit} days`}
                  </p>
                  <p className="metric-detail">Units</p>
                </article>
              )}
            </div>
          </section>

          <section className="suburb-section">
            <h2>Price growth</h2>

            <p className="section-description">
              Historical price growth reported by the market data provider. Values are displayed as percentages.
            </p>

            <div className="table-wrapper">
              <table className="growth-table">
                <thead>
                  <tr>
                    <th scope="col">Period</th>
                    {showHouses && (
                      <th scope="col">Houses</th>
                    )}
                    {showUnits && (
                      <th scope="col">Units</th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {growthPeriods.map((period) => (
                    <tr key={period.key}>
                      <th scope="row">{period.label}</th>

                      {showHouses && (
                        <td>{formatPercent(growth?.house?.[period.key],)}</td>
                      )}

                      {showUnits && (
                        <td>{formatPercent(growth?.unit?.[period.key],)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="suburb-section">
            <h2>Historical sale prices</h2>

            <p className="section-description">
              Median sale-price observations over time for the selected property type.
            </p>

            {hasChartData ? (
              <div className="chart-card">
                <div className="chart-legend">
                  {showHouses && (
                    <span>
                      <span className="legend-dot house-dot" aria-hidden="true" />
                      Houses
                    </span>
                  )}

                  {showUnits && (
                    <span>
                      <span className="legend-dot unit-dot" aria-hidden="true" />
                      Units
                    </span>
                  )}
                </div>

                <div className="chart-scroll">
                  <svg
                    className="price-chart"
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    role="img"
                    aria-label={chartDescription}
                  >
                    {[0, 1, 2, 3, 4].map((step) => {
                      const fraction = step / 4;
                      const y = topPadding + fraction * plotHeight;
                      const price = maxPrice - fraction * (maxPrice - minPrice);

                      return (
                        <g key={step}>
                          <line
                            x1={leftPadding}
                            y1={y}
                            x2={chartWidth - rightPadding}
                            y2={y}
                            className="chart-grid-line"
                          />

                          <text
                            x={leftPadding - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="chart-axis-label"
                          >
                            {formatAxisPrice(price)}
                          </text>
                        </g>
                      );
                    })}

                    {[0, 0.5, 1].map((fraction) => {
                      const timestamp = minDate + fraction * (maxDate - minDate);
                      const year = timestamps.length > 0 ? new Date(timestamp).getFullYear() : '—';
                      const x = leftPadding + fraction * plotWidth;

                      return (
                        <text
                          key={fraction}
                          x={x}
                          y={chartHeight - 12}
                          textAnchor="middle"
                          className="chart-axis-label"
                        >
                          {year}
                        </text>
                      );
                    })}

                    <g
                      transform={`translate(${leftPadding}, ${topPadding})`}
                    >
                      {showHouses && (
                        <path
                          d={housePath}
                          className="house-price-line"
                        />
                      )}

                      {showUnits && (
                        <path
                          d={unitPath}
                          className="unit-price-line"
                        />
                      )}
                    </g>
                  </svg>
                </div>

                {excludedObservations.length > 0 && (
                  <p className="data-quality-note">
                    Data quality note: excluded {excludedObservations.join('; ')} historical observations because their dates or values were invalid, or their values were at or below 10% of the latest median sale price where available. This is a preliminary filter, not confirmation that the remaining data is accurate.
                  </p>
                )}
              </div>
            ) : (
              <p className="empty-message">
                Historical sale-price data is not available for{' '}
                {propertyType === 'all' ? 'houses or units' : propertyType === 'house' ? 'houses' : 'units'}{' '}
                in this suburb.
              </p>
            )}
          </section>

          <p className="disclaimer">
            Figures are supplied by the market data provider. Median values and historical observations are indicative market statistics, not valuations or investment advice.
          </p>
        </>
      )}
    </div>
  );
}

export default Suburb;