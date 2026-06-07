export const dashboardMetrics = [
  {
    label: 'Today revenue',
    value: 'KES 42,850',
    context: '18% above last Sunday',
    icon: 'revenue',
  },
  {
    label: 'Receipts',
    value: '128',
    context: 'Fast checkout lane',
    icon: 'receipts',
  },
  {
    label: 'Active workers',
    value: '18',
    context: '6 chairs in service',
    icon: 'workers',
  },
  {
    label: 'Pending sync',
    value: '0',
    context: 'Cloud source aligned',
    icon: 'sync',
  },
] as const

export const hourlySales = [
  { time: '8 AM', sales: 2400 },
  { time: '10 AM', sales: 5200 },
  { time: '12 PM', sales: 8100 },
  { time: '2 PM', sales: 6700 },
  { time: '4 PM', sales: 9300 },
  { time: '6 PM', sales: 11150 },
] as const

export const paymentMix = [
  { method: 'Cash', value: 28 },
  { method: 'Card', value: 19 },
  { method: 'M-Pesa', value: 53 },
] as const

export const workerQueue = [
  {
    worker: 'Amina N.',
    service: 'Braids',
    chair: 'Chair 02',
    status: 'Serving',
    eta: '22 min',
  },
  {
    worker: 'Brian K.',
    service: 'Cut and wash',
    chair: 'Chair 04',
    status: 'Serving',
    eta: '14 min',
  },
  {
    worker: 'Njeri W.',
    service: 'Manicure',
    chair: 'Nail bar',
    status: 'Queued',
    eta: '8 min',
  },
] as const
