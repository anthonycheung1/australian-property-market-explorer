import './Skeleton.css';

// Display a placeholder for a loading statistic card.
export function StatCardSkeleton() {
  return (
    <div className="metric-card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-heading"></div>
      <div className="skeleton skeleton-value"></div>
      <div className="skeleton skeleton-description"></div>
    </div>
  );
}

// Display a placeholder for a loading comparison chart.
export function ChartSkeleton() {
  return (
    <div className="skeleton-chart" aria-hidden="true">
      <div className="skeleton-chart-axis">
        <div className="skeleton skeleton-axis-label"></div>
        <div className="skeleton skeleton-axis-label"></div>
        <div className="skeleton skeleton-axis-label"></div>
        <div className="skeleton skeleton-axis-label"></div>
      </div>

      <div className="skeleton-chart-bars">
        <div className="skeleton skeleton-bar skeleton-bar-one"></div>
        <div className="skeleton skeleton-bar skeleton-bar-two"></div>
        <div className="skeleton skeleton-bar skeleton-bar-three"></div>
      </div>
    </div>
  );
}

// Display a placeholder for a loading comparison table.
export function TableSkeleton() {
  return (
    <div className="comparison-table-wrapper skeleton-table-wrapper" aria-hidden="true">
      <table className="comparison-table skeleton-table">
        <thead>
          <tr>
            <th>
              <div className="skeleton skeleton-table-heading"></div>
            </th>

            <th>
              <div className="skeleton skeleton-table-heading"></div>
            </th>

            <th>
              <div className="skeleton skeleton-table-heading"></div>
            </th>

            <th>
              <div className="skeleton skeleton-table-heading"></div>
            </th>
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <th scope="row">
                <div className="skeleton skeleton-table-cell"></div>
              </th>

              <td>
                <div className="skeleton skeleton-table-cell"></div>
              </td>

              <td>
                <div className="skeleton skeleton-table-cell"></div>
              </td>

              <td>
                <div className="skeleton skeleton-table-cell"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}