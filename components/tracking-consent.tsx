"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface TrackingConsentProps {
  onConsent: (accepted: boolean) => void
}

export default function TrackingConsent({ onConsent }: TrackingConsentProps) {
  const handleAccept = () => {
    localStorage.setItem('tracking_consent', 'true')
    onConsent(true)
  }

  const handleDecline = () => {
    localStorage.setItem('tracking_consent', 'false')
    onConsent(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Performance Tracking</CardTitle>
          <CardDescription>
            This app can track your work performance metrics to help improve productivity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We'll collect anonymized data about:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
            <li>Active time and idle time</li>
            <li>Application usage patterns</li>
            <li>Break times and duration</li>
            <li>Task completion metrics</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            All data is encrypted and used solely for productivity analysis.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" onClick={handleDecline} className="flex-1">
            Decline
          </Button>
          <Button onClick={handleAccept} className="flex-1">
            Accept & Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
