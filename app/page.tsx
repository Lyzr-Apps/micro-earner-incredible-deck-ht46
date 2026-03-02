'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Switch } from '@/components/ui/switch'
import { RiDashboardLine, RiSearchLine, RiHistoryLine, RiMoneyDollarCircleLine, RiSettingsLine, RiRocketLine } from 'react-icons/ri'

import DashboardSection from './sections/DashboardSection'
import OpportunitiesSection from './sections/OpportunitiesSection'
import ActivityLogSection from './sections/ActivityLogSection'
import EarningsSection from './sections/EarningsSection'
import SettingsSection from './sections/SettingsSection'

// --- Agent IDs ---
const SCOUT_ID = '69a4dfcb5a09117b82f54aed'
const EXECUTOR_ID = '69a4dfcbc7ef7478ccec293a'
const EARNINGS_ID = '69a4dfcc7f49e79a462d582a'

// --- Interfaces ---
interface Opportunity {
  id: string; platform: string; task_name: string; task_type: string
  payout: number; time_estimate_minutes: number; difficulty: string
  description: string; rank_score: number; status: string
}

interface TaskResult {
  task_id: string; task_name: string; platform: string; status: string
  time_taken_minutes: number; payout: number; error_message: string
  retryable: boolean; completed_at: string
}

interface EarningsSummary {
  total_earned: number; earned_this_week: number; earned_this_month: number
  total_pending: number; total_failed: number; last_sync: string
}

interface PaymentEntry {
  transaction_id: string; platform: string; task_name: string
  amount: number; status: string; date: string; discrepancy_note: string
}

interface DailyTrend { date: string; amount: number }

interface Discrepancy {
  task_id: string; platform: string; issue: string
  expected_amount: number; actual_amount: number
}

interface ActivityEntry {
  id: string; timestamp: string; agent: string
  action: string; detail: string; status: 'success' | 'error' | 'info'
}

interface GigSettings {
  platforms: Record<string, { apiKey: string; connected: boolean }>
  categories: { surveys: boolean; dataEntry: boolean; clicks: boolean }
  minPayout: number; maxTimePerTask: number; dailyTaskLimit: number
}

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-sm text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Sample Data ---
const SAMPLE_OPPORTUNITIES: Opportunity[] = [
  { id: 'opp-1', platform: 'Amazon MTurk', task_name: 'Product Image Categorization', task_type: 'data entry', payout: 1.25, time_estimate_minutes: 8, difficulty: 'easy', description: 'Categorize product images into correct departments', rank_score: 92, status: 'available' },
  { id: 'opp-2', platform: 'Prolific', task_name: 'Consumer Behavior Survey', task_type: 'survey', payout: 3.50, time_estimate_minutes: 15, difficulty: 'medium', description: 'Complete a 15-minute survey about shopping habits', rank_score: 88, status: 'available' },
  { id: 'opp-3', platform: 'Clickworker', task_name: 'Website Usability Test', task_type: 'survey', payout: 5.00, time_estimate_minutes: 20, difficulty: 'medium', description: 'Test and rate website usability across 5 pages', rank_score: 85, status: 'available' },
  { id: 'opp-4', platform: 'Swagbucks', task_name: 'Video Ad Verification', task_type: 'click', payout: 0.50, time_estimate_minutes: 3, difficulty: 'easy', description: 'Watch and verify video advertisements', rank_score: 78, status: 'available' },
  { id: 'opp-5', platform: 'Appen', task_name: 'Audio Transcription Batch', task_type: 'data entry', payout: 4.75, time_estimate_minutes: 25, difficulty: 'hard', description: 'Transcribe short audio clips with timestamps', rank_score: 82, status: 'available' },
]

const SAMPLE_TASK_RESULTS: TaskResult[] = [
  { task_id: 'tr-1', task_name: 'Product Image Categorization', platform: 'Amazon MTurk', status: 'completed', time_taken_minutes: 6, payout: 1.25, error_message: '', retryable: false, completed_at: '2026-03-02 10:15' },
  { task_id: 'tr-2', task_name: 'Consumer Behavior Survey', platform: 'Prolific', status: 'completed', time_taken_minutes: 14, payout: 3.50, error_message: '', retryable: false, completed_at: '2026-03-02 10:35' },
  { task_id: 'tr-3', task_name: 'Website Usability Test', platform: 'Clickworker', status: 'failed', time_taken_minutes: 5, payout: 0, error_message: 'Session expired before completion', retryable: true, completed_at: '2026-03-02 10:45' },
]

