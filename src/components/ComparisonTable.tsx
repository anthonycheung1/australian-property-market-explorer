
import { useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, } from 'recharts';
import { supportedSuburbs } from '../data/suburbs.ts';
import type { SuburbPerformanceData } from '../api/propertyApi';
import { formatMoney, formatPercent } from '../utils/formatters';
import './ComparisonTable.css';

type SupportedSuburb = typeof supportedSuburbs[number];
type PropertyType = 'house' | 'unit';

interface SuburbComparisonResult {
  suburb: SupportedSuburb;
  data: SuburbPerformanceData | null;
  error: string;
}

interface ComparisonTableProps {
  results: SuburbComparisonResult[];
}

interface ComparisonMetric {
  label: string;
  getValue: (data: SuburbPerformanceData) => number | null | undefined;
  format: (value: number | null | undefined) => string;
}

interface SortingOption {
  value: string;
  label: string;
  getValue: (data: SuburbPerformanceData, propertyType: PropertyType,) => number | null | undefined;
  format: (value: number | null | undefined) => string;
}

const metrics: ComparisonMetric[] = [
  {
    label: 'Median house price',
    getValue: (data) => data.median_sale_price?.house,
    format: formatMoney,
  },
  {
    label: 'Median unit price',
    getValue: (data) => data.median_sale_price?.unit,
    format: formatMoney,
  },
  {
    label: 'Weekly house rent',
    getValue: (data) => data.median_rent?.house,
    format: formatMoney,
  },
  {
    label: 'Weekly unit rent',
    getValue: (data) => data.median_rent?.unit,
    format: formatMoney,
  },
  {
    label: 'House rental yield',
    getValue: (data) => data.yield_pct?.house,
    format: formatPercent,
  },
  {
    label: 'Unit rental yield',
    getValue: (data) => data.yield_pct?.unit,
    format: formatPercent,
  },
  {
    label: 'Annual house price growth',
    getValue: (data) => data.price_growth?.house?.['1yr'],
    format: formatPercent,
  },
  {
    label: 'Annual unit price growth',
    getValue: (data) => data.price_growth?.unit?.['1yr'],
    format: formatPercent,
  },
  {
    label: 'House days on market',
    getValue: (data) => data.days_on_market?.house,
    format: (value) => value === null || value === undefined ? 'Unavailable' : `${value} days`,
  },
];

const sortingOptions: SortingOption[] = [
  {
    value: 'price',
    label: 'Median property price',
    getValue: (data, propertyType) => data.median_sale_price?.[propertyType],
    format: formatMoney,
  },
  {
    value: 'rent',
    label: 'Weekly rent',
    getValue: (data, propertyType) => data.median_rent?.[propertyType],
    format: formatMoney,
  },
  {
    value: 'yield',
    label: 'Rental yield',
    getValue: (data, propertyType) => data.yield_pct?.[propertyType],
    format: formatPercent,
  },
  {
    value: 'growth',
    label: 'Annual price growth',
    getValue: (data, propertyType) => data.price_growth?.[propertyType]?.['1yr'],
    format: formatPercent,
  },
  {
    value: 'daysOnMarket',
    label: 'Days on market',
    getValue: (data) => data.days_on_market?.house,
    format: (value) => value === null || value === undefined ? 'Unavailable' : `${value} days`,
  },
];

