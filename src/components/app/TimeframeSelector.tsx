import { SimpleTabs } from '@/components/app/SimpleTabs'

export type Timeframe = 'today' | 'week' | 'month' | 'year'

type TimeframeSelectorProps = {
  value: Timeframe
  onChange: (value: Timeframe) => void
}

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <SimpleTabs
      activeTab={value}
      onChange={(v) => onChange(v as Timeframe)}
      tabs={[
        { id: 'today', label: 'Today' },
        { id: 'week', label: 'This Week' },
        { id: 'month', label: 'This Month' },
        { id: 'year', label: 'This Year' },
      ]}
    />
  )
}
