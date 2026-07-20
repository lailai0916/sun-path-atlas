export type StatItem = {
  label: string
  value: string
  note?: string
}

type StatsCardsProps = {
  items: StatItem[]
}

export default function StatsCards({ items }: StatsCardsProps) {
  return (
    <dl className="stats-grid">
      {items.map((item) => (
        <div key={item.label} className="stat-card">
          <dt className="stat-label">{item.label}</dt>
          <dd className="stat-value">{item.value}</dd>
          {item.note ? <p className="stat-note">{item.note}</p> : null}
        </div>
      ))}
    </dl>
  )
}