function ComparisonTable({ results }: ComparisonTableProps) {
  // Store the selected market filters.
  const [stateFilter, setStateFilter] = useState('all');
  const [propertyType, setPropertyType] = useState<PropertyType>('house');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYield, setMinYield] = useState('');
  const [minGrowth, setMinGrowth] = useState('');

  // Store the sorting preferences.
  const [sortMetric, setSortMetric] = useState('price');
  const [sortDirection, setSortDirection] = useState('desc');

  // Convert an input string into a number, or null if it is empty.
  function parseFilterValue(value: string): number | null {
    if (value.trim() === '') {
      return null;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  // Find the selected sorting configuration.
  const selectedMetric = sortingOptions.find((option) => option.value === sortMetric,) ?? sortingOptions[0];

  // Apply all active market filters.
  const filteredResults = useMemo(() => {
    const minimumPrice = parseFilterValue(minPrice);
    const maximumPrice = parseFilterValue(maxPrice);
    const minimumYield = parseFilterValue(minYield);
    const minimumGrowth = parseFilterValue(minGrowth);

    return results.filter((result) => {
      // Filter by state.
      const matchesState = stateFilter === 'all' || result.suburb.state === stateFilter;

      // If the API request failed, numerical filters cannot be checked.
      if (!result.data) {
        return (matchesState && minimumPrice === null && maximumPrice === null && minimumYield === null && minimumGrowth === null);
      }

      const price = result.data.median_sale_price?.[propertyType];
      const rentalYield = result.data.yield_pct?.[propertyType];
      const annualGrowth = result.data.price_growth?.[propertyType]?.['1yr'];

      // Check the minimum price.
      const matchesMinPrice = minimumPrice === null || (price !== null && price !== undefined && price >= minimumPrice);

      // Check the maximum price.
      const matchesMaxPrice = maximumPrice === null || (price !== null && price !== undefined && price <= maximumPrice);

      // Check the minimum rental yield.
      const matchesMinYield = minimumYield === null || (rentalYield !== null && rentalYield !== undefined && rentalYield >= minimumYield);

      // Check the minimum annual growth.
      const matchesMinGrowth = minimumGrowth === null || (annualGrowth !== null && annualGrowth !== undefined && annualGrowth >= minimumGrowth);

      // A suburb must satisfy every active filter.
      return (matchesState && matchesMinPrice && matchesMaxPrice && matchesMinYield && matchesMinGrowth);
    });
  }, [results, stateFilter, propertyType, minPrice, maxPrice, minYield, minGrowth,]);

  // Sort a copy of the filtered results.
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      const valueA = a.data ? selectedMetric.getValue(a.data, propertyType) : null;
      const valueB = b.data ? selectedMetric.getValue(b.data, propertyType) : null;
      const hasValueA = valueA !== null && valueA !== undefined;
      const hasValueB = valueB !== null && valueB !== undefined;

      // Keep missing values at the end.
      if (!hasValueA && !hasValueB) {
        return 0;
      }

      if (!hasValueA) {
        return 1;
      }

      if (!hasValueB) {
        return -1;
      }

      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
  }, [filteredResults, selectedMetric, propertyType, sortDirection]);

  // Prepare the sorted results for the bar chart.
  const chartData = sortedResults.map((result) => {
    const value = result.data ? selectedMetric.getValue(result.data, propertyType) : null;

    return { suburb: result.suburb.label, value: value ?? null, };
  });

  // Get the available states from the original results.
  const availableStates = [...new Set(results.map((result) => result.suburb.state)),].sort();

  // Reset all market filters.
  function handleResetFilters() {
    setStateFilter('all');
    setPropertyType('house');
    setMinPrice('');
    setMaxPrice('');
    setMinYield('');
    setMinGrowth('');
  }

  return (
    <div className="comparison-visualisation">
      <section className="comparison-filters-section">
        <div className="comparison-section-heading">
          <h3>Market filters</h3>

          <button
            type="button"
            className="reset-filters-button"
            onClick={handleResetFilters}
          >
            Reset filters
          </button>
        </div>

        <div className="comparison-filters">
          <div className="comparison-control">
            <label htmlFor="filter-state">State or territory</label>

            <select
              id="filter-state"
              value={stateFilter}
              onChange={(event) => setStateFilter(event.currentTarget.value)}
            >
              <option value="all">All states and territories</option>

              {availableStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="comparison-control">
            <label htmlFor="filter-property-type">Property type</label>

            <select
              id="filter-property-type"
              value={propertyType}
              onChange={(event) => setPropertyType(event.currentTarget.value as PropertyType)}
            >
              <option value="house">Houses</option>
              <option value="unit">Units</option>
            </select>
          </div>

          <div className="comparison-control">
            <label htmlFor="filter-min-price">Minimum price ($)</label>

            <input
              id="filter-min-price"
              type="number"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.currentTarget.value)}
              placeholder="No minimum"
            />
          </div>

          <div className="comparison-control">
            <label htmlFor="filter-max-price">Maximum price ($)</label>

            <input
              id="filter-max-price"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.currentTarget.value)}
              placeholder="No maximum"
            />
          </div>

          <div className="comparison-control">
            <label htmlFor="filter-min-yield">Minimum rental yield (%)</label>

            <input
              id="filter-min-yield"
              type="number"
              step="0.01"
              value={minYield}
              onChange={(event) => setMinYield(event.currentTarget.value)}
              placeholder="No minimum"
            />
          </div>

          <div className="comparison-control">
            <label htmlFor="filter-min-growth">Minimum annual growth (%)</label>

            <input
              id="filter-min-growth"
              type="number"
              step="0.01"
              value={minGrowth}
              onChange={(event) => setMinGrowth(event.currentTarget.value)}
              placeholder="No minimum"
            />
          </div>
        </div>

        <p className="filter-results-count" role="status">
          Showing {filteredResults.length} of {results.length} suburbs
        </p>
      </section>

      {sortedResults.length === 0 ? (
        <p className="comparison-no-results">
          No suburbs match your selected filters. Try adjusting or resetting your filters.
        </p>
      ) : (
        <>
          <section className="comparison-chart-section">
            <h3>Compare market metrics</h3>

            <div className="comparison-controls">
              <div className="comparison-control">
                <label htmlFor="sort-metric">Compare by</label>

                <select
                  id="sort-metric"
                  value={sortMetric}
                  onChange={(event) => setSortMetric(event.currentTarget.value)}
                >
                  {sortingOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="comparison-control">
                <label htmlFor="sort-direction">Sort order</label>

                <select
                  id="sort-direction"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.currentTarget.value)}
                >
                  <option value="desc">Highest first</option>
                  <option value="asc">Lowest first</option>
                </select>
              </div>
            </div>

            <div
              className="comparison-chart"
              role="img"
              aria-label={`Bar chart comparing ${selectedMetric.label.toLowerCase()} for ${propertyType === 'house' ? 'houses' : 'units'}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="suburb"
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    tick={{ fontSize: 12 }}
                    width={90}
                  />

                  <Tooltip
                    formatter={(value) => [selectedMetric.format(typeof value === 'number' ? value : null,), selectedMetric.label,]}
                  />

                  <Bar
                    dataKey="value"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="comparison-table-section">
            <h3>Market data comparison</h3>

            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <caption>
                  Property market metrics across selected suburbs
                </caption>

                <thead>
                  <tr>
                    <th scope="col">Metric</th>

                    {sortedResults.map((result) => (
                      <th
                        scope="col"
                        key={`${result.suburb.state}-${result.suburb.value}`}
                      >
                        {result.suburb.label}

                        <span className="table-suburb-state">
                          {result.suburb.state}
                        </span>

                        {result.error && (
                          <span className="table-error-label">
                            Data unavailable
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {metrics.map((metric) => (
                    <tr key={metric.label}>
                      <th scope="row">{metric.label}</th>

                      {sortedResults.map((result) => (
                        <td
                          key={`${result.suburb.state}-${result.suburb.value}`}
                        >
                          {result.data ? metric.format(metric.getValue(result.data)) : 'Unavailable'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default ComparisonTable;