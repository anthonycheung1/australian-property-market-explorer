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

export interface PriceChartPoint {
  date: string;
  housePrice?: number;
  unitPrice?: number;
}

interface PriceChartProps {
  data: PriceChartPoint[];
  showHouses: boolean;
  showUnits: boolean;
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}m`;
  }

  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}k`;
  }

  return `$${value}`;
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

function PriceChart({
  data,
  showHouses,
  showUnits,
}: PriceChartProps) {
  if (data.length === 0) {
    return <p>No historical price data is available.</p>;
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
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
            tickFormatter={formatPrice}
            width={75}
          />

          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value, name) => [
              typeof value === 'number'
                ? value.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                  maximumFractionDigits: 0,
                })
                : 'N/A',
              name,
            ]}
          />

          <Legend />

          {showHouses && (
            <Line
              type="monotone"
              dataKey="housePrice"
              name="Houses"
              stroke="#2563eb"
              dot={false}
              connectNulls={false}
            />
          )}

          {showUnits && (
            <Line
              type="monotone"
              dataKey="unitPrice"
              name="Units"
              stroke="#16a34a"
              dot={false}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PriceChart;