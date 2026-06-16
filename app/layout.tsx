import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AppToaster } from "@/components/app-toaster"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export const metadata: Metadata = {
  title: "Shift Schedule Manager",
  description:
    "Manage your 2/2 shift rotation with automatic schedule generation, monthly norms tracking, and shift notes",
  generator: "v0.app",
  applicationName: "Shift Schedule Manager",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shift Schedule Manager",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${_geist.className} ${_geistMono.className}`}>
      <body suppressHydrationWarning>
        {children}
        <AppToaster />
      </body>
    </html>
  )
}