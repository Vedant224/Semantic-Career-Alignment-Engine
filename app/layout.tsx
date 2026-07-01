import type { Metadata } from "next"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/app-shell"

// Inter carries the UI and body copy — neutral, legible, workhorse.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
})

// Space Grotesk gives headings and the brand a distinct, technical character.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
  preload: true,
})

// JetBrains Mono for eyebrows, counters, and numeric/technical labels.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Semantic Career Alignment Engine",
  description:
    "Align your career graph to any job description. Generate optimized resumes and surface semantic skill gaps with vector-powered matching.",
  generator: "v0.app",
}

export const viewport = {
  themeColor: "#f4f6fb",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <div className="app-gradient min-h-screen">
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  )
}
