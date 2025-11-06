"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function SettingsPage() {
  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">System Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Configure system preferences and integrations</p>
        </div>

        {/* General Settings */}
        <Card className="bg-zinc-950 border-white/20">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Company Name</label>
              <Input defaultValue="Shore Agents" className="bg-black/50 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Admin Email</label>
              <Input defaultValue="admin@shoreagents.com" className="bg-black/50 border-white/10 text-white" />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Time Zone</label>
              <select className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg text-white">
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC+0 (GMT)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Review Settings */}
        <Card className="bg-zinc-950 border-white/20">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Review Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-schedule Month 1 Reviews</p>
                <p className="text-sm text-gray-400 mt-1">Automatically schedule reviews after 30 days</p>
              </div>
              <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Reminders</p>
                <p className="text-sm text-gray-400 mt-1">Send email reminders for upcoming reviews</p>
              </div>
              <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
              </button>
            </div>
          </div>
        </Card>

        {/* Gamification Settings */}
        <Card className="bg-zinc-950 border-white/20">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Gamification Settings</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Enable Gamification</p>
                <p className="text-sm text-gray-400 mt-1">Turn on points, badges, and leaderboards</p>
              </div>
              <button className="w-12 h-6 bg-indigo-600 rounded-full relative">
                <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
              </button>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">Points per Task Completion</label>
              <Input type="number" defaultValue="10" className="bg-black/50 border-white/10 text-white" />
            </div>
          </div>
        </Card>

        {/* Integrations */}
        <Card className="bg-zinc-950 border-white/20">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Integrations</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📧</span>
                </div>
                <div>
                  <p className="text-white font-medium">Email Service</p>
                  <p className="text-sm text-gray-400">SendGrid</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <p className="text-white font-medium">Slack</p>
                  <p className="text-sm text-gray-400">Team notifications</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-white/10 text-white bg-transparent">
                Connect
              </Button>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
        </div>
      </div>
    
  )
}
