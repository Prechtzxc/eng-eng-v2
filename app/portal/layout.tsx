"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  MessageSquare,
  User,
  LogOut,
  Menu,
  Bell,
  Search,
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
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { useChat } from "@/src/modules/shared/contexts/chat-context"
import { ClientChatWidget } from "@/src/modules/shared/components/chat-widget"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  const { logout, user, isLoading } = useAuth()
  const { messages } = useChat()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const unreadCount =
    messages?.filter(
      (m: any) =>
        m.clientId === user?.id && m.sender === "admin" && !m.isReadByClient
    ).length || 0

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const menuItems = [
    { name: "Dashboard", href: "/portal", icon: LayoutDashboard },
    { name: "My Bookings", href: "/portal/bookings", icon: Calendar },
    { name: "My Transactions", href: "/portal/payments", icon: FileText },
    { name: "Chat with Admin", href: "/portal/chat", icon: MessageSquare },
  ]

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

      toast({
        title: "Logged out",
        description: "See you next time!",
      })

      setShowLogoutConfirm(false)
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading || !user) return null

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-slate-50">
      {/* HEADER */}
      <header className="z-50 flex h-16 shrink-0 items-center justify-between bg-orange-600 text-white shadow-md">
        <div className="flex h-full shrink-0 items-center gap-3 px-4 lg:w-64 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 text-white hover:bg-orange-500 lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="text-xl font-black tracking-tight text-white">
            One Estela Place
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 px-4 lg:px-6">
          <div className="relative hidden items-center md:flex">
            <Search className="absolute left-3 h-4 w-4 text-orange-200" />
            <Input
              type="text"
              placeholder="Search events or dates..."
              className="h-9 w-[250px] rounded-full border-transparent bg-white/20 pl-9 text-xs text-white transition-all placeholder:text-orange-100 focus:w-[350px] focus-visible:ring-2 focus-visible:ring-white"
            />
          </div>

          <div className="flex items-center gap-4 pl-2 lg:pl-4">
            <Button
              variant="ghost"
              size="icon"
              className="relative shrink-0 rounded-full text-white hover:bg-orange-500"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 animate-ping rounded-full bg-red-500" />
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="hidden text-right md:block">
                <p className="text-[13px] font-bold capitalize leading-tight text-white sm:text-sm">
                  {user.name}
                </p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-200">
                  Client
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black uppercase text-orange-600 shadow-sm">
                {user.name?.charAt(0) || "C"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* LOWER CONTENT AREA */}
      <div className="relative flex flex-1 overflow-hidden">
        {isMobileMenuOpen && (
          <div
            className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div
          className={`absolute inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="mt-2 flex-1 space-y-1 overflow-y-auto p-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between rounded-md px-3 py-2.5 text-[14px] font-bold transition-all ${
                    isActive
                      ? "bg-orange-50 text-orange-700 shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center">
                    <item.icon
                      className={`mr-3 h-4 w-4 ${
                        isActive ? "text-orange-600" : "text-slate-400"
                      }`}
                    />
                    {item.name}
                  </div>

                  {item.name === "Chat with Admin" && unreadCount > 0 && (
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="flex flex-col gap-1 border-t border-slate-100 bg-slate-50/50 p-3">
            <Link
              href="/portal/profile"
              className={`flex items-center rounded-md px-3 py-2.5 text-[14px] font-bold transition-all ${
                pathname === "/portal/profile"
                  ? "bg-orange-50 text-orange-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <User
                className={`mr-3 h-4 w-4 ${
                  pathname === "/portal/profile"
                    ? "text-orange-600"
                    : "text-slate-400"
                }`}
              />
              Profile
            </Link>

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

        <main
          className={`flex-1 overflow-auto ${
            pathname === "/portal/chat" ? "p-0" : "p-4 md:p-8"
          }`}
        >
          {children}
        </main>
      </div>

      <ClientChatWidget />

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
  )
}
