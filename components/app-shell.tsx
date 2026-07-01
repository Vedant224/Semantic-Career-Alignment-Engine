"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Network, LayoutPanelLeft, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Alignment Studio", icon: LayoutPanelLeft },
  { href: "/career-graph", label: "Career Graph", icon: Network },
]

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)] text-white ring-1 ring-inset ring-white/20">
        <Compass className="h-[20px] w-[20px]" aria-hidden="true" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
          Career Alignment
        </span>
        <span className="eyebrow mt-1 text-muted-foreground">Semantic Engine</span>
      </span>
    </Link>
  )
}

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string
  onNavigate?: () => void
  className?: string
}) {
  return (
    <div className={className}>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm transition-colors",
              active
                ? "bg-[color:var(--accent)] font-medium text-white"
                : "font-normal text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col">
      {/* Substantial dark navbar — integrated into the app, not a hairline */}
      <header className="navbar-surface sticky top-0 z-40">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />

          {/* Desktop nav — grouped in a subtle inset rail */}
          <nav className="hidden items-center gap-1 rounded-xl border border-border bg-card p-1 sm:flex">
            <NavLinks pathname={pathname} className="flex items-center gap-1" />
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground sm:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile slide-down nav */}
        {mobileOpen && (
          <div className="border-t border-border px-4 pb-4 pt-2 sm:hidden">
            <NavLinks
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
              className="flex flex-col gap-1"
            />
          </div>
        )}
      </header>

      {children}
    </div>
  )
}
