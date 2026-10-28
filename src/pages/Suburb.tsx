import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supportedSuburbs } from '../data/suburbs.ts';
import { fetchSuburbPerformance, type MarketDataPoint, type SuburbPerformanceData, } from '../api/propertyApi';
import { formatMoney, formatPercent, formatDate } from '../utils/formatters';
import StatCard from '../components/StatCard';
import PriceChart, { type PriceChartPoint, } from '../components/PriceChart';
import RentChart, { type RentChartPoint, } from '../components/RentChart';
import './Suburb.css';

// Store the result of fetching market data.
interface SuburbResult {
  suburb: string;
  data: SuburbPerformanceData | null;
  error: string;
}

type PropertyType = 'house' | 'unit' | 'all';
type HistoricalMetric = 'salePrice' | 'rentalPrice';

const historicalMetrics = [
  {
    value: 'salePrice',
    label: 'Sale prices',
    heading: 'Historical sale prices',
    description: 'Median sale-price observations over time for the selected property type.',
  },
  {
    value: 'rentalPrice',
    label: 'Rental prices',
    heading: 'Historical rental prices',
    description: 'Historical rental-price observations over time for the selected property type.',
  },
] as const;

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

function formatSalesCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) {
    return 'N/A';
  }

  return value.toLocaleString('en-AU', {
    maximumFractionDigits: 1,
  });
}

function buildPriceChartData(houseHistory: MarketDataPoint[], unitHistory: MarketDataPoint[],): PriceChartPoint[] {
  const pointsByDate = new Map<string, PriceChartPoint>();

  for (const point of houseHistory) {
    if (point.date && Number.isFinite(point.value) && point.value > 0) {
      const existing = pointsByDate.get(point.date);

      pointsByDate.set(point.date, {
        ...existing,
        date: point.date,
        housePrice: point.value,
      });
    }
  }

  for (const point of unitHistory) {
    if (point.date && Number.isFinite(point.value) && point.value > 0) {
      const existing = pointsByDate.get(point.date);

      pointsByDate.set(point.date, {
        ...existing,
        date: point.date,
        unitPrice: point.value,
      });
    }
  }

  return Array.from(pointsByDate.values()).sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime(),
  );
}

function buildRentChartData(houseHistory: MarketDataPoint[], unitHistory: MarketDataPoint[],): RentChartPoint[] {
  const pointsByDate = new Map<string, RentChartPoint>();

  houseHistory.forEach((point) => {
    const existing = pointsByDate.get(point.date) ?? {
      date: point.date,
    };

    existing.houseRent = point.value;
    pointsByDate.set(point.date, existing);
  });

  unitHistory.forEach((point) => {
    const existing = pointsByDate.get(point.date) ?? {
      date: point.date,
    };

    existing.unitRent = point.value;
    pointsByDate.set(point.date, existing);
  });

  return Array.from(pointsByDate.values()).sort(
    (a, b) => a.date.localeCompare(b.date),
  );
}

function Suburb() {
  const { state, suburb } = useParams();

  // Find the matching suburb, if the URL parameters are valid.
  const matchingSuburb = supportedSuburbs.find((supportedSuburb) => supportedSuburb.state.toLowerCase() === state?.toLowerCase() && supportedSuburb.value.toLowerCase().replaceAll(' ', '-') === suburb?.toLowerCase(),);

  // Store the most recently completed request.
  const [result, setResult] = useState<SuburbResult | null>(null);

  // Store the selected property type.
  const [propertyType, setPropertyType] = useState<PropertyType>('all');

  const [historicalMetric, setHistoricalMetric] = useState<HistoricalMetric>('salePrice');

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
  const transactionVolume = performanceData?.transaction_volume;
  const houseSales = transactionVolume?.house?.value;
  const unitSales = transactionVolume?.unit?.value;
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

  // Prepare the historical observations for Recharts.
  const priceChartData = buildPriceChartData(displayedHouseHistory, displayedUnitHistory,);
  const rentHistory = performanceData?.median_rent_series;
  const houseRentHistory = rentHistory?.house ?? [];
  const unitRentHistory = rentHistory?.unit ?? [];
  const rentChartData = buildRentChartData(houseRentHistory, unitRentHistory,);

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
          <div className="historical-metric-selector">
            <label htmlFor="historicalMetric">
              Historical metric
            </label>

            <select
              id="historicalMetric"
              value={historicalMetric}
              onChange={(event) => setHistoricalMetric(event.target.value as HistoricalMetric)}
            >
              {historicalMetrics.map((metric) => (
                <option
                  key={metric.value}
                  value={metric.value}
                >
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          <section className="suburb-section">
            <h2>Market overview</h2>

            <p className="section-description">
              A snapshot of prices, rents and market conditions for the selected property type.
            </p>

            <div className="metric-grid">
              {showHouses && (
                <StatCard
                  title="Median house price"
                  value={formatMoney(medianPrice?.house)}
                  subtitle="Houses"
                />
              )}

              {showUnits && (
                <StatCard
                  title="Median unit price"
                  value={formatMoney(medianPrice?.unit)}
                  subtitle="Units"
                />
              )}

              {showHouses && (
                <StatCard
                  title="Weekly house rent"
                  value={formatMoney(medianRent?.house)}
                  subtitle="Per week"
                />
              )}

              {showUnits && (
                <StatCard
                  title="Weekly unit rent"
                  value={formatMoney(medianRent?.unit)}
                  subtitle="Per week"
                />
              )}

              {showHouses && (
                <StatCard
                  title="House rental yield"
                  value={formatPercent(yields?.house)}
                  subtitle="Gross yield"
                />
              )}

              {showUnits && (
                <StatCard
                  title="Unit rental yield"
                  value={formatPercent(yields?.unit)}
                  subtitle="Gross yield"
                />
              )}

              {showHouses && (
                <StatCard
                  title="House days on market"
                  value={daysOnMarket?.house == null ? 'N/A' : `${daysOnMarket.house} days`}
                  subtitle="Houses"
                />
              )}

              {showUnits && (
                <StatCard
                  title="Unit days on market"
                  value={daysOnMarket?.unit == null ? 'N/A' : `${daysOnMarket.unit} days`}
                  subtitle="Units"
                />
              )}

              {showHouses && (
                <StatCard
                  title="House sales (last 30 days)"
                  value={formatSalesCount(houseSales)}
                  subtitle="Recent transactions"
                />
              )}

              {showUnits && (
                <StatCard
                  title="Unit sales (last 30 days)"
                  value={formatSalesCount(unitSales)}
                  subtitle="Recent transactions"
                />
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
            <h2>
              {historicalMetrics.find((metric) => metric.value === historicalMetric)?.heading}
            </h2>

            <p className="section-description">
              {historicalMetrics.find((metric) => metric.value === historicalMetric)?.description}
            </p>

            <div className="chart-card">
              {historicalMetric === 'salePrice' && (
                <>
                  <PriceChart
                    data={priceChartData}
                    showHouses={showHouses}
                    showUnits={showUnits}
                  />

                  {excludedObservations.length > 0 && (
                    <p className="data-quality-note">
                      Data quality note: excluded {excludedObservations.join('; ')} historical observations because their dates or values were invalid, or their values were at or below 10% of the latest median sale price where available. This is a preliminary filter, not confirmation that the remaining data is accurate.
                    </p>
                  )}
                </>
              )}

              {historicalMetric === 'rentalPrice' && (
                <RentChart
                  data={rentChartData}
                  showHouses={showHouses}
                  showUnits={showUnits}
                />
              )}
            </div>
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