"use client"

/**
 * Client Settings Page
 * Basic settings for client portal users
 */

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Settings, 
  Bell, 
  Monitor, 
  Shield, 
  Globe, 
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Users,
  FileText
} from "lucide-react"

export default function ClientSettingsPage() {
  const [saved, setSaved] = useState(false)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [staffUpdates, setStaffUpdates] = useState(true)
  const [performanceAlerts, setPerformanceAlerts] = useState(true)
  const [taskReminders, setTaskReminders] = useState(true)
  const [ticketNotifications, setTicketNotifications] = useState(true)

  // Display settings
  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("Asia/Manila")

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState("company")
  const [activityTracking, setActivityTracking] = useState(true)

  const handleSave = () => {
    // TODO: Implement save to API
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-slate-400 mt-1">Manage your preferences and account settings</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg ring-1 ring-purple-500/30">
                  <Bell className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Notifications</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure how you receive updates and alerts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <div>
                    <Label className="text-white font-medium">Email Notifications</Label>
                    <p className="text-sm text-slate-400">Receive email updates about important events</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <div className="h-px bg-slate-800" />

              {/* Staff Updates */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-slate-400" />
                  <div>
                    <Label className="text-white font-medium">Staff Updates</Label>
                    <p className="text-sm text-slate-400">Get notified about staff status changes</p>
                  </div>
                </div>
                <Switch
                  checked={staffUpdates}
                  onCheckedChange={setStaffUpdates}
                />
              </div>

              <div className="h-px bg-slate-800" />

              {/* Performance Alerts */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-slate-400" />
                  <div>
                    <Label className="text-white font-medium">Performance Alerts</Label>
                    <p className="text-sm text-slate-400">Alerts about staff performance metrics</p>
                  </div>
                </div>
                <Switch
                  checked={performanceAlerts}
                  onCheckedChange={setPerformanceAlerts}
                />
              </div>

              <div className="h-px bg-slate-800" />

              {/* Task Reminders */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <Label className="text-white font-medium">Task Reminders</Label>
                    <p className="text-sm text-slate-400">Reminders for pending tasks and deadlines</p>
                  </div>
                </div>
                <Switch
                  checked={taskReminders}
                  onCheckedChange={setTaskReminders}
                />
              </div>

              <div className="h-px bg-slate-800" />

              {/* Ticket Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  <div>
                    <Label className="text-white font-medium">Ticket Notifications</Label>
                    <p className="text-sm text-slate-400">Updates on support ticket responses</p>
                  </div>
                </div>
                <Switch
                  checked={ticketNotifications}
                  onCheckedChange={setTicketNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg ring-1 ring-blue-500/30">
                  <Monitor className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Display & Appearance</CardTitle>
                  <CardDescription className="text-slate-400">
                    Customize how the portal looks and feels
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tl">Tagalog</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <Label className="text-white font-medium">Timezone</Label>
                </div>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Manila">Asia/Manila (PHT)</SelectItem>
                    <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg ring-1 ring-emerald-500/30">
                  <Shield className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Privacy & Security</CardTitle>
                  <CardDescription className="text-slate-400">
                    Control your privacy and security settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Visibility */}
              <div className="space-y-2">
                <Label className="text-white font-medium">Profile Visibility</Label>
                <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="company">Company Only</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">
                  {profileVisibility === "public" && "Your profile is visible to everyone"}
                  {profileVisibility === "company" && "Only your company staff can see your profile"}
                  {profileVisibility === "private" && "Your profile is hidden from others"}
                </p>
              </div>

              <div className="h-px bg-slate-800" />

              {/* Activity Tracking */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Activity Tracking</Label>
                  <p className="text-sm text-slate-400">Allow us to track activity for analytics</p>
                </div>
                <Switch
                  checked={activityTracking}
                  onCheckedChange={setActivityTracking}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Preferences */}
          <Card className="bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 border-0">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg ring-1 ring-orange-500/30">
                  <Globe className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Contact Preferences</CardTitle>
                  <CardDescription className="text-slate-400">
                    Update your contact information and preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white font-medium">Preferred Contact Method</Label>
                <Select defaultValue="email">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium">Contact Hours</Label>
                <Select defaultValue="business">
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
                    <SelectValue placeholder="Select hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Time</SelectItem>
                    <SelectItem value="business">Business Hours Only</SelectItem>
                    <SelectItem value="emergency">Emergency Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-between p-6 bg-slate-900/50 backdrop-blur-xl ring-1 ring-white/10 rounded-lg">
            <p className="text-sm text-slate-400">
              Changes will be saved to your account
            </p>
            <Button
              onClick={handleSave}
              disabled={saved}
              className={`transition-all ${
                saved
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

