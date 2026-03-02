'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiRefreshLine, RiAlertLine, RiExternalLinkLine } from 'react-icons/ri'
import { getPlatformUrl } from '@/lib/platforms'

interface EarningsSummary {
  total_earned: number
  earned_this_week: number
  earned_this_month: number
  total_pending: number
  total_failed: number
  last_sync: string
}

interface PaymentEntry {
  transaction_id: string
  platform: string
  task_name: string
  amount: number
  status: string
  date: string
  discrepancy_note: string
  payment_setup_url: string
}

interface DailyTrend {
  date: string
  amount: number
}

interface Discrepancy {
  task_id: string
  platform: string
  issue: string
  expected_amount: number
  actual_amount: number
}

interface EarningsProps {
  earningsSummary: EarningsSummary | null
  paymentLedger: PaymentEntry[]
  dailyTrend: DailyTrend[]
  discrepancies: Discrepancy[]
  loading: boolean
  onSyncEarnings: () => void
}

function paymentStatusBadge(s: string) {
  const sl = (s ?? '').toLowerCase()
  if (sl === 'paid' || sl === 'completed') return 'bg-green-100 text-green-700 border-green-200'
  if (sl === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (sl === 'failed') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-muted text-muted-foreground'
}

export default function EarningsSection({
  earningsSummary, paymentLedger, dailyTrend, discrepancies, loading, onSyncEarnings
}: EarningsProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d')

  const safeLedger = Array.isArray(paymentLedger) ? paymentLedger : []
  const safeTrend = Array.isArray(dailyTrend) ? dailyTrend : []
  const safeDiscrepancies = Array.isArray(discrepancies) ? discrepancies : []

  const filteredTrend = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
    return safeTrend.slice(-days)
  }, [safeTrend, period])

  const maxAmount = useMemo(() => {
    if (filteredTrend.length === 0) return 1
    return Math.max(...filteredTrend.map(d => d?.amount ?? 0), 1)
  }, [filteredTrend])

  const totalEarned = earningsSummary?.total_earned ?? 0
  const thisWeek = earningsSummary?.earned_this_week ?? 0
  const thisMonth = earningsSummary?.earned_this_month ?? 0
  const pending = earningsSummary?.total_pending ?? 0
  const lastSync = earningsSummary?.last_sync ?? 'Never'

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Earnings</h1>
          <p className="text-xs text-muted-foreground">Last synced: {lastSync}</p>
        </div>
        <Button size="sm" onClick={onSyncEarnings} disabled={loading} className="h-7 text-xs rounded-sm">
          {loading ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" /> : <RiRefreshLine className="w-3 h-3 mr-1" />}
          Sync Earnings
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="border border-border rounded-sm">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Earned</p>
            <p className="text-xl font-bold text-foreground">${totalEarned.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border rounded-sm">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">This Week</p>
            <p className="text-xl font-bold text-primary">${thisWeek.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border rounded-sm">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">This Month</p>
            <p className="text-xl font-bold text-foreground">${thisMonth.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border rounded-sm">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Pending</p>
            <p className="text-xl font-bold text-amber-600">${pending.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border rounded-sm">
        <CardHeader className="p-3 pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Daily Earnings Trend</CardTitle>
            <div className="flex gap-0.5">
              {(['7d', '30d', '90d'] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-2 py-0.5 text-[10px] rounded-sm transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{p}</button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          {filteredTrend.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">No trend data yet. Sync earnings to populate.</div>
          ) : (
            <div className="flex items-end gap-1 h-[120px]">
              {filteredTrend.map((d, i) => {
                const h = ((d?.amount ?? 0) / maxAmount) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      ${(d?.amount ?? 0).toFixed(2)}
                    </div>
                    <div className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary" style={{ height: `${Math.max(h, 2)}%` }} />
                    {filteredTrend.length <= 14 && (
                      <span className="text-[8px] text-muted-foreground truncate w-full text-center">{(d?.date ?? '').slice(-5)}</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2">
          <Card className="border border-border rounded-sm">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm font-semibold">Payment Ledger</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[240px]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="p-2 text-left font-medium text-muted-foreground">Date</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Platform</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">Task</th>
                      <th className="p-2 text-right font-medium text-muted-foreground">Amount</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Status</th>
                      <th className="p-2 text-left font-medium text-muted-foreground">TX ID</th>
                      <th className="p-2 text-center font-medium text-muted-foreground">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeLedger.length === 0 ? (
                      <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No payment records yet.</td></tr>
                    ) : (
                      safeLedger.map((p, i) => (
                        <tr key={p?.transaction_id ?? i} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-2 whitespace-nowrap">{p?.date ?? '-'}</td>
                          <td className="p-2">
                            {(() => {
                              const url = getPlatformUrl(p?.platform ?? '')
                              return url ? (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                                  {p?.platform ?? '-'}<RiExternalLinkLine className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span>{p?.platform ?? '-'}</span>
                              )
                            })()}
                          </td>
                          <td className="p-2 max-w-[140px] truncate">{p?.task_name ?? '-'}</td>
                          <td className="p-2 text-right font-bold">${(p?.amount ?? 0).toFixed(2)}</td>
                          <td className="p-2 text-center">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm border ${paymentStatusBadge(p?.status ?? '')}`}>{p?.status ?? '-'}</Badge>
                          </td>
                          <td className="p-2 text-[10px] text-muted-foreground font-mono truncate max-w-[80px]">{p?.transaction_id ?? '-'}</td>
                          <td className="p-2 text-center">
                            {p?.payment_setup_url ? (
                              <a href={p.payment_setup_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5">
                                Setup <RiExternalLinkLine className="w-2.5 h-2.5" />
                              </a>
                            ) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border rounded-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-1">
              <RiAlertLine className="w-3.5 h-3.5 text-amber-500" /> Discrepancies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            <ScrollArea className="h-[200px]">
              {safeDiscrepancies.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">No discrepancies found.</div>
              ) : (
                <div className="space-y-2">
                  {safeDiscrepancies.map((d, i) => (
                    <div key={d?.task_id ?? i} className="p-2 bg-amber-50 border border-amber-200 rounded-sm text-xs">
                      <div className="flex justify-between items-start">
                        {(() => {
                          const url = getPlatformUrl(d?.platform ?? '')
                          return url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline inline-flex items-center gap-0.5">
                              {d?.platform ?? '-'}<RiExternalLinkLine className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="font-medium">{d?.platform ?? '-'}</span>
                          )
                        })()}
                        <span className="text-[10px] text-muted-foreground">{d?.task_id ?? ''}</span>
                      </div>
                      <p className="text-[11px] mt-0.5">{d?.issue ?? '-'}</p>
                      <div className="flex gap-2 mt-1 text-[10px]">
                        <span>Expected: <strong>${(d?.expected_amount ?? 0).toFixed(2)}</strong></span>
                        <span>Actual: <strong className="text-red-600">${(d?.actual_amount ?? 0).toFixed(2)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
