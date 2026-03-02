'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiSearchLine, RiPlayLine, RiRefreshLine, RiFilterLine, RiExternalLinkLine } from 'react-icons/ri'
import { getPlatformUrl } from '@/lib/platforms'

interface Opportunity {
  id: string
  platform: string
  task_name: string
  task_type: string
  payout: number
  time_estimate_minutes: number
  difficulty: string
  description: string
  task_url: string
  signup_url: string
  payment_methods: string
  rank_score: number
  status: string
}

interface OpportunitiesProps {
  opportunities: Opportunity[]
  loading: { scout: boolean; executor: boolean }
  onScanOpportunities: () => void
  onExecuteSelected: (tasks: Opportunity[]) => void
  onExecuteAll: () => void
}

function diffBadge(d: string) {
  const dl = (d ?? '').toLowerCase()
  if (dl === 'easy') return 'bg-green-100 text-green-700 border-green-200'
  if (dl === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (dl === 'hard') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-muted text-muted-foreground'
}

function statusBadge(s: string) {
  const sl = (s ?? '').toLowerCase()
  if (sl === 'available') return 'bg-blue-100 text-blue-700 border-blue-200'
  if (sl === 'completed') return 'bg-green-100 text-green-700 border-green-200'
  if (sl === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-muted text-muted-foreground'
}

export default function OpportunitiesSection({
  opportunities, loading, onScanOpportunities, onExecuteSelected, onExecuteAll
}: OpportunitiesProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [platformFilter, setPlatformFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [minPayout, setMinPayout] = useState('')

  const safeOpps = Array.isArray(opportunities) ? opportunities : []

  const platforms = useMemo(() => {
    const set = new Set<string>()
    safeOpps.forEach(o => { if (o?.platform) set.add(o.platform) })
    return Array.from(set)
  }, [safeOpps])

  const taskTypes = useMemo(() => {
    const set = new Set<string>()
    safeOpps.forEach(o => { if (o?.task_type) set.add(o.task_type) })
    return Array.from(set)
  }, [safeOpps])

  const filtered = useMemo(() => {
    return safeOpps.filter(o => {
      if (platformFilter && o?.platform !== platformFilter) return false
      if (typeFilter && o?.task_type !== typeFilter) return false
      if (minPayout && (o?.payout ?? 0) < parseFloat(minPayout)) return false
      return true
    })
  }, [safeOpps, platformFilter, typeFilter, minPayout])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(o => o?.id ?? '')))
    }
  }

  const handleExecuteSelected = () => {
    const selectedOpps = filtered.filter(o => selected.has(o?.id ?? ''))
    onExecuteSelected(selectedOpps)
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Opportunities</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} tasks found across {platforms.length} platforms</p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" onClick={onScanOpportunities} disabled={loading.scout} className="h-7 text-xs rounded-sm">
            {loading.scout ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" /> : <RiRefreshLine className="w-3 h-3 mr-1" />}
            Refresh
          </Button>
          <Button size="sm" variant="secondary" onClick={handleExecuteSelected} disabled={selected.size === 0 || loading.executor} className="h-7 text-xs rounded-sm">
            {loading.executor ? <span className="inline-block w-3 h-3 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-1" /> : <RiPlayLine className="w-3 h-3 mr-1" />}
            Execute Selected ({selected.size})
          </Button>
          <Button size="sm" variant="outline" onClick={onExecuteAll} disabled={filtered.length === 0 || loading.executor} className="h-7 text-xs rounded-sm">
            Execute All
          </Button>
        </div>
      </div>

      <Card className="border border-border rounded-sm">
        <CardContent className="p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <RiFilterLine className="w-3.5 h-3.5 text-muted-foreground" />
            <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)} className="h-7 text-xs bg-background border border-border rounded-sm px-2 min-w-[120px]">
              <option value="">All Platforms</option>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-7 text-xs bg-background border border-border rounded-sm px-2 min-w-[120px]">
              <option value="">All Types</option>
              {taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <Input type="number" placeholder="Min payout $" value={minPayout} onChange={e => setMinPayout(e.target.value)} className="h-7 text-xs w-28 rounded-sm" />
            {(platformFilter || typeFilter || minPayout) && (
              <button onClick={() => { setPlatformFilter(''); setTypeFilter(''); setMinPayout('') }} className="text-[10px] text-primary hover:underline">Clear</button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border rounded-sm">
        <ScrollArea className="h-[calc(100vh-260px)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-2 text-left w-8">
                    <Checkbox checked={filtered.length > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} className="rounded-sm" />
                  </th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Platform</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Task Name</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="p-2 text-right font-medium text-muted-foreground">Payout</th>
                  <th className="p-2 text-right font-medium text-muted-foreground">Time (min)</th>
                  <th className="p-2 text-center font-medium text-muted-foreground">Difficulty</th>
                  <th className="p-2 text-center font-medium text-muted-foreground">Score</th>
                  <th className="p-2 text-center font-medium text-muted-foreground">Status</th>
                  <th className="p-2 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      {safeOpps.length === 0 ? 'No opportunities scanned yet. Click "Refresh" to scan.' : 'No tasks match your filters.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((opp) => (
                    <tr key={opp?.id ?? ''} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-2">
                        <Checkbox checked={selected.has(opp?.id ?? '')} onCheckedChange={() => toggleSelect(opp?.id ?? '')} className="rounded-sm" />
                      </td>
                      <td className="p-2 font-medium">
                        {(() => {
                          const url = getPlatformUrl(opp?.platform ?? '')
                          return url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                              {opp?.platform ?? '-'}<RiExternalLinkLine className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span>{opp?.platform ?? '-'}</span>
                          )
                        })()}
                      </td>
                      <td className="p-2 max-w-[200px]">
                        {opp?.task_url ? (
                          <a href={opp.task_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate inline-flex items-center gap-0.5">
                            {opp?.task_name ?? '-'}<RiExternalLinkLine className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        ) : (
                          <p className="font-medium truncate">{opp?.task_name ?? '-'}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground truncate">{opp?.description ?? ''}</p>
                        {opp?.payment_methods && (
                          <p className="text-[9px] text-foreground/60 truncate">Pay: {opp.payment_methods}</p>
                        )}
                      </td>
                      <td className="p-2 capitalize">{opp?.task_type ?? '-'}</td>
                      <td className="p-2 text-right font-bold text-green-600">${(opp?.payout ?? 0).toFixed(2)}</td>
                      <td className="p-2 text-right">{opp?.time_estimate_minutes ?? 0}</td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm border ${diffBadge(opp?.difficulty ?? '')}`}>{opp?.difficulty ?? '-'}</Badge>
                      </td>
                      <td className="p-2 text-center">{opp?.rank_score ?? 0}</td>
                      <td className="p-2 text-center">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm border ${statusBadge(opp?.status ?? '')}`}>{opp?.status ?? '-'}</Badge>
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex flex-col gap-0.5 items-center">
                          {opp?.task_url && (
                            <a href={opp.task_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-primary hover:underline font-medium">
                              Go to Task <RiExternalLinkLine className="w-2.5 h-2.5" />
                            </a>
                          )}
                          {opp?.signup_url && (
                            <a href={opp.signup_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-accent hover:underline">
                              Sign Up <RiExternalLinkLine className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </Card>
    </div>
  )
}
