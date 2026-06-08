export const recentSales = [
  { receipt: 'RCP-1042', client: 'Mother + 2', amount: 'KES 8,400', method: 'M-Pesa', status: 'Paid', time: '10:42' },
  { receipt: 'RCP-1041', client: 'Walk-in', amount: 'KES 2,500', method: 'Cash', status: 'Paid', time: '10:18' },
  { receipt: 'RCP-1040', client: 'Client 1', amount: 'KES 4,700', method: 'Mixed', status: 'Paid', time: '09:55' },
  { receipt: 'RCP-1039', client: 'Client 2', amount: 'KES 1,800', method: 'Bank', status: 'Pending', time: '09:22' },
]

export const cashierMetrics = [
  { label: 'Revenue Today', value: 'KES 42,800', context: '+12% vs yesterday' },
  { label: 'Sales Today', value: '28', context: '7 split checkouts' },
  { label: 'Clients Today', value: '41', context: 'includes grouped clients' },
  { label: 'Pending Refunds', value: '2', context: 'manager approval needed' },
  { label: 'Offline Queue', value: '3 pending', context: 'ready for sync retry' },
]

export const managerMetrics = [
  { label: 'Revenue Today', value: 'KES 72,400', context: 'branch-only view' },
  { label: 'Revenue This Month', value: 'KES 1.42M', context: '+8.4% month over month' },
  { label: 'Sales Count', value: '382', context: 'current month' },
  { label: 'Active Workers', value: '18', context: '12 currently assigned' },
]

export const adminMetrics = [
  { id: 'totalRevenue', label: 'Total Revenue', value: 'KES 6.84M', context: 'all branches' },
  { id: 'totalSales', label: 'Total Sales', value: '2,941', context: 'current month' },
  { id: 'totalBranches', label: 'Total Branches', value: '6', context: '5 active, 1 onboarding' },
  { id: 'totalWorkers', label: 'Total Workers', value: '86', context: 'across all branches' },
] as const

export const revenueTrend = [
  { day: 'Mon', revenue: 42000, sales: 22 },
  { day: 'Tue', revenue: 51000, sales: 29 },
  { day: 'Wed', revenue: 47000, sales: 25 },
  { day: 'Thu', revenue: 64000, sales: 34 },
  { day: 'Fri', revenue: 72000, sales: 39 },
  { day: 'Sat', revenue: 98000, sales: 51 },
  { day: 'Sun', revenue: 68800, sales: 37 },
]

export const branchComparison = [
  { branch: 'CBD', revenue: 1420000 },
  { branch: 'Westlands', revenue: 1280000 },
  { branch: 'Kilimani', revenue: 1040000 },
  { branch: 'Rongai', revenue: 840000 },
  { branch: 'Thika', revenue: 620000 },
]

export const topServices = [
  { name: 'Braids', count: 92, revenue: 'KES 368,000' },
  { name: 'Lashes', count: 76, revenue: 'KES 228,000' },
  { name: 'Pedicure', count: 63, revenue: 'KES 157,500' },
  { name: 'Nails', count: 58, revenue: 'KES 174,000' },
]

export const topWorkers = [
  { name: 'Amina W.', sales: 86, earnings: 'KES 94,200' },
  { name: 'Brian K.', sales: 73, earnings: 'KES 82,900' },
  { name: 'Cynthia M.', sales: 69, earnings: 'KES 79,400' },
  { name: 'Diana N.', sales: 61, earnings: 'KES 68,700' },
]

export const refundRequests = [
  {
    id: 'RF-120',
    receipt: 'RCP-1042',
    client: 'Child 2',
    service: 'Nails',
    amount: 'KES 1,200',
    status: 'Pending',
    requestedBy: 'Cashier A',
    reason: 'Client disputed one service item.',
  },
  {
    id: 'RF-119',
    receipt: 'RCP-1038',
    client: 'Walk-in',
    service: 'Lashes',
    amount: 'KES 900',
    status: 'Approved',
    requestedBy: 'Cashier B',
    reason: 'Partial item refund.',
  },
  {
    id: 'RF-118',
    receipt: 'RCP-1027',
    client: 'Client 1',
    service: 'Pedicure',
    amount: 'KES 700',
    status: 'Rejected',
    requestedBy: 'Cashier A',
    reason: 'Outside approval window.',
  },
]

export const workerSettlements = [
  {
    name: 'Amina W.',
    role: 'Braids specialist',
    outstanding: 'KES 18,400',
    earned: 'KES 94,200',
    lastPaid: 'Yesterday',
    history: ['KES 12,000 paid yesterday', 'KES 9,500 paid Friday'],
  },
  {
    name: 'Brian K.',
    role: 'Barber',
    outstanding: 'KES 12,700',
    earned: 'KES 82,900',
    lastPaid: '2 days ago',
    history: ['KES 8,000 paid Saturday', 'KES 11,200 paid Thursday'],
  },
  {
    name: 'Cynthia M.',
    role: 'Lashes',
    outstanding: 'KES 15,100',
    earned: 'KES 79,400',
    lastPaid: 'Friday',
    history: ['KES 7,500 paid Friday', 'KES 10,000 paid Wednesday'],
  },
  {
    name: 'Diana N.',
    role: 'Nails',
    outstanding: 'KES 9,800',
    earned: 'KES 68,700',
    lastPaid: 'Friday',
    history: ['KES 6,200 paid Friday', 'KES 8,300 paid Tuesday'],
  },
]

