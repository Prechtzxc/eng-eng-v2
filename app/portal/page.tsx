"use client"

import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { Card, CardContent } from "@/src/modules/shared/components/ui/card"
import { Badge } from "@/src/modules/shared/components/ui/badge"
import { Button } from "@/src/modules/shared/components/ui/button"
import { Calendar, Check, MapPin, ArrowRight, Clock, Plus, Receipt, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function ClientDashboardPage() {
  const { user } = useAuth()

  const nextEvent = { 
    name: "Wedding Reception", 
    date: "June 17, 2026", 
    time: "10:00 AM - 10:00 PM", 
    venue: "Grand Ballroom", 
    status: "APPROVED", 
    step: 3 
  }

  const otherBookings = [
    { id: 2, name: "Birthdayy", date: "June 19, 2026", time: "09:00 AM - 02:00 PM", venue: "Conference Hall", status: "PENDING" },
    { id: 3, name: "Bachelors party", date: "June 25, 2026", time: "04:00 PM - 11:00 PM", venue: "Rooftop Terrace", status: "VERIFYING" },
    { id: 4, name: "Company Seminar", date: "May 10, 2026", time: "08:00 AM - 05:00 PM", venue: "Grand Ballroom", status: "COMPLETED" },
  ]

  const recentPayments = [
    { id: 101, event: "Wedding Reception", amount: "₱25,000", date: "June 01, 2026", status: "PAID" },
    { id: 102, event: "Birthdayy", amount: "₱10,000", date: "June 10, 2026", status: "PENDING" },
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 flex items-center justify-center text-2xl font-black uppercase shrink-0 ring-2 ring-white shadow-sm">
            {user?.name?.charAt(0) || "C"}
          </div>

          <div>
            <p className="text-sm text-slate-500 font-semibold mb-1">
              Welcome back,
            </p>

            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-tight">
              {user?.name || "Client"}
            </h1>
          </div>
        </div>

        <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-5 h-10 text-sm font-bold shadow-sm transition-all shrink-0" asChild>
          <Link href="/portal/bookings"><Plus className="w-4 h-4 mr-2" /> New Booking</Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 px-1">Your Next Event</h2>
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-5 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <Badge variant="outline" className="uppercase text-[10px] font-bold tracking-widest px-2.5 py-0.5 rounded-md mb-3 border-emerald-200 bg-emerald-50 text-emerald-600 shadow-none">
                    {nextEvent.status}
                  </Badge>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-3">
                    {nextEvent.name}
                  </h3>
                  <div className="flex flex-col gap-2 text-xs text-slate-600 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 w-fit">
                    <div className="flex items-center gap-2.5"><Calendar className="w-4 h-4 text-orange-500" /> {nextEvent.date}</div>
                    <div className="flex items-center gap-2.5"><Clock className="w-4 h-4 text-orange-500" /> {nextEvent.time}</div>
                    <div className="flex items-center gap-2.5"><MapPin className="w-4 h-4 text-orange-500" /> {nextEvent.venue}</div>
                  </div>
                </div>
                
                <div className="w-full md:w-[200px] shrink-0 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-5">
                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4 text-center md:text-left">Progress</p>
                  <div className="flex justify-between items-start w-full">
                    {[
                      { step: 1, label: 'Placed' }, { step: 2, label: 'Verified' },
                      { step: 3, label: 'Approved' }, { step: 4, label: 'Done' }
                    ].map((s) => (
                      <div key={s.step} className="flex flex-col items-center gap-1.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${nextEvent.step >= s.step ? 'bg-orange-500 text-white' : 'bg-slate-100'}`}>
                          {nextEvent.step >= s.step && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-[9px] font-bold uppercase ${nextEvent.step >= s.step ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-slate-900">Other Bookings</h2>
              <Button variant="link" className="text-orange-600 text-xs font-bold h-auto p-0" asChild>
                <Link href="/portal/bookings">View All <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="divide-y divide-slate-100">
                {otherBookings.map((booking) => (
                  <Link href="/portal/bookings" key={booking.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-orange-600">{booking.name}</h4>
                      <div className="flex gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" />{booking.date}</span>
                        <span className="hidden sm:flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" />{booking.venue}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-none ${booking.status === 'COMPLETED' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : booking.status === 'PENDING' ? 'text-orange-600 border-orange-200 bg-orange-50' : 'text-blue-600 border-blue-200 bg-blue-50'}`}>
                      {booking.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-slate-900">Recent Payments</h2>
              <Button variant="link" className="text-orange-600 text-xs font-bold h-auto p-0" asChild>
                <Link href="/portal/payments">Manage <ArrowRight className="w-3 h-3 ml-1" /></Link>
              </Button>
            </div>
            <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="divide-y divide-slate-100">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900">{payment.amount}</h4>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{payment.event}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-none ${payment.status === 'PAID' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-orange-600 border-orange-200 bg-orange-50'}`}>
                        {payment.status}
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-1">{payment.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="rounded-2xl border-orange-100 bg-orange-50 shadow-sm">
            <CardContent className="p-5 flex items-start gap-3">
              <Receipt className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-orange-900 tracking-tight mb-1">Need billing help?</h3>
                <p className="text-orange-700 text-[11px] mb-3 leading-relaxed">Chat with our admins for billing and payment questions.</p>
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9 rounded-lg shadow-sm" asChild>
                  <Link href="/portal/chat">Message Admin</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}