"use client"

import { Download, Monitor, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export function DesktopAppDownload() {
  const appVersion = "1.0.0"
  const fileSize = "~250 MB"
  const downloadUrl = "/downloads/Shore-Agents-Setup-1.0.0.exe" // Update this path

  const handleDownload = () => {
    // Track download analytics if needed
    if (typeof window !== 'undefined') {
      window.location.href = downloadUrl
    }
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5 mb-6">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Monitor className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Shore Agents Desktop App
                </h3>
                <p className="text-sm text-muted-foreground">
                  Download our Windows desktop app for automatic time tracking and performance monitoring
                </p>
              </div>
              
              {/* Download Button */}
              <Button
                onClick={handleDownload}
                size="lg"
                className="flex-shrink-0 gap-2"
              >
                <Download className="h-5 w-5" />
                Download for Windows
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">Automatic time tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">Real-time monitoring</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">Desktop notifications</span>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Version {appVersion}</span>
              <span>•</span>
              <span>{fileSize}</span>
              <span>•</span>
              <span>Windows 10/11</span>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Steps */}
      <div className="border-t border-border/50 bg-muted/30 px-6 py-4">
        <p className="text-xs text-muted-foreground mb-2 font-medium">Quick Installation:</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Download the installer above</li>
          <li>Double-click the downloaded file</li>
          <li>If Windows SmartScreen appears, click "More info" → "Run anyway"</li>
          <li>Follow installation wizard</li>
          <li>Launch Shore Agents from desktop shortcut</li>
          <li>Login with your credentials below</li>
        </ol>
      </div>
    </Card>
  )
}

