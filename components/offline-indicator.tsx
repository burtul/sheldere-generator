"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Check initial status
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 left-4 bg-yellow-500/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Offline Mode</span>
    </div>
  )
}
