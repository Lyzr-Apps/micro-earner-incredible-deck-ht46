'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiSearchLine, RiFilterLine, RiRefreshLine, RiArrowDownSLine, RiArrowUpSLine, RiExternalLinkLine } from 'react-icons/ri'
import { getPlatformUrl } from '@/lib/platforms'

interface TaskResult {
  task_id: string
  task_name: string
  platform: string
  status: string
  time_taken_minutes: number
  payout: number
  error_message: string
  retryable: boolean
  completed_at: string
}

interface ActivityEntry {
  id: string
  timestamp: string
  agent: string
  action: string
  detail: string
  status: 'success' | 'error' | 'info'
}

interface ActivityLogProps {
  taskResults: TaskResult[]
  activityLog: ActivityEntry[]
  loading: boolean
  onRetryTask: (task: TaskResult) => void
}

function statusBadge(s: string) {
  const sl = (s ?? '').toLowerCase()
  if (sl === 'completed') return 'bg-green-100 text-green-700 border-green-200'
  if (sl === 'pending' || sl === 'processing') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (sl === 'failed') return 'bg-red-100 text-red-700 border-red-200'
  if (sl === 'skipped') return 'bg-muted text-muted-foreground'
  return 'bg-blue-100 text-blue-700 border-blue-200'
}

export default function ActivityLogSection({
  taskResults, activityLog, loading, onRetryTask
}: ActivityLogProps) {
  const [search, setSearch] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const safeResults = Array.isArray(taskResults) ? taskResults : []
  const safeActivity = Array.isArray(activityLog) ? activityLog : []

  const agents = useMemo(() => {
    const set = new Set<string>()
    safeActivity.forEach(a => { if (a?.agent) set.add(a.agent) })
    return Array.from(set)
  }, [safeActivity])

  const combinedEntries = useMemo(() => {
    const entries: Array<{
      id: string; timestamp: string; agent: string; platform: string;
      task: string; action: string; result: string; payout: number;
      status: string; errorMsg: string; retryable: boolean; raw?: TaskResult
    }> = []

    safeResults.forEach((tr) => {
      entries.push({
        id: tr?.task_id ?? Math.random().toString(),
        timestamp: tr?.completed_at ?? '',
        agent: 'Task Executor',
        platform: tr?.platform ?? '-',
        task: tr?.task_name ?? '-',
        action: 'Execute Task',
        result: tr?.status ?? '-',
        payout: tr?.payout ?? 0,
        status: tr?.status ?? '',
        errorMsg: tr?.error_message ?? '',
        retryable: tr?.retryable ?? false,
        raw: tr,
      })
    })

    safeActivity.forEach((a) => {
      entries.push({
        id: a?.id ?? Math.random().toString(),
        timestamp: a?.timestamp ?? '',
        agent: a?.agent ?? '-',
        platform: '-',
        task: a?.action ?? '-',
        action: a?.action ?? '-',
        result: a?.status ?? '',
        payout: 0,
        status: a?.status ?? '',
        errorMsg: a?.detail ?? '',
        retryable: false,
      })
    })

    return entries
  }, [safeResults, safeActivity])

  const filtered = useMemo(() => {
    return combinedEntries.filter(e => {
      if (search) {
        const s = search.toLowerCase()
        if (!(e.task.toLowerCase().includes(s) || e.platform.toLowerCase().includes(s) || e.agent.toLowerCase().includes(s))) return false
      }
      if (agentFilter && e.agent !== agentFilter) return false
      if (statusFilter && e.status.toLowerCase() !== statusFilter.toLowerCase()) return false
      return true
    })
  }, [combinedEntries, search, agentFilter, statusFilter])

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Activity Log</h1>
          <p className="text-xs text-muted-foreground">{filtered.length} entries</p>
        </div>
      </div>

      <Card className="border border-border rounded-sm">
        <CardContent className="p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <RiSearchLine className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks, platforms..." className="h-7 text-xs pl-7 rounded-sm" />
            </div>
            <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="h-7 text-xs bg-background border border-border rounded-sm px-2 min-w-[120px]">
              <option value="">All Agents</option>
              <option value="Opportunity Scout">Opportunity Scout</option>
              <option value="Task Executor">Task Executor</option>
              <option value="Earnings Tracker">Earnings Tracker</option>
              {agents.filter(a => !['Opportunity Scout', 'Task Executor', 'Earnings Tracker'].includes(a)).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 text-xs bg-background border border-border rounded-sm px-2 min-w-[100px]">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="skipped">Skipped</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
            {(search || agentFilter || statusFilter) && (
              <button onClick={() => { setSearch(''); setAgentFilter(''); setStatusFilter('') }} className="text-[10px] text-primary hover:underline">Clear</button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border rounded-sm">
        <ScrollArea className="h-[calc(100vh-240px)]">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="p-2 text-left font-medium text-muted-foreground w-6"></th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Timestamp</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Agent</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Platform</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Task</th>
                  <th className="p-2 text-left font-medium text-muted-foreground">Action</th>
                  <th className="p-2 text-center font-medium text-muted-foreground">Result</th>
                  <th className="p-2 text-right font-medium text-muted-foreground">Payout</th>
                  <th className="p-2 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No activity recorded yet. Execute tasks to see results here.
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <tr className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}>
                        <td className="p-2">
                          {expandedRow === entry.id ? <RiArrowUpSLine className="w-3 h-3" /> : <RiArrowDownSLine className="w-3 h-3" />}
                        </td>
                        <td className="p-2 whitespace-nowrap">{entry.timestamp || '-'}</td>
                        <td className="p-2 font-medium">{entry.agent}</td>
                        <td className="p-2">
                          {(() => {
                            const url = getPlatformUrl(entry.platform)
                            return url ? (
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                                {entry.platform}<RiExternalLinkLine className="w-2.5 h-2.5" />
                              </a>
                            ) : (
                              <span>{entry.platform}</span>
                            )
                          })()}
                        </td>
                        <td className="p-2 max-w-[180px] truncate">{entry.task}</td>
                        <td className="p-2">{entry.action}</td>
                        <td className="p-2 text-center">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm border ${statusBadge(entry.result)}`}>{entry.result || '-'}</Badge>
                        </td>
                        <td className="p-2 text-right font-medium">{entry.payout > 0 ? `$${entry.payout.toFixed(2)}` : '-'}</td>
                        <td className="p-2 text-center">
                          {entry.retryable && entry.status.toLowerCase() === 'failed' && entry.raw && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onRetryTask(entry.raw!) }} disabled={loading} className="h-5 text-[10px] px-1.5 rounded-sm">
                              <RiRefreshLine className="w-2.5 h-2.5 mr-0.5" />Retry
                            </Button>
                          )}
                        </td>
                      </tr>
                      {expandedRow === entry.id && (
                        <tr className="bg-muted/10">
                          <td colSpan={9} className="p-3">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div><span className="text-muted-foreground">Agent:</span> <span className="font-medium">{entry.agent}</span></div>
                              <div><span className="text-muted-foreground">Platform:</span> {(() => {
                                const url = getPlatformUrl(entry.platform)
                                return url ? (
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline inline-flex items-center gap-0.5">
                                    {entry.platform}<RiExternalLinkLine className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="font-medium">{entry.platform}</span>
                                )
                              })()}</div>
                              <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{entry.result}</span></div>
                              <div><span className="text-muted-foreground">Payout:</span> <span className="font-medium">${entry.payout.toFixed(2)}</span></div>
                              {entry.errorMsg && (
                                <div className="col-span-2"><span className="text-muted-foreground">Details:</span> <span className="text-red-600">{entry.errorMsg}</span></div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