const SAMPLE_EARNINGS: EarningsSummary = { total_earned: 127.50, earned_this_week: 34.75, earned_this_month: 89.25, total_pending: 12.50, total_failed: 3.00, last_sync: '2026-03-02 11:00' }

const SAMPLE_LEDGER: PaymentEntry[] = [
  { transaction_id: 'tx-001', platform: 'Amazon MTurk', task_name: 'Image Categorization', amount: 1.25, status: 'paid', date: '2026-03-02', discrepancy_note: '' },
  { transaction_id: 'tx-002', platform: 'Prolific', task_name: 'Behavior Survey', amount: 3.50, status: 'paid', date: '2026-03-02', discrepancy_note: '' },
  { transaction_id: 'tx-003', platform: 'Clickworker', task_name: 'Usability Test', amount: 5.00, status: 'pending', date: '2026-03-01', discrepancy_note: '' },
  { transaction_id: 'tx-004', platform: 'Swagbucks', task_name: 'Video Ads Batch', amount: 2.00, status: 'paid', date: '2026-02-28', discrepancy_note: '' },
]

const SAMPLE_TREND: DailyTrend[] = [
  { date: '2026-02-24', amount: 8.50 }, { date: '2026-02-25', amount: 12.25 },
  { date: '2026-02-26', amount: 5.75 }, { date: '2026-02-27', amount: 15.00 },
  { date: '2026-02-28', amount: 9.50 }, { date: '2026-03-01', amount: 18.75 },
  { date: '2026-03-02', amount: 4.75 },
]

const SAMPLE_DISCREPANCIES: Discrepancy[] = [
  { task_id: 'disc-1', platform: 'Clickworker', issue: 'Payment less than agreed rate', expected_amount: 5.00, actual_amount: 3.75 },
]

const DEFAULT_SETTINGS: GigSettings = {
  platforms: {
    'Amazon MTurk': { apiKey: '', connected: false },
    'Clickworker': { apiKey: '', connected: false },
    'Swagbucks': { apiKey: '', connected: false },
    'Prolific': { apiKey: '', connected: false },
    'Appen': { apiKey: '', connected: false },
  },
  categories: { surveys: true, dataEntry: true, clicks: true },
  minPayout: 0.5, maxTimePerTask: 30, dailyTaskLimit: 20,
}

// --- Nav Items ---
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: RiDashboardLine },
  { id: 'opportunities', label: 'Opportunities', icon: RiSearchLine },
  { id: 'activity', label: 'Activity Log', icon: RiHistoryLine },
  { id: 'earnings', label: 'Earnings', icon: RiMoneyDollarCircleLine },
  { id: 'settings', label: 'Settings', icon: RiSettingsLine },
]

const AGENTS = [
  { id: SCOUT_ID, name: 'Opportunity Scout', purpose: 'Scans platforms for tasks' },
  { id: EXECUTOR_ID, name: 'Task Executor', purpose: 'Autonomously completes tasks' },
  { id: EARNINGS_ID, name: 'Earnings Tracker', purpose: 'Reconciles payments' },
]

