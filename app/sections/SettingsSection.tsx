'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { RiSaveLine, RiEyeLine, RiEyeOffLine, RiCheckLine, RiCloseLine, RiPlayLine, RiPauseLine, RiTimeLine } from 'react-icons/ri'
import { listSchedules, pauseSchedule, resumeSchedule, triggerScheduleNow, cronToHuman } from '@/lib/scheduler'
import type { Schedule } from '@/lib/scheduler'

const SCOUT_SCHEDULE_ID = '69a4dfd625d4d77f732fd63a'
const EARNINGS_SCHEDULE_ID = '69a4dfd625d4d77f732fd63b'

interface GigSettings {
  platforms: Record<string, { apiKey: string; connected: boolean }>
  categories: { surveys: boolean; dataEntry: boolean; clicks: boolean }
  minPayout: number
  maxTimePerTask: number
  dailyTaskLimit: number
}

interface SettingsProps {
  settings: GigSettings
  onSaveSettings: (s: GigSettings) => void
}

const PLATFORMS = ['Amazon MTurk', 'Clickworker', 'Swagbucks', 'Prolific', 'Appen']

const defaultSettings: GigSettings = {
  platforms: Object.fromEntries(PLATFORMS.map(p => [p, { apiKey: '', connected: false }])),
  categories: { surveys: true, dataEntry: true, clicks: true },
  minPayout: 0.5,
  maxTimePerTask: 30,
  dailyTaskLimit: 20,
}

export default function SettingsSection({ settings, onSaveSettings }: SettingsProps) {
  const [local, setLocal] = useState<GigSettings>(settings ?? defaultSettings)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [schedLoading, setSchedLoading] = useState(false)
  const [schedStatus, setSchedStatus] = useState('')

  const loadSchedules = useCallback(async () => {
    setSchedLoading(true)
    const res = await listSchedules()
    if (res.success) {
      setSchedules(Array.isArray(res.schedules) ? res.schedules : [])
    }
    setSchedLoading(false)
  }, [])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  const scoutSchedule = schedules.find(s => s?.id === SCOUT_SCHEDULE_ID)
  const earningsSchedule = schedules.find(s => s?.id === EARNINGS_SCHEDULE_ID)

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    setSchedLoading(true)
    setSchedStatus('')
    if (isActive) {
      await pauseSchedule(scheduleId)
    } else {
      await resumeSchedule(scheduleId)
    }
    await loadSchedules()
    setSchedStatus(isActive ? 'Schedule paused' : 'Schedule activated')
    setSchedLoading(false)
    setTimeout(() => setSchedStatus(''), 3000)
  }

  const handleTriggerNow = async (scheduleId: string) => {
    setSchedLoading(true)
    setSchedStatus('')
    const res = await triggerScheduleNow(scheduleId)
    setSchedStatus(res.success ? 'Triggered successfully' : `Trigger failed: ${res.error ?? 'Unknown error'}`)
    setSchedLoading(false)
    setTimeout(() => setSchedStatus(''), 3000)
  }

  const updatePlatform = (name: string, field: 'apiKey' | 'connected', value: string | boolean) => {
    setLocal(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [name]: { ...(prev.platforms?.[name] ?? { apiKey: '', connected: false }), [field]: value }
      }
    }))
  }

  const handleSave = () => {
    onSaveSettings(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function renderScheduleCard(label: string, schedule: Schedule | undefined, scheduleId: string) {
    const isActive = schedule?.is_active ?? false
    const cron = schedule?.cron_expression ?? ''
    const nextRun = schedule?.next_run_time ?? null

    return (
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-sm border border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold">{label}</p>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm border ${isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground'}`}>
              {isActive ? 'Active' : 'Paused'}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <RiTimeLine className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{cron ? cronToHuman(cron) : 'No schedule'}</span>
          </div>
          {nextRun && (
            <p className="text-[10px] text-muted-foreground mt-0.5">Next: {nextRun}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <Button size="sm" variant={isActive ? 'outline' : 'default'} onClick={() => handleToggleSchedule(scheduleId, isActive)} disabled={schedLoading} className="h-6 text-[10px] px-2 rounded-sm">
            {isActive ? <><RiPauseLine className="w-2.5 h-2.5 mr-0.5" />Pause</> : <><RiPlayLine className="w-2.5 h-2.5 mr-0.5" />Activate</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleTriggerNow(scheduleId)} disabled={schedLoading} className="h-6 text-[10px] px-2 rounded-sm">
            Run Now
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Configure platforms, preferences, and schedules</p>
        </div>
        <Button size="sm" onClick={handleSave} className="h-7 text-xs rounded-sm">
          {saved ? <RiCheckLine className="w-3 h-3 mr-1" /> : <RiSaveLine className="w-3 h-3 mr-1" />}
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="border border-border rounded-sm">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-semibold">Platform Connections</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-1 space-y-2">
            {PLATFORMS.map(name => {
              const p = local.platforms?.[name] ?? { apiKey: '', connected: false }
              return (
                <div key={name} className="flex items-center gap-2 p-2 bg-muted/30 rounded-sm border border-border">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type={showKeys[name] ? 'text' : 'password'}
                        placeholder="API Key"
                        value={p.apiKey}
                        onChange={e => updatePlatform(name, 'apiKey', e.target.value)}
                        className="h-6 text-[10px] flex-1 rounded-sm"
                      />
                      <button onClick={() => setShowKeys(prev => ({ ...prev, [name]: !prev[name] }))} className="p-1 text-muted-foreground hover:text-foreground">
                        {showKeys[name] ? <RiEyeOffLine className="w-3 h-3" /> : <RiEyeLine className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <Switch checked={p.connected} onCheckedChange={v => updatePlatform(name, 'connected', v)} className="scale-75" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card className="border border-border rounded-sm">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm font-semibold">Task Preferences</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1 space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Categories</Label>
                <div className="flex gap-3 mt-1.5">
                  {(['surveys', 'dataEntry', 'clicks'] as const).map(cat => (
                    <label key={cat} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Switch checked={local.categories?.[cat] ?? false} onCheckedChange={v => setLocal(prev => ({ ...prev, categories: { ...prev.categories, [cat]: v } }))} className="scale-75" />
                      <span className="capitalize">{cat === 'dataEntry' ? 'Data Entry' : cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Min Payout ($)</Label>
                  <Input type="number" step="0.1" value={local.minPayout} onChange={e => setLocal(prev => ({ ...prev, minPayout: parseFloat(e.target.value) || 0 }))} className="h-7 text-xs mt-1 rounded-sm" />
                </div>
                <div>
                  <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Max Time (min)</Label>
                  <Input type="number" value={local.maxTimePerTask} onChange={e => setLocal(prev => ({ ...prev, maxTimePerTask: parseInt(e.target.value) || 0 }))} className="h-7 text-xs mt-1 rounded-sm" />
                </div>
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Daily Task Limit: {local.dailyTaskLimit}</Label>
                <Slider value={[local.dailyTaskLimit]} min={1} max={100} step={1} onValueChange={v => setLocal(prev => ({ ...prev, dailyTaskLimit: v[0] ?? 20 }))} className="mt-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border rounded-sm">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-sm font-semibold">Schedule Management</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-1 space-y-2">
              {schedStatus && (
                <p className={`text-[10px] p-1.5 rounded-sm ${schedStatus.includes('failed') || schedStatus.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {schedStatus}
                </p>
              )}
              {renderScheduleCard('Opportunity Scout', scoutSchedule, SCOUT_SCHEDULE_ID)}
              {renderScheduleCard('Earnings Tracker', earningsSchedule, EARNINGS_SCHEDULE_ID)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
