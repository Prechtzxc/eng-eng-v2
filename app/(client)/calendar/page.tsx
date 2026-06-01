"use client"

import React, { useState, useEffect } from "react"
import { PublicLayout } from "@/src/modules/client/components/public-layout"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/modules/shared/components/ui/select"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Clock } from "lucide-react"
import { useBookings } from "@/src/modules/client/contexts/booking-context"
import { ReserveButton } from "@/src/modules/client/components/reserve-button"

// PHASE 3: CENTRAL DATA SYNC
import { getAllVenues, getAllOffices } from "@/lib/central-data"

const MAINTENANCE_STORAGE_KEY = "oneestela_global_maintenance_v2"

export default function CalendarPreviewPage() {
  const { bookings, maintenanceDates } = useBookings()
  const allBookings = bookings || []
  
  const venues = getAllVenues()
  const offices = getAllOffices() // Kinuha na rin natin ang offices
  
  // Phase 2: Booking Type Selector
  const [bookingType, setBookingType] = useState<"venue" | "office">("venue")
  const [selectedFacilityId, setSelectedFacilityId] = useState(venues[0]?.id || "v1")

  // Phase 3: Pencil Booking Flow States
  const [showPaymentTimer, setShowPaymentTimer] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  })

  // Get maintenance
  const [localMaint, setLocalMaint] = useState<string[]>([])
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalMaint(JSON.parse(localStorage.getItem(MAINTENANCE_STORAGE_KEY) || "[]"))
    }
  }, [])

  // Timer Effect para sa Pencil Booking
  useEffect(() => {
    if (!showPaymentTimer || timeLeft <= 0) return
    const intervalId = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(intervalId)
  }, [showPaymentTimer, timeLeft])

  const activeMaintenance = maintenanceDates?.length > 0 ? maintenanceDates : localMaint;

  // Calendar Logic
  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const emptySlots = Array.from({ length: firstDay }).map((_, i) => null)
  const days = Array.from({ length: daysInMonth }).map((_, i) => i + 1)
  
  const today = new Date(); today.setHours(0,0,0,0);

  const getDayStatus = (d: number) => {
    const iterDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const iterDate = new Date(year, month, d)
    
    if (iterDate < today) return "past"
    if (activeMaintenance.includes(`${selectedFacilityId}|${iterDateStr}`)) return "maintenance"

    const dayBookings = allBookings.filter(b => b.date === iterDateStr && (!b.venueId || b.venueId === selectedFacilityId) && ["approved", "confirmed", "completed"].includes(b.status?.toLowerCase() || ""));
    
    // PHASE 2: Magkaibang Logic para sa Venue at Office
    if (bookingType === "office") {
      // OFFICES: Contract-based. Kapag occupied na, blocked agad.
      if (dayBookings.length >= 1) return "full"
    } else {
      // VENUES: Hourly-based (6 hrs). Posible ang multiple bookings (max 2 per day para sa logic na ito)
      if (dayBookings.length >= 2) return "full"
      if (dayBookings.length === 1) return "partial"
    }
    
    return "available"
  }

  // Handle Category Change
  const handleCategoryChange = (val: "venue" | "office") => {
    setBookingType(val)
    setSelectedFacilityId(val === "venue" ? venues[0]?.id : offices[0]?.id)
    setShowPaymentTimer(false) // i-reset timer pag nagpalit
  }

  return (
    <PublicLayout>
      <section className="pt-24 pb-16 bg-slate-50 min-h-screen">
        <div className="container mx-auto px-4 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="text-center mb-10">
            <Badge className="bg-amber-100 text-amber-700 border-none px-4 py-1.5 mb-4 text-xs font-bold tracking-widest shadow-none">Availability Checker</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Space Calendar</h1>
            <p className="text-lg text-slate-500">Preview the schedule of our spaces before making a reservation.</p>
          </div>

          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-6 md:p-10 flex flex-col md:flex-row gap-10">
            
            {/* SIDEBAR FILTERS */}
            <div className="w-full md:w-64 shrink-0 space-y-8">
               <div className="space-y-4">
                  
                  {/* Category Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                    <Select value={bookingType} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="venue">Event Venues</SelectItem>
                        <SelectItem value="office">Private Offices</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Facility Selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Select {bookingType === "venue" ? "Venue" : "Office"}
                    </label>
                    <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {(bookingType === "venue" ? venues : offices).map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Info className="w-4 h-4 text-amber-600"/> Legend</h4>
                  <div className="space-y-3">
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-300"></div><span className="text-sm font-semibold text-slate-600">Available</span></div>
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-amber-100 border border-amber-300"></div><span className="text-sm font-semibold text-slate-600">Partially Booked</span></div>
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-rose-100 border border-rose-300"></div><span className="text-sm font-semibold text-slate-600">Fully Booked</span></div>
                     <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-300"></div><span className="text-sm font-semibold text-slate-600">Maintenance</span></div>
                  </div>
               </div>

               {/* PHASE 3: Trigger Pencil Booking */}
               <ReserveButton 
                  onClick={() => {
                    setShowPaymentTimer(true);
                    setTimeLeft(900); // reset to 15 mins
                  }}
                  className="w-full h-12 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all active:scale-95"
               >
                  Book This Space
               </ReserveButton>
            </div>

            {/* BIG CALENDAR */}
            <div className="flex-1">
               <div className="flex items-center justify-between mb-8 bg-slate-50 rounded-2xl p-2 border border-slate-100">
                 <button onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronLeft className="w-5 h-5 text-slate-700" /></button>
                 <h3 className="font-black text-slate-900 text-lg uppercase tracking-wide">{calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                 <button onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"><ChevronRight className="w-5 h-5 text-slate-700" /></button>
               </div>

               <div className="grid grid-cols-7 gap-2 md:gap-3 text-center">
                 {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">{d}</div>)}
                 {emptySlots.map((_, i) => <div key={`empty-${i}`} />)}
                 {days.map((day) => {
                   const status = getDayStatus(day);
                   
                   let bgClass = "bg-slate-50 text-slate-700 hover:border-amber-400";
                   if (status === "past") bgClass = "bg-white text-slate-300 opacity-50";
                   else if (status === "full") bgClass = "bg-rose-50 text-rose-700 border-rose-200";
                   else if (status === "partial") bgClass = "bg-amber-50 text-amber-700 border-amber-200";
                   else if (status === "maintenance") bgClass = "bg-slate-200 text-slate-500 border-slate-300";
                   else if (status === "available") bgClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

                   return (
                     <div key={day} className="aspect-square flex items-center justify-center p-1">
                       <div className={`w-full h-full rounded-2xl border flex items-center justify-center font-bold text-sm md:text-base transition-all ${bgClass}`}>
                         {day}
                       </div>
                     </div>
                   )
                 })}
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* PHASE 3: PENCIL BOOKING PAYMENT FLOW BOTTOM SHEET */}
      {showPaymentTimer && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full duration-500">
          <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Pencil Booking Reservation</p>
              <div className="flex items-center gap-2 font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg w-fit border border-rose-100">
                <Clock size={18} /> 
                Expires in {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
              </div>
            </div>
            
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowPaymentTimer(false)}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button className="px-6 py-3 rounded-xl border-2 border-amber-600 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors">
                Pay Downpayment (50%)
              </button>
              <button className="px-6 py-3 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 shadow-md transition-colors">
                Pay Full Amount
              </button>
            </div>
          </div>
        </div>
      )}
    </PublicLayout>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
   return <span className={`inline-flex items-center rounded-full font-semibold ${className}`}>{children}</span>
}