// --- Page ---
export default function Page() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sampleMode, setSampleMode] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [taskResults, setTaskResults] = useState<TaskResult[]>([])
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary | null>(null)
  const [paymentLedger, setPaymentLedger] = useState<PaymentEntry[]>([])
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([])
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([])
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])
  const [settings, setSettings] = useState<GigSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState({ scout: false, executor: false, earnings: false })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gigpilot-settings')
      if (saved) setSettings(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (sampleMode) {
      setOpportunities(SAMPLE_OPPORTUNITIES)
      setTaskResults(SAMPLE_TASK_RESULTS)
      setEarningsSummary(SAMPLE_EARNINGS)
      setPaymentLedger(SAMPLE_LEDGER)
      setDailyTrend(SAMPLE_TREND)
      setDiscrepancies(SAMPLE_DISCREPANCIES)
      setActivityLog([
        { id: 'a1', timestamp: '10:00', agent: 'Opportunity Scout', action: 'Scan completed', detail: 'Found 5 tasks across 5 platforms', status: 'success' },
        { id: 'a2', timestamp: '10:15', agent: 'Task Executor', action: 'Task completed', detail: 'Product Image Categorization - $1.25', status: 'success' },
        { id: 'a3', timestamp: '10:35', agent: 'Task Executor', action: 'Task completed', detail: 'Consumer Behavior Survey - $3.50', status: 'success' },
        { id: 'a4', timestamp: '10:45', agent: 'Task Executor', action: 'Task failed', detail: 'Website Usability Test - Session expired', status: 'error' },
        { id: 'a5', timestamp: '11:00', agent: 'Earnings Tracker', action: 'Sync completed', detail: 'Reconciled 4 payments, 1 discrepancy', status: 'info' },
      ])
    } else {
      setOpportunities([])
      setTaskResults([])
      setEarningsSummary(null)
      setPaymentLedger([])
      setDailyTrend([])
      setDiscrepancies([])
      setActivityLog([])
    }
  }, [sampleMode])

  const addActivity = useCallback((agent: string, action: string, detail: string, status: 'success' | 'error' | 'info') => {
    const now = new Date()
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    setActivityLog(prev => [{ id: Date.now().toString(), timestamp: ts, agent, action, detail, status }, ...prev])
  }, [])

  const handleScanOpportunities = useCallback(async () => {
    setLoading(prev => ({ ...prev, scout: true }))
    setActiveAgentId(SCOUT_ID)
    setStatusMsg('Scanning for opportunities...')
    addActivity('Opportunity Scout', 'Scan started', 'Scanning platforms for available tasks', 'info')
    try {
      const prefs = { categories: settings.categories, minPayout: settings.minPayout, maxTime: settings.maxTimePerTask }
      const result = await callAIAgent(`Scan for available micro-tasks matching these preferences: ${JSON.stringify(prefs)}`, SCOUT_ID)
      if (result.success) {
        const data = result?.response?.result
        const opps = Array.isArray(data?.opportunities) ? data.opportunities : []
        setOpportunities(opps)
        const count = data?.summary?.total_found ?? opps.length
        addActivity('Opportunity Scout', 'Scan completed', `Found ${count} tasks across ${data?.summary?.platforms_scanned ?? 0} platforms`, 'success')
        setStatusMsg(`Found ${count} opportunities`)
      } else {
        addActivity('Opportunity Scout', 'Scan failed', result?.error ?? 'Unknown error', 'error')
        setStatusMsg('Scan failed')
      }
    } catch (e) {
      addActivity('Opportunity Scout', 'Scan error', String(e), 'error')
      setStatusMsg('Scan error')
    }
    setLoading(prev => ({ ...prev, scout: false }))
    setActiveAgentId(null)
    setTimeout(() => setStatusMsg(''), 4000)
  }, [settings, addActivity])

  const handleExecuteTasks = useCallback(async (tasks?: Opportunity[]) => {
    const toExecute = tasks ?? opportunities
    if (!Array.isArray(toExecute) || toExecute.length === 0) {
      setStatusMsg('No tasks to execute')
      setTimeout(() => setStatusMsg(''), 3000)
      return
    }
    setLoading(prev => ({ ...prev, executor: true }))
    setActiveAgentId(EXECUTOR_ID)
    setStatusMsg('Executing tasks...')
    addActivity('Task Executor', 'Execution started', `Processing ${toExecute.length} tasks`, 'info')
    try {
      const taskList = toExecute.map(t => ({ id: t?.id, name: t?.task_name, platform: t?.platform, type: t?.task_type }))
      const result = await callAIAgent(`Execute these tasks: ${JSON.stringify(taskList)}`, EXECUTOR_ID)
      if (result.success) {
        const data = result?.response?.result
        const results = Array.isArray(data?.task_results) ? data.task_results : []
        setTaskResults(prev => [...results, ...prev])
        const completed = data?.execution_summary?.completed ?? 0
        const earned = data?.execution_summary?.estimated_earnings ?? 0
        addActivity('Task Executor', 'Execution completed', `Completed ${completed} tasks, earned $${earned.toFixed(2)}`, 'success')
        setStatusMsg(`Completed ${completed} tasks`)
      } else {
        addActivity('Task Executor', 'Execution failed', result?.error ?? 'Unknown error', 'error')
        setStatusMsg('Execution failed')
      }
    } catch (e) {
      addActivity('Task Executor', 'Execution error', String(e), 'error')
      setStatusMsg('Execution error')
    }
    setLoading(prev => ({ ...prev, executor: false }))
    setActiveAgentId(null)
    setTimeout(() => setStatusMsg(''), 4000)
  }, [opportunities, addActivity])

  const handleSyncEarnings = useCallback(async () => {
    setLoading(prev => ({ ...prev, earnings: true }))
    setActiveAgentId(EARNINGS_ID)
    setStatusMsg('Syncing earnings...')
    addActivity('Earnings Tracker', 'Sync started', 'Reconciling payments across platforms', 'info')
    try {
      const result = await callAIAgent('Sync earnings and payment statuses for all connected platforms', EARNINGS_ID)
      if (result.success) {
        const data = result?.response?.result
        if (data?.earnings_summary) setEarningsSummary(data.earnings_summary)
        if (Array.isArray(data?.payment_ledger)) setPaymentLedger(data.payment_ledger)
        if (Array.isArray(data?.daily_trend)) setDailyTrend(data.daily_trend)
        if (Array.isArray(data?.discrepancies)) setDiscrepancies(data.discrepancies)
        const total = data?.earnings_summary?.total_earned ?? 0
        addActivity('Earnings Tracker', 'Sync completed', `Total earned: $${total.toFixed(2)}`, 'success')
        setStatusMsg('Earnings synced')
      } else {
        addActivity('Earnings Tracker', 'Sync failed', result?.error ?? 'Unknown error', 'error')
        setStatusMsg('Sync failed')
      }
    } catch (e) {
      addActivity('Earnings Tracker', 'Sync error', String(e), 'error')
      setStatusMsg('Sync error')
    }
    setLoading(prev => ({ ...prev, earnings: false }))
    setActiveAgentId(null)
    setTimeout(() => setStatusMsg(''), 4000)
  }, [addActivity])

  const handleRetryTask = useCallback(async (task: TaskResult) => {
    const opp: Opportunity = { id: task.task_id, platform: task.platform, task_name: task.task_name, task_type: '', payout: task.payout, time_estimate_minutes: 0, difficulty: '', description: '', rank_score: 0, status: 'available' }
    await handleExecuteTasks([opp])
  }, [handleExecuteTasks])

  const handleSaveSettings = useCallback((s: GigSettings) => {
    setSettings(s)
    try { localStorage.setItem('gigpilot-settings', JSON.stringify(s)) } catch { /* ignore */ }
  }, [])

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
        <aside className="w-[220px] flex-shrink-0 bg-[hsl(220,14%,95%)] border-r border-[hsl(220,14%,90%)] flex flex-col">
          <div className="p-3 border-b border-[hsl(220,14%,90%)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-primary flex items-center justify-center">
                <RiRocketLine className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-foreground leading-none">GigPilot</h1>
                <p className="text-[9px] text-muted-foreground">Micro-Task Agent</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-2 space-y-0.5">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-sm text-xs transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-[hsl(220,10%,90%)] hover:text-foreground'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="p-3 border-t border-[hsl(220,14%,90%)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium">Sample Data</span>
              <Switch checked={sampleMode} onCheckedChange={setSampleMode} className="scale-75" />
            </div>

            {statusMsg && (
              <p className={`text-[10px] p-1.5 rounded-sm ${statusMsg.includes('fail') || statusMsg.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {statusMsg}
              </p>
            )}

            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium">Agents</p>
              {AGENTS.map(a => (
                <div key={a.id} className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeAgentId === a.id ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                  <span className="text-[10px] text-muted-foreground truncate">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === 'dashboard' && (
            <DashboardSection
              opportunities={opportunities}
              taskResults={taskResults}
              earningsSummary={earningsSummary}
              activityLog={activityLog}
              loading={loading}
              onScanOpportunities={handleScanOpportunities}
              onExecuteTasks={() => handleExecuteTasks()}
              onSyncEarnings={handleSyncEarnings}
              onNavigate={setActiveTab}
            />
          )}
          {activeTab === 'opportunities' && (
            <OpportunitiesSection
              opportunities={opportunities}
              loading={{ scout: loading.scout, executor: loading.executor }}
              onScanOpportunities={handleScanOpportunities}
              onExecuteSelected={(tasks) => handleExecuteTasks(tasks)}
              onExecuteAll={() => handleExecuteTasks()}
            />
          )}
          {activeTab === 'activity' && (
            <ActivityLogSection
              taskResults={taskResults}
              activityLog={activityLog}
              loading={loading.executor}
              onRetryTask={handleRetryTask}
            />
          )}
          {activeTab === 'earnings' && (
            <EarningsSection
              earningsSummary={earningsSummary}
              paymentLedger={paymentLedger}
              dailyTrend={dailyTrend}
              discrepancies={discrepancies}
              loading={loading.earnings}
              onSyncEarnings={handleSyncEarnings}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsSection
              settings={settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}
