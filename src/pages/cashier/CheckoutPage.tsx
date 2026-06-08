import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  FileDown,
  Plus,
  Printer,
  ReceiptText,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { EmptyState } from '@/components/app/EmptyState'
import { SectionHeader } from '@/components/app/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cashierServiceCatalog, cashierWorkers } from '@/pages/mockData'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'
import {
  calculateClientTotals,
  calculateSaleTotal,
  cashierPaymentMethods,
  cashierSplitMethods,
  formatMoney,
  getCashierPaymentExecutionStatus,
  getExecutionStatusLabel,
  getPaymentMethodLabel,
  toDomainPaymentMethod,
  validateCashierPayment,
  validateMixedPaymentRows,
  type CashierMpesaState,
  type CashierPaymentMethod,
  type CashierSaleDraft,
  type CashierSplitMethod,
  type CashierSplitPaymentDraft,
} from './cashierSaleLogic'

export function CheckoutPage() {
  const saleDraft = useUiStore((state) => state.activeSaleDraft)
  const setActiveRoute = useUiStore((state) => state.setActiveRoute)
  const startNewCashierSale = useUiStore((state) => state.startNewCashierSale)
  const [paymentMethod, setPaymentMethod] = useState<CashierPaymentMethod>('Cash')
  const [offlineMode, setOfflineMode] = useState(false)
  const [mpesaPhone, setMpesaPhone] = useState('254712345678')
  const [mpesaState, setMpesaState] = useState<CashierMpesaState>('idle')
  const [manualMpesaReference, setManualMpesaReference] = useState('')
  const [bankReference, setBankReference] = useState('')
  const [splitPayments, setSplitPayments] = useState<CashierSplitPaymentDraft[]>([
    { id: 'split-1', method: 'Cash', amount: 0, reference: '' },
  ])
  const [receiptVisible, setReceiptVisible] = useState(false)
  const total = useMemo(() => calculateSaleTotal(saleDraft.clients), [saleDraft.clients])
  const itemCount = saleDraft.clients.reduce((sum, client) => sum + client.items.length, 0)
  const clientTotals = useMemo(() => calculateClientTotals(saleDraft.clients), [saleDraft.clients])
  const splitValidation = useMemo(
    () => validateMixedPaymentRows(splitPayments, total),
    [splitPayments, total],
  )
  const paymentValidation = validateCashierPayment({
    method: paymentMethod,
    saleTotal: total,
    offlineMode,
    mpesaState,
    manualMpesaReference,
    bankReference,
    mixedPaymentValid: splitValidation.isValid,
  })
  const paymentExecutionStatus = getCashierPaymentExecutionStatus({
    method: paymentMethod,
    offlineMode,
    mpesaState,
    readyToComplete: paymentValidation.canComplete,
  })

  function updateSplitPayment(id: string, patch: Partial<CashierSplitPaymentDraft>) {
    setSplitPayments((current) =>
      current.map((payment) => (payment.id === id ? { ...payment, ...patch } : payment)),
    )
  }

  function addSplitPayment() {
    setSplitPayments((current) => [
      ...current,
      { id: `split-${Date.now()}`, method: 'Cash', amount: 0, reference: '' },
    ])
  }

  function removeSplitPayment(id: string) {
    setSplitPayments((current) => current.filter((payment) => payment.id !== id))
  }

  function startFreshSale() {
    startNewCashierSale()
    setReceiptVisible(false)
    setActiveRoute('new-sale')
  }

  if (itemCount === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title="No sale ready for checkout"
        description="Build at least one client service line before checkout."
        actionLabel="Build Sale"
        onAction={() => setActiveRoute('new-sale')}
      />
    )
  }

  if (receiptVisible) {
    return (
      <ReceiptView
        saleDraft={saleDraft}
        paymentMethod={paymentMethod}
        splitPayments={splitPayments}
        mpesaReference={offlineMode ? manualMpesaReference : 'STK-SUCCESS-2048'}
        bankReference={bankReference}
        executionStatusLabel={getExecutionStatusLabel(paymentExecutionStatus)}
        onNewSale={startFreshSale}
      />
    )
  }

  return (
    <>
      <SectionHeader
        eyebrow="Step 2"
        title="Checkout"
        description="Confirm the sale summary, process one payment flow, then generate the receipt."
        actions={
          <>
            <Button type="button" variant="outline" size="lg" onClick={() => setActiveRoute('new-sale')}>
              Back to Build Sale
            </Button>
            <Button
              type="button"
              size="lg"
              disabled={!paymentValidation.canComplete}
              onClick={() => setReceiptVisible(true)}
            >
              <ReceiptText className="size-4" aria-hidden="true" />
              Generate Receipt
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <SaleReviewCard saleDraft={saleDraft} clientTotals={clientTotals} total={total} />
        <PaymentCard
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          offlineMode={offlineMode}
          setOfflineMode={setOfflineMode}
          mpesaPhone={mpesaPhone}
          setMpesaPhone={setMpesaPhone}
          mpesaState={mpesaState}
          setMpesaState={setMpesaState}
          manualMpesaReference={manualMpesaReference}
          setManualMpesaReference={setManualMpesaReference}
          bankReference={bankReference}
          setBankReference={setBankReference}
          splitPayments={splitPayments}
          total={total}
          splitValidation={splitValidation}
          paymentValidationMessage={paymentValidation.message}
          executionStatusLabel={getExecutionStatusLabel(paymentExecutionStatus)}
          addSplitPayment={addSplitPayment}
          updateSplitPayment={updateSplitPayment}
          removeSplitPayment={removeSplitPayment}
          onComplete={() => setReceiptVisible(true)}
          canComplete={paymentValidation.canComplete}
        />
      </section>
    </>
  )
}

