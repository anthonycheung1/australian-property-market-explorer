
import { useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,} from 'recharts';
import { supportedSuburbs } from '../data/suburbs.ts';
import type { SuburbPerformanceData } from '../api/propertyApi';
import { formatMoney, formatPercent } from '../utils/formatters';
import './ComparisonTable.css';

type SupportedSuburb = typeof supportedSuburbs[number];

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
    label: 'House days on market',
    getValue: (data) => data.days_on_market?.house,
    format: (value) => value === null || value === undefined ? 'Unavailable' : `${value} days`,
  },
];

const sortingOptions = [
  {
    value: 'housePrice',
    label: 'Median house price',
    getValue: (data: SuburbPerformanceData) => data.median_sale_price?.house,
    format: formatMoney,
  },
  {
    value: 'houseRent',
    label: 'Weekly house rent',
    getValue: (data: SuburbPerformanceData) => data.median_rent?.house,
    format: formatMoney,
  },
  {
    value: 'houseYield',
    label: 'House rental yield',
    getValue: (data: SuburbPerformanceData) => data.yield_pct?.house,
    format: formatPercent,
  },
  {
    value: 'houseGrowth',
    label: 'Annual house price growth',
    getValue: (data: SuburbPerformanceData) => data.price_growth?.house?.['1yr'],
    format: formatPercent,
  },
  {
    value: 'houseDaysOnMarket',
    label: 'House days on market',
    getValue: (data: SuburbPerformanceData) => data.days_on_market?.house,
    format: (value: number | null | undefined) => value === null || value === undefined ? 'Unavailable' : `${value} days`,
  },
];

function ComparisonTable({ results }: ComparisonTableProps) {
  const [sortMetric, setSortMetric] = useState('housePrice');
  const [sortDirection, setSortDirection] = useState('desc');

  // Find the selected metric configuration.
  const selectedMetric = sortingOptions.find(
    (option) => option.value === sortMetric,
  ) ?? sortingOptions[0];

  // Sort a copy of the results without mutating React state.
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => {
      const valueA = a.data ? selectedMetric.getValue(a.data) : null;
      const valueB = b.data ? selectedMetric.getValue(b.data) : null;

      // Put missing values after valid values.
      const hasValueA = valueA !== null && valueA !== undefined;
      const hasValueB = valueB !== null && valueB !== undefined;

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
  }, [results, selectedMetric, sortDirection]);

  // Prepare numerical data for the bar chart.
  const chartData = sortedResults.map((result) => {
    const value = result.data ? selectedMetric.getValue(result.data) : null;

    return {
      suburb: result.suburb.label,
      value: value ?? null,
    };
  });

  return (
    <div className="comparison-visualisation">
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
          aria-label={`Bar chart comparing ${selectedMetric.label.toLowerCase()} across selected suburbs`}
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
                formatter={(value) => [
                  selectedMetric.format(
                    typeof value === 'number' ? value : null,
                  ),
                  selectedMetric.label,
                ]}
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
    </div>
  );
}

export default ComparisonTable;