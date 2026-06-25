import type { Metadata } from "next"
import { Rubik, Newsreader } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/site-header"

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "Semantic Career Alignment Engine",
  description:
    "Align your career graph to any job description. Generate optimized resumes and surface semantic skill gaps with vector-powered matching.",
  generator: "v0.app",
}

export const viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${rubik.variable} ${newsreader.variable} bg-background`}>
      <body className="font-sans antialiased">
        <div className="app-gradient min-h-screen">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  )
}
