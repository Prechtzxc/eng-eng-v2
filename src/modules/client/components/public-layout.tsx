"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Facebook,
  FileText,
  Instagram,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  User,
  X,
} from "lucide-react"

import { Button } from "@shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@shared/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@shared/components/ui/avatar"

import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { useCMS } from "@/src/modules/admin/contexts/cms-context"
import { LoginDialog } from "@shared/auth/login-dialog"
import { SignupDialog } from "@shared/auth/signup-dialog"
import { UnifiedChatWidget } from "@shared/components/unified-chat-widget"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const { cmsData } = useCMS()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.role === "admin" || user.role === "owner") {
        router.push("/dashboard")
      } else {
        router.push("/portal")
      }
    }
  }, [user, router])

  const handleLogout = () => {
    logout()
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-600">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-orange-500/40 bg-orange-600 shadow-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-orange-600 shadow-sm transition-transform group-hover:scale-105">
              E
            </div>

            <span className="text-xl font-black tracking-tight text-white">
              One Estela <span className="text-orange-100">Place</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-11 w-11 rounded-full border-2 border-white/50 p-0 hover:border-white hover:bg-white/10"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder-user.jpg" alt={user.name} />
                      <AvatarFallback className="bg-white font-black text-orange-600">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  className="mt-2 w-56 rounded-2xl border-slate-200"
                  align="end"
                  forceMount
                >
                  <div className="flex items-center justify-start gap-2 p-3">
                    <div className="flex min-w-0 flex-col space-y-1 leading-none">
                      <p className="truncate font-bold">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/portal">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/portal/bookings">
                      <FileText className="mr-2 h-4 w-4" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/portal/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile Details
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <div className="hidden items-center gap-3 sm:flex">
                  <LoginDialog>
                    <Button className="h-10 rounded-xl bg-white px-6 text-sm font-black text-orange-600 shadow-sm hover:bg-orange-50">
                      Login
                    </Button>
                  </LoginDialog>

                  <SignupDialog>
                    <Button className="h-10 rounded-xl bg-slate-950 px-6 text-sm font-black text-white shadow-sm hover:bg-slate-900">
                      Sign Up
                    </Button>
                  </SignupDialog>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/15 sm:hidden"
                  onClick={() => setIsMobileMenuOpen((current) => !current)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {!user && isMobileMenuOpen && (
          <div className="absolute left-0 top-full w-full border-t border-orange-500/40 bg-orange-600 shadow-xl sm:hidden">
            <div className="container mx-auto flex flex-col gap-3 px-4 py-5">
              <LoginDialog>
                <Button className="h-11 w-full justify-center rounded-xl bg-white font-black text-orange-600 hover:bg-orange-50">
                  Login
                </Button>
              </LoginDialog>

              <SignupDialog>
                <Button className="h-11 w-full justify-center rounded-xl bg-slate-950 font-black text-white hover:bg-slate-900">
                  Sign Up
                </Button>
              </SignupDialog>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto border-t border-slate-800 bg-slate-900 py-16 text-slate-300">
        <div className="container mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 md:grid-cols-4">
          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight text-white">
              One Estela Place
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">
              Creating unforgettable moments for your special events. The perfect
              place for weddings, birthdays, and corporate gatherings.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>

            <ul className="flex flex-col items-start space-y-3 text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-orange-500">
                  Home
                </Link>
              </li>

              <li>
                <Link href="/" className="transition-colors hover:text-orange-500">
                  Book an Event
                </Link>
              </li>

              <li>
                <Link href="/" className="transition-colors hover:text-orange-500">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h4>

            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-orange-500" />
                <span>
                  {cmsData?.footer?.address || "123 Event Street, City, State 12345"}
                </span>
              </li>

              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-orange-500" />
                <span>{cmsData?.footer?.phone || "(555) 123-4567"}</span>
              </li>

              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-orange-500" />
                <span>{cmsData?.footer?.email || "info@oneestela.com"}</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">
              Connect With Us
            </h4>

            <div className="flex gap-4">
              <a
                href={cmsData?.footer?.facebook || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-orange-600 hover:text-white"
              >
                <Facebook className="h-5 w-5" />
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-orange-600 hover:text-white"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="container mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-800 px-4 pt-8 text-xs text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} One Estela Place. All rights reserved.</p>

          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>

            <Link href="#" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      {user && user.role === "client" && <UnifiedChatWidget />}
    </div>
  )
}