import type { Metadata } from "next"
import { Rubik } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"

// Rubik is the single typeface used across the entire app.
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-rubik",
  display: "block",
  preload: true,
})

export const metadata: Metadata = {
  title: "Semantic Career Alignment Engine",
  description:
    "Align your career graph to any job description. Generate optimized resumes and surface semantic skill gaps with vector-powered matching.",
  generator: "v0.app",
}

export const viewport = {
  themeColor: "#8b6954",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${rubik.variable} bg-background`}>
      <head>
        <style>{`
          html {
            background: #f3f1ec;
            color: #1a1a1c;
          }
          body {
            background: #f3f1ec;
            color: #1a1a1c;
          }
        `}</style>
      </head>
      <body className="font-sans antialiased">
        <div className="app-gradient min-h-screen">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  )
}
