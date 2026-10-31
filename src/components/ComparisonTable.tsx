
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

function ComparisonTable({ results }: ComparisonTableProps) {
  // Define the metrics displayed in the comparison table.
  const metrics = [
    {
      label: 'Median house price',
      getValue: (data: SuburbPerformanceData) => data.median_sale_price?.house,
      format: formatMoney,
    },
    {
      label: 'Median unit price',
      getValue: (data: SuburbPerformanceData) => data.median_sale_price?.unit,
      format: formatMoney,
    },
    {
      label: 'Weekly house rent',
      getValue: (data: SuburbPerformanceData) => data.median_rent?.house,
      format: formatMoney,
    },
    {
      label: 'Weekly unit rent',
      getValue: (data: SuburbPerformanceData) => data.median_rent?.unit,
      format: formatMoney,
    },
    {
      label: 'House rental yield',
      getValue: (data: SuburbPerformanceData) => data.yield_pct?.house,
      format: formatPercent,
    },
    {
      label: 'Unit rental yield',
      getValue: (data: SuburbPerformanceData) => data.yield_pct?.unit,
      format: formatPercent,
    },
  ];

  return (
    <div className="comparison-table-wrapper">
      <table className="comparison-table">
        <caption>
          Property market metrics across selected suburbs
        </caption>

        <thead>
          <tr>
            <th scope="col">Metric</th>

            {results.map((result) => (
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

              {results.map((result) => (
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
  );
}

export default ComparisonTable;