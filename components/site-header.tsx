"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Network, LayoutPanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/", label: "Alignment Studio", icon: LayoutPanelLeft },
  { href: "/career-graph", label: "Career Graph", icon: Network },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--primary)] text-primary-foreground">
            <Compass className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-medium tracking-tight text-foreground">
            Career Alignment
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-[7px] px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-secondary font-medium text-secondary-foreground"
                    : "font-normal text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
