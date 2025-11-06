"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminClientUsersPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Client Users Management</h1>
          <p className="text-slate-400 mt-2">Manage client user accounts and permissions</p>
        </div>

        {/* Coming Soon Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-600/20 rounded-lg">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Client Users Management</CardTitle>
                <CardDescription className="text-slate-400">
                  Coming Soon
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-300">
                The client users management system is currently under development. This feature will allow you to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>View all client users across all companies</li>
                <li>Manage client user permissions and roles</li>
                <li>Add or remove client users</li>
                <li>View client user activity and engagement</li>
                <li>Assign or reassign clients to companies</li>
              </ul>
              <div className="pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-500">
                  <strong>Note:</strong> For now, you can manage client users through their respective company pages
                  or use the Staff Onboarding system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Link href="/admin/staff/onboarding">
            <Card className="bg-slate-800 border-slate-700 hover:border-purple-600 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white text-lg">Staff Management</CardTitle>
                <CardDescription className="text-slate-400">
                  Manage staff users and onboarding
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin/tickets">
            <Card className="bg-slate-800 border-slate-700 hover:border-purple-600 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white text-lg">Support Tickets</CardTitle>
                <CardDescription className="text-slate-400">
                  View and manage client tickets
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