function SaleReviewCard({
  saleDraft,
  clientTotals,
  total,
}: {
  saleDraft: CashierSaleDraft
  clientTotals: Array<{ clientId: string; label: string; total: number }>
  total: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{saleDraft.saleNumber}</CardTitle>
        <CardDescription>Final sale summary</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {saleDraft.clients.map((client) => (
          <div key={client.id} className="rounded-md border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{client.label || 'Untitled client'}</p>
              <Badge variant="outline">
                {formatMoney(clientTotals.find((item) => item.clientId === client.id)?.total ?? 0)}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2">
              {client.items.map((item) => (
                <div key={item.id} className="grid gap-2 rounded-md bg-surface p-3 text-sm md:grid-cols-[1fr_1fr_auto]">
                  <span>{getServiceName(item.serviceId)}</span>
                  <span className="text-secondary-foreground">{getWorkerName(item.workerId)}</span>
                  <span className="font-semibold">{formatMoney(item.price)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-4 text-lg font-semibold">
          <span>Total</span>
          <span className="text-primary">{formatMoney(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentCard({
  paymentMethod,
  setPaymentMethod,
  offlineMode,
  setOfflineMode,
  mpesaPhone,
  setMpesaPhone,
  mpesaState,
  setMpesaState,
  manualMpesaReference,
  setManualMpesaReference,
  bankReference,
  setBankReference,
  splitPayments,
  total,
  splitValidation,
  paymentValidationMessage,
  executionStatusLabel,
  addSplitPayment,
  updateSplitPayment,
  removeSplitPayment,
  onComplete,
  canComplete,
}: {
  paymentMethod: CashierPaymentMethod
  setPaymentMethod: (method: CashierPaymentMethod) => void
  offlineMode: boolean
  setOfflineMode: (offlineMode: boolean) => void
  mpesaPhone: string
  setMpesaPhone: (phone: string) => void
  mpesaState: CashierMpesaState
  setMpesaState: (state: CashierMpesaState) => void
  manualMpesaReference: string
  setManualMpesaReference: (reference: string) => void
  bankReference: string
  setBankReference: (reference: string) => void
  splitPayments: CashierSplitPaymentDraft[]
  total: number
  splitValidation: ReturnType<typeof validateMixedPaymentRows>
  paymentValidationMessage: string
  executionStatusLabel: string
  addSplitPayment: () => void
  updateSplitPayment: (id: string, patch: Partial<CashierSplitPaymentDraft>) => void
  removeSplitPayment: (id: string) => void
  onComplete: () => void
  canComplete: boolean
}) {
  const domainPaymentMethod = toDomainPaymentMethod(paymentMethod)

  return (
    <aside className="grid gap-4 xl:sticky xl:top-24 xl:self-start">
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>{formatMoney(total)}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {cashierPaymentMethods.map((method) => (
              <Button
                key={method}
                type="button"
                variant={paymentMethod === method ? 'default' : 'outline'}
                className={cn('h-12', method === 'Mpesa' && paymentMethod === method ? 'bg-emerald-600 text-white hover:bg-emerald-700' : '')}
                onClick={() => setPaymentMethod(method)}
              >
                {method === 'Cash' ? (
                  <Banknote className="size-4" aria-hidden="true" />
                ) : method === 'Mpesa' ? (
                  <Smartphone className="size-4" aria-hidden="true" />
                ) : (
                  <CreditCard className="size-4" aria-hidden="true" />
                )}
                {getPaymentMethodLabel(method)}
              </Button>
            ))}
          </div>

          <div className="grid gap-2 rounded-md border bg-background p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-secondary-foreground">Contract method</span>
              <Badge variant="outline">{domainPaymentMethod}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-secondary-foreground">Execution status</span>
              <Badge variant={canComplete ? 'default' : 'outline'}>{executionStatusLabel}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{paymentValidationMessage}</p>
          </div>

          {paymentMethod === 'Mpesa' ? (
            <MpesaPanel
              offlineMode={offlineMode}
              setOfflineMode={setOfflineMode}
              phone={mpesaPhone}
              setPhone={setMpesaPhone}
              state={mpesaState}
              setState={setMpesaState}
              manualReference={manualMpesaReference}
              setManualReference={setManualMpesaReference}
            />
          ) : null}

          {paymentMethod === 'Bank' ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="bank-reference">
                Bank reference
              </label>
              <Input
                id="bank-reference"
                value={bankReference}
                onChange={(event) => setBankReference(event.target.value)}
                placeholder="Enter transfer/reference number"
              />
            </div>
          ) : null}

          {paymentMethod === 'Mixed' ? (
            <MixedPaymentPanel
              splitPayments={splitPayments}
              total={total}
              splitValidation={splitValidation}
              addSplitPayment={addSplitPayment}
              updateSplitPayment={updateSplitPayment}
              removeSplitPayment={removeSplitPayment}
            />
          ) : null}
        </CardContent>
      </Card>

      <Button type="button" size="lg" disabled={!canComplete} onClick={onComplete}>
        <ReceiptText className="size-4" aria-hidden="true" />
        Complete Payment
      </Button>
    </aside>
  )
}

function MpesaPanel({
  offlineMode,
  setOfflineMode,
  phone,
  setPhone,
  state,
  setState,
  manualReference,
  setManualReference,
}: {
  offlineMode: boolean
  setOfflineMode: (offlineMode: boolean) => void
  phone: string
  setPhone: (phone: string) => void
  state: CashierMpesaState
  setState: (state: CashierMpesaState) => void
  manualReference: string
  setManualReference: (reference: string) => void
}) {
  const stateLabel = {
    idle: 'Ready',
    sending: 'STK sent',
    success: 'Confirmed',
    failed: 'Failed',
  }[state]

  return (
    <div className="grid gap-3 rounded-md border border-emerald-500/50 bg-emerald-500/10 p-3">
      <button
        type="button"
        onClick={() => setOfflineMode(!offlineMode)}
        className={cn(
          'flex min-h-11 items-center justify-between rounded-md border px-3 text-left text-sm outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-emerald-500/35',
          offlineMode ? 'border-emerald-400 bg-emerald-500/15' : 'border-emerald-500/40 bg-background/70',
        )}
      >
        <span>Offline manual M-Pesa</span>
        <span className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white">{offlineMode ? 'On' : 'Off'}</span>
      </button>

      {offlineMode ? (
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="manual-reference">
            Manual M-Pesa receipt number
          </label>
          <Input
            id="manual-reference"
            value={manualReference}
            onChange={(event) => setManualReference(event.target.value)}
            placeholder="Example: QK45MZ01"
          />
          <p className="text-xs text-secondary-foreground">Status: pending sync.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="mpesa-phone">
              Phone number
            </label>
            <Input id="mpesa-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="2547..." />
          </div>
          <div className="rounded-md border border-emerald-500/40 bg-background/70 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-secondary-foreground">STK Push</span>
              <span className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white">{stateLabel}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" onClick={() => setState('sending')}>
              <Smartphone className="size-4" aria-hidden="true" />
              Send
            </Button>
            <Button type="button" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => setState('success')}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Success
            </Button>
            <Button type="button" variant="outline" onClick={() => setState('failed')}>
              <AlertCircle className="size-4" aria-hidden="true" />
              Failed
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function MixedPaymentPanel({
  splitPayments,
  total,
  splitValidation,
  addSplitPayment,
  updateSplitPayment,
  removeSplitPayment,
}: {
  splitPayments: CashierSplitPaymentDraft[]
  total: number
  splitValidation: ReturnType<typeof validateMixedPaymentRows>
  addSplitPayment: () => void
  updateSplitPayment: (id: string, patch: Partial<CashierSplitPaymentDraft>) => void
  removeSplitPayment: (id: string) => void
}) {
  return (
    <div className="grid gap-3 rounded-md border bg-background p-3">
      {splitPayments.map((payment) => (
        <div key={payment.id} className="grid gap-2 rounded-md border bg-surface p-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select
              value={payment.method}
              onChange={(event) => updateSplitPayment(payment.id, { method: event.target.value as CashierSplitMethod })}
              className="h-11 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35"
            >
              {cashierSplitMethods.map((method) => (
                <option key={method} value={method}>
                  {getPaymentMethodLabel(method)}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={0}
              value={payment.amount}
              onChange={(event) => updateSplitPayment(payment.id, { amount: Number(event.target.value) })}
              aria-label={`${payment.method} amount`}
            />
            <Button type="button" variant="outline" size="icon" aria-label="Remove payment row" onClick={() => removeSplitPayment(payment.id)}>
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
          {(payment.method === 'Mpesa' || payment.method === 'Bank') ? (
            <Input
              value={payment.reference}
              onChange={(event) => updateSplitPayment(payment.id, { reference: event.target.value })}
              placeholder={`${getPaymentMethodLabel(payment.method)} reference`}
            />
          ) : null}
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addSplitPayment}>
        <Plus className="size-4" aria-hidden="true" />
        Add payment row
      </Button>

      <div className="grid gap-2 border-t pt-3 text-sm">
        <div className="flex justify-between">
          <span className="text-secondary-foreground">Sale total</span>
          <span className="font-medium">{formatMoney(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-secondary-foreground">Running balance</span>
          <span className={cn('font-semibold', splitValidation.isBalanced ? 'text-primary' : 'text-orange')}>
            {formatMoney(splitValidation.runningBalance)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{splitValidation.message}</p>
      </div>
    </div>
  )
}

function ReceiptView({
  saleDraft,
  paymentMethod,
  splitPayments,
  mpesaReference,
  bankReference,
  executionStatusLabel,
  onNewSale,
}: {
  saleDraft: CashierSaleDraft
  paymentMethod: CashierPaymentMethod
  splitPayments: CashierSplitPaymentDraft[]
  mpesaReference: string
  bankReference: string
  executionStatusLabel: string
  onNewSale: () => void
}) {
  const total = calculateSaleTotal(saleDraft.clients)

  return (
    <>
      <SectionHeader
        eyebrow="Receipt"
        title={saleDraft.saleNumber}
        description="Payment complete."
        actions={
          <>
            <Button type="button" variant="outline">
              <Printer className="size-4" aria-hidden="true" />
              Print Receipt
            </Button>
            <Button type="button" variant="outline">
              <FileDown className="size-4" aria-hidden="true" />
              Save Receipt
            </Button>
            <Button type="button" onClick={onNewSale}>
              <Plus className="size-4" aria-hidden="true" />
              New Sale
            </Button>
          </>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SaleReviewCard saleDraft={saleDraft} clientTotals={calculateClientTotals(saleDraft.clients)} total={total} />
        <Card>
          <CardHeader>
            <CardTitle>Payment Breakdown</CardTitle>
            <CardDescription>
              {getPaymentMethodLabel(paymentMethod)} - {executionStatusLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {paymentMethod === 'Mixed' ? (
              splitPayments.map((payment) => (
                <SummaryPill
                  key={payment.id}
                  label={`${getPaymentMethodLabel(payment.method)}${payment.reference ? ` - ${payment.reference}` : ''}`}
                  value={formatMoney(payment.amount)}
                />
              ))
            ) : (
              <SummaryPill
                label={
                  paymentMethod === 'Mpesa'
                    ? `M-Pesa - ${mpesaReference}`
                    : paymentMethod === 'Bank'
                      ? `Bank - ${bankReference}`
                      : 'Cash'
                }
                value={formatMoney(total)}
              />
            )}
            <div className="flex items-center justify-between border-t pt-3 text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatMoney(total)}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}

function getServiceName(serviceId: string) {
  return cashierServiceCatalog.find((service) => service.id === serviceId)?.name ?? 'Unknown service'
}

function getWorkerName(workerId: string) {
  return cashierWorkers.find((worker) => worker.id === workerId)?.name ?? 'Unassigned worker'
}
