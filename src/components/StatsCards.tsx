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
    <div className="stats-grid">
      {items.map((item) => (
        <div key={item.label} className="stat-card">
          <p className="stat-label">{item.label}</p>
          <p className="stat-value">{item.value}</p>
          {item.note ? <p className="stat-note">{item.note}</p> : null}
        </div>
      ))}
    </div>
  )
}
