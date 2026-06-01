"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { useChat } from "@/src/modules/shared/contexts/chat-context"
import { GlobalProvider } from "@/src/modules/shared/components/global-provider"

import {
  LayoutDashboard,
  BookOpen,
  MessageSquare,
  CreditCard,
  BarChart,
  Users,
  Settings,
  UserCheck,
  LogOut,
  Search,
  Bell,
} from "lucide-react"

import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/modules/shared/components/ui/dialog"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user, isLoading } = useAuth()
  const { messages } = useChat()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const unreadAdminCount =
    messages?.filter((m: any) => m.sender === "client" && !m.isRead).length || 0

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, isLoading, router])

  const clearSessionStorageOnly = () => {
    const authKeys = [
      "oneestela_current_user",
      "oneestela_auth_user",
      "oneestela_user",
      "oneestela_session",
      "oneestela_user_session",
      "currentUser",
      "authUser",
      "user",
    ]

    authKeys.forEach((key) => localStorage.removeItem(key))
    window.dispatchEvent(new Event("oneestela_auth_updated"))
  }

  const handleLogout = () => {
    setShowLogoutConfirm(true)
  }

  const handleConfirmLogout = async () => {
    try {
      clearSessionStorageOnly()
      await Promise.resolve(logout?.())

      setShowLogoutConfirm(false)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Booking Management", href: "/dashboard/bookings", icon: BookOpen },
    { name: "Customer Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Payment Verification", href: "/dashboard/payments", icon: CreditCard },
    { name: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart },
    { name: "Staff Management", href: "/dashboard/staff", icon: Users },
    { name: "CMS Settings", href: "/dashboard/cms", icon: Settings },
    { name: "Users Information", href: "/users", icon: UserCheck },
  ]

  if (isLoading || !user) return null

  return (
    <GlobalProvider>
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50">
        <header className="z-50 flex h-16 shrink-0 items-center justify-between bg-orange-600 text-white shadow-md">
          <div className="flex h-full w-64 shrink-0 items-center px-6">
            <h1 className="text-xl font-black tracking-tight text-white">
              One Estela Place
            </h1>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4 px-6">
            <div className="relative hidden items-center md:flex">
              <Search className="absolute left-3 h-4 w-4 text-orange-200" />
              <Input
                type="text"
                placeholder="Search admin records..."
                className="h-9 w-[250px] rounded-full border-transparent bg-white/20 pl-9 text-xs text-white placeholder:text-orange-100"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-white"
            >
              <Bell className="h-5 w-5" />
              {unreadAdminCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-ping rounded-full bg-red-500" />
              )}
            </Button>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold uppercase text-orange-600 shadow-sm">
              {user.name?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="relative flex flex-1 overflow-hidden">
          <div className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {menuItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center rounded-md px-3 py-2.5 text-[14px] font-bold ${
                      isActive
                        ? "bg-orange-50 text-orange-700"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-4 w-4 ${
                        isActive ? "text-orange-600" : "text-slate-400"
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="border-t border-slate-100 p-3">
              <Button
                type="button"
                variant="ghost"
                className="flex h-10 w-full items-center justify-start px-3 text-[14px] font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          <main className="relative flex-1 overflow-auto bg-slate-50">
            {children}
          </main>
        </div>

        <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <DialogContent className="w-[92vw] max-w-lg rounded-2xl border-0 bg-white p-0 shadow-2xl">
            <div className="p-6 sm:p-7">
              <DialogHeader className="space-y-3 text-left">
                <DialogTitle className="text-2xl font-black tracking-tight text-slate-950">
                  Confirm Logout
                </DialogTitle>

                <DialogDescription className="max-w-md text-sm font-semibold leading-6 text-slate-500">
                  Are you sure you want to log out?
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="h-10 rounded-xl border-slate-200 px-5 font-black text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="h-10 rounded-xl bg-orange-600 px-5 font-black text-white shadow-sm hover:bg-orange-700"
                >
                  Yes, Log Out
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </GlobalProvider>
  )
}
