interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

function StatCard(props: StatCardProps) {
  return (
    <article className="metric-card">
      <h3>{props.title}</h3>

      <p className="metric-value">
        {props.value}
      </p>

      {props.subtitle && (
        <p className="metric-detail">
          {props.subtitle}
        </p>
      )}
    </article>
  );
}

export default StatCard;