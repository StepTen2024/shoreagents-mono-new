"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Settings, Bell, Lock, Palette, Globe } from "lucide-react"
import { UpdateNotification } from "@/components/staff/update-notification"

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-6xl animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Settings className="h-6 w-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
          </div>
          <p className="text-slate-400">Manage your account preferences and settings</p>
        </div>

        <div className="grid gap-6">
          {/* Notifications */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Bell className="h-5 w-5 text-blue-400" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-slate-200">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-slate-400">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="text-slate-200">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-slate-400">
                    Receive push notifications in browser
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Palette className="h-5 w-5 text-purple-400" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-slate-200">
                    Dark Mode
                  </Label>
                  <p className="text-sm text-slate-400">
                    Use dark theme across the application
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={darkMode}
                  onCheckedChange={setDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="h-5 w-5 text-green-400" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800">
                  Change Password
                </Button>
                <p className="text-sm text-slate-400 mt-2">
                  Update your password to keep your account secure
                </p>
              </div>
              <div>
                <Button variant="outline" className="bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800">
                  Two-Factor Authentication
                </Button>
                <p className="text-sm text-slate-400 mt-2">
                  Add an extra layer of security to your account
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Software Updates - Only visible in Electron app */}
          <UpdateNotification />

          {/* Language & Region */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5 text-cyan-400" />
                Language & Region
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-200">Language</Label>
                <p className="text-sm text-slate-400 mt-1">English (US)</p>
              </div>
              <div>
                <Label className="text-slate-200">Timezone</Label>
                <p className="text-sm text-slate-400 mt-1">UTC+08:00 (Manila)</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <p className="text-yellow-200 text-sm text-center">
            ⚠️ Settings functionality is currently being developed. This is a preview version.
          </p>
        </div>
      </div>
    </div>
  )
}

