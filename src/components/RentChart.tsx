
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface RentChartPoint {
  date: string;
  houseRent?: number;
  unitRent?: number;
}

interface RentChartProps {
  data: RentChartPoint[];
  showHouses: boolean;
  showUnits: boolean;
}

function formatRent(value: number): string {
  return `$${Math.round(value).toLocaleString('en-AU')}`;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-AU', {
    month: 'short',
    year: '2-digit',
  });
}

function RentChart({
  data,
  showHouses,
  showUnits,
}: RentChartProps) {
  if (data.length === 0) {
    return <p>No historical rental data is available.</p>;
  }

  return (
    <>
      <div
        role="img"
        aria-label={`Historical median rental prices. ${showHouses && showUnits
            ? 'Comparing houses and units.'
            : showHouses
              ? 'Showing houses.'
              : 'Showing units.'
          } Values are weekly rents in Australian dollars.`}
        style={{ width: '100%', height: 320 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 20,
              bottom: 10,
              left: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              minTickGap={30}
            />

            <YAxis
              tickFormatter={formatRent}
              width={75}
            />

            <Tooltip
              labelFormatter={(label) =>
                formatDate(String(label))
              }
              formatter={(value, name) => [
                typeof value === 'number'? formatRent(value): 'N/A',
                name,
              ]}
            />

            <Legend />

            {showHouses && (
              <Line
                type="monotone"
                dataKey="houseRent"
                name="Houses"
                stroke="#2563eb"
                dot={false}
                connectNulls={false}
              />
            )}

            {showUnits && (
              <Line
                type="monotone"
                dataKey="unitRent"
                name="Units"
                stroke="#16a34a"
                strokeDasharray="5 5"
                dot={false}
                connectNulls={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <details className="chart-data">
        <summary>View historical rental data as a table</summary>

        <table>
          <caption>Historical median weekly rents</caption>

          <thead>
            <tr>
              <th scope="col">Date</th>
              {showHouses && <th scope="col">Houses</th>}
              {showUnits && <th scope="col">Units</th>}
            </tr>
          </thead>

          <tbody>
            {data.map((point) => (
              <tr key={point.date}>
                <th scope="row">{formatDate(point.date)}</th>

                {showHouses && (
                  <td>
                    {point.houseRent == null? 'N/A': formatRent(point.houseRent)}
                  </td>
                )}

                {showUnits && (
                  <td>
                    {point.unitRent == null? 'N/A': formatRent(point.unitRent)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}

export default RentChart;