export const paymentLogs = [
  {
    receipt: 'RCP-1042',
    date: 'Today 10:42',
    amount: 'KES 8,400',
    method: 'M-Pesa',
    status: 'Paid',
    clients: ['Mother', 'Child 1', 'Child 2'],
    items: ['Lashes - Cynthia M. - KES 3,000', 'Hair - Amina W. - KES 3,200', 'Nails - Diana N. - KES 2,200'],
  },
  {
    receipt: 'RCP-1041',
    date: 'Today 10:18',
    amount: 'KES 2,500',
    method: 'Cash',
    status: 'Paid',
    clients: ['Walk-in'],
    items: ['Pedicure - Diana N. - KES 2,500'],
  },
  {
    receipt: 'RCP-1040',
    date: 'Today 09:55',
    amount: 'KES 4,700',
    method: 'Mixed',
    status: 'Paid',
    clients: ['Client 1'],
    items: ['Braids refresh - Amina W. - KES 4,700'],
  },
  {
    receipt: 'RCP-1039',
    date: 'Today 09:22',
    amount: 'KES 1,800',
    method: 'Bank',
    status: 'Pending',
    clients: ['Client 2'],
    items: ['Hair wash - Brian K. - KES 1,800'],
  },
  {
    receipt: 'RCP-1038',
    date: 'Yesterday 17:48',
    amount: 'KES 3,200',
    method: 'M-Pesa',
    status: 'Partially refunded',
    clients: ['Walk-in'],
    items: ['Lashes - Cynthia M. - KES 3,200'],
  },
]

export const cashierServiceCatalog = [
  { id: 'svc-braids', name: 'Braids', defaultPrice: 4000 },
  { id: 'svc-lashes', name: 'Lashes', defaultPrice: 3000 },
  { id: 'svc-pedicure', name: 'Pedicure', defaultPrice: 2500 },
  { id: 'svc-nails', name: 'Nails', defaultPrice: 3000 },
  { id: 'svc-wash', name: 'Hair Wash', defaultPrice: 1200 },
  { id: 'svc-barber', name: 'Barber Cut', defaultPrice: 1800 },
]

export const cashierWorkers = [
  { id: 'worker-amina', name: 'Amina W.' },
  { id: 'worker-brian', name: 'Brian K.' },
  { id: 'worker-cynthia', name: 'Cynthia M.' },
  { id: 'worker-diana', name: 'Diana N.' },
]

export const services = [
  { name: 'Braids', price: 'KES 4,000', commission: '35%', status: 'Active', scope: 'Global' },
  { name: 'Lashes', price: 'KES 3,000', commission: '30%', status: 'Active', scope: 'Branch' },
  { name: 'Pedicure', price: 'KES 2,500', commission: '25%', status: 'Active', scope: 'Global' },
  { name: 'Nails', price: 'KES 3,000', commission: '28%', status: 'Disabled', scope: 'Branch' },
]

export const workers = [
  { name: 'Amina W.', phone: '+254 700 111 101', skills: 'Braids, natural hair', status: 'Active', branch: 'CBD' },
  { name: 'Brian K.', phone: '+254 700 111 102', skills: 'Barber, color', status: 'Active', branch: 'CBD' },
  { name: 'Cynthia M.', phone: '+254 700 111 103', skills: 'Lashes, brows', status: 'Active', branch: 'CBD' },
  { name: 'Diana N.', phone: '+254 700 111 104', skills: 'Nails, pedicure', status: 'Disabled', branch: 'CBD' },
]

export const branches = [
  { name: 'CBD Flagship', code: 'CBD', manager: 'Mary K.', revenue: 'KES 1.42M', status: 'Active' },
  { name: 'Westlands', code: 'WST', manager: 'Njeri A.', revenue: 'KES 1.28M', status: 'Active' },
  { name: 'Kilimani', code: 'KLM', manager: 'Otieno P.', revenue: 'KES 1.04M', status: 'Active' },
  { name: 'Rongai', code: 'RNG', manager: 'Faith M.', revenue: 'KES 840K', status: 'Active' },
]

export const auditLogs = [
  { user: 'Mary K.', action: 'RefundApproved', entity: 'RF-119', timestamp: 'Today 11:12', branch: 'CBD' },
  { user: 'Cashier A', action: 'PaymentCompleted', entity: 'RCP-1042', timestamp: 'Today 10:43', branch: 'CBD' },
  { user: 'Admin', action: 'ServiceModified', entity: 'Braids', timestamp: 'Yesterday 16:05', branch: 'Global' },
  { user: 'Njeri A.', action: 'WorkerSettlementMarkedPaid', entity: 'Amina W.', timestamp: 'Yesterday 14:20', branch: 'Westlands' },
]
