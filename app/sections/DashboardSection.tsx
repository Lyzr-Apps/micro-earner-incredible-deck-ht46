'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RiSearchLine, RiPlayLine, RiRefreshLine, RiTimeLine, RiArrowRightLine } from 'react-icons/ri'

interface Opportunity {
  id: string
  platform: string
  task_name: string
  task_type: string
  payout: number
  time_estimate_minutes: number
  difficulty: string
  description: string
  rank_score: number
  status: string
}

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

interface EarningsSummary {
  total_earned: number
  earned_this_week: number
  earned_this_month: number
  total_pending: number
  total_failed: number
  last_sync: string
}

interface ActivityEntry {
  id: string
  timestamp: string
  agent: string
  action: string
  detail: string
  status: 'success' | 'error' | 'info'
}

interface DashboardProps {
  opportunities: Opportunity[]
  taskResults: TaskResult[]
  earningsSummary: EarningsSummary | null
  activityLog: ActivityEntry[]
  loading: { scout: boolean; executor: boolean; earnings: boolean }
  onScanOpportunities: () => void
  onExecuteTasks: () => void
  onSyncEarnings: () => void
  onNavigate: (tab: string) => void
}

function difficultyColor(d: string) {
  const dl = (d ?? '').toLowerCase()
  if (dl === 'easy') return 'bg-green-100 text-green-700 border-green-200'
  if (dl === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (dl === 'hard') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-muted text-muted-foreground'
}

function statusDot(s: string) {
  const sl = (s ?? '').toLowerCase()
  if (sl === 'completed' || sl === 'paid' || sl === 'success') return 'bg-green-500'
  if (sl === 'pending' || sl === 'processing') return 'bg-amber-500'
  if (sl === 'failed') return 'bg-red-500'
  return 'bg-blue-500'
}

export default function DashboardSection({
  opportunities, taskResults, earningsSummary, activityLog,
  loading, onScanOpportunities, onExecuteTasks, onSyncEarnings, onNavigate
}: DashboardProps) {
  const totalEarned = earningsSummary?.total_earned ?? 0
  const totalPending = earningsSummary?.total_pending ?? 0
  const completedToday = Array.isArray(taskResults) ? taskResults.filter(t => (t?.status ?? '').toLowerCase() === 'completed').length : 0
  const activeOpps = Array.isArray(opportunities) ? opportunities.length : 0

  const topOpps = Array.isArray(opportunities) ? opportunities.slice(0, 5) : []
  const recentActivity = Array.isArray(activityLog) ? activityLog.slice(0, 8) : []

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground">Your command center for micro-task earnings</p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" onClick={onScanOpportunities} disabled={loading.scout} className="h-7 text-xs rounded-sm">
            {loading.scout ? <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" /> : <RiSearchLine className="w-3 h-3 mr-1" />}
            Scan
          </Button>
          <Button size="sm" variant="secondary" onClick={onExecuteTasks} disabled={loading.executor} className="h-7 text-xs rounded-sm">
            {loading.executor ? <span className="inline-block w-3 h-3 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-1" /> : <RiPlayLine className="w-3 h-3 mr-1" />}
            Execute
          </Button>
          <Button size="sm" variant="outline" onClick={onSyncEarnings} disabled={loading.earnings} className="h-7 text-xs rounded-sm">
            {loading.earnings ? <span className="inline-block w-3 h-3 border-2 border-foreground border-t-transparent rounded-full animate-spin mr-1" /> : <RiRefreshLine className="w-3 h-3 mr-1" />}
            Sync
          </Button>
        </div>
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
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Pending Payout</p>
            <p className="text-xl font-bold text-amber-600">${totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border border-border rounded-sm">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Tasks Completed</p>
            <p className="text-xl font-bold text-foreground">{completedToday}</p>
          </CardContent>
        </Card>
        <Card className="border border-border rounded-sm">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Active Opportunities</p>
            <p className="text-xl font-bold text-primary">{activeOpps}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <Card className="border border-border rounded-sm">
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Opportunities</CardTitle>
              <button onClick={() => onNavigate('opportunities')} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                View all <RiArrowRightLine className="w-2.5 h-2.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            {topOpps.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <p>No opportunities scanned yet.</p>
                <p className="mt-1">Click "Scan" to discover tasks.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {topOpps.map((opp) => (
                  <div key={opp?.id ?? Math.random().toString()} className="flex items-center justify-between p-2 bg-muted/40 rounded-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{opp?.task_name ?? 'Unknown'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{opp?.platform ?? '-'}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><RiTimeLine className="w-2.5 h-2.5" />{opp?.time_estimate_minutes ?? 0}m</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 rounded-sm border ${difficultyColor(opp?.difficulty ?? '')}`}>{opp?.difficulty ?? '-'}</Badge>
                      <span className="text-xs font-bold text-green-600">${(opp?.payout ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border rounded-sm">
          <CardHeader className="p-3 pb-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Activity Feed</CardTitle>
              <button onClick={() => onNavigate('activity')} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                View all <RiArrowRightLine className="w-2.5 h-2.5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-1">
            {recentActivity.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                <p>No activity yet.</p>
                <p className="mt-1">Agent actions will appear here.</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-1">
                  {recentActivity.map((entry) => (
                    <div key={entry?.id ?? Math.random().toString()} className="flex items-start gap-2 p-1.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${entry?.status === 'success' ? 'bg-green-500' : entry?.status === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate"><span className="font-medium">{entry?.agent ?? '-'}</span> - {entry?.action ?? '-'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{entry?.detail ?? ''}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{entry?.timestamp ?? ''}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
