"use client"

import React, { Suspense, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  FileText,
  Inbox,
  Loader2,
  Printer,
  Receipt,
  Search,
  ShieldAlert,
  Wrench,
  X,
} from "lucide-react"

import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Textarea } from "@/src/modules/shared/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/src/modules/shared/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/modules/shared/components/ui/select"
import {
  useBookings,
  type Booking,
  type BookingStatus,
  type OfficeRental,
} from "@/src/modules/client/contexts/booking-context"

const ALL_VALUE = "__all__"

const STATUS_OPTIONS: { value: BookingStatus | typeof ALL_VALUE; label: string }[] = [
  { value: ALL_VALUE, label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "verifying", label: "Verifying" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancellation_requested", label: "Cancel Requests" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "declined", label: "Declined" },
]

function formatDate(date?: string) {
  if (!date) return "No date"

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function formatMoney(value?: number | string) {
  const amount = Number(value || 0)
  return `₱${Number.isFinite(amount) ? amount.toLocaleString("en-PH") : "0"}`
}

function normalize(value?: string) {
  return String(value || "").trim().toLowerCase()
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`
}

function getPaymentMethodLabel(method?: string) {
  if (method === "cash") return "Cash / Pay at the Office"
  if (method === "bank") return "Bank Transfer"
  return "Not selected"
}

function getStatusLabel(status?: string) {
  if (!status) return "Unknown"

  if (status === "cancellation_requested") return "Cancel Request"

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getStatusClass(status?: string) {
  const key = normalize(status)

  if (key === "pending") return "border-orange-200 bg-orange-50 text-orange-700"
  if (key === "verifying") return "border-purple-200 bg-purple-50 text-purple-700"
  if (key === "confirmed") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (key === "completed") return "border-blue-200 bg-blue-50 text-blue-700"
  if (key === "cancellation_requested") return "border-amber-200 bg-amber-50 text-amber-700"
  if (key === "cancelled" || key === "declined") return "border-rose-200 bg-rose-50 text-rose-700"
  if (key === "paid" || key === "verified" || key === "partial") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (key === "for_review" || key === "cash_pending") return "border-amber-200 bg-amber-50 text-amber-700"
  if (key === "rejected") return "border-rose-200 bg-rose-50 text-rose-700"

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function getRefundClass(status?: string) {
  if (status === "Refund Pending") return "border-orange-200 bg-orange-50 text-orange-700"
  if (status === "Refund Ready for Claiming") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "Refund Claimed") return "border-blue-200 bg-blue-50 text-blue-700"
  if (status === "Not Eligible for Refund") return "border-slate-200 bg-slate-50 text-slate-600"

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function getOfficeStatusClass(status?: string) {
  const key = normalize(status)

  if (key.includes("pending")) return "border-orange-200 bg-orange-50 text-orange-700"
  if (key.includes("approved")) return "border-amber-200 bg-amber-50 text-amber-700"
  if (key.includes("signed")) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (key.includes("paid")) return "border-blue-200 bg-blue-50 text-blue-700"
  if (key.includes("submitted")) return "border-indigo-200 bg-indigo-50 text-indigo-700"
  if (key.includes("active")) return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (key.includes("declined") || key.includes("cancelled")) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }

  return "border-slate-200 bg-slate-50 text-slate-600"
}

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${className}`}
    >
      {label}
    </span>
  )
}

function ReceiptPreview({ booking }: { booking: Booking }) {
  const receipt = booking.receipt

  if (!booking.receiptIssued || !receipt) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Receipt className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-black text-slate-700">No e-receipt has been issued yet.</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Issue receipt after payment is verified.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 border-b border-slate-200 pb-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">
          One Estela Place
        </p>
        <h3 className="mt-1 text-2xl font-black text-slate-950">
          E-Receipt / Invoice
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Receipt No. {receipt.receiptNumber}
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">Full Name</span>
          <span className="text-right font-black text-slate-900">{receipt.fullName}</span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">Booking Date</span>
          <span className="text-right font-black text-slate-900">
            {formatDate(receipt.bookingDate)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">Start Date</span>
          <span className="text-right font-black text-slate-900">
            {formatDate(receipt.startDate)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">End Date</span>
          <span className="text-right font-black text-slate-900">
            {formatDate(receipt.endDate)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">Booking Type</span>
          <span className="text-right font-black text-slate-900">
            {receipt.bookingType}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">Payment Method</span>
          <span className="text-right font-black text-slate-900">
            {receipt.paymentMethod}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">Payment Status</span>
          <span className="text-right font-black capitalize text-slate-900">
            {receipt.paymentStatus}
          </span>
        </div>

        <div className="flex justify-between gap-4 border-t border-dashed border-slate-300 pt-4">
          <span className="font-black uppercase tracking-[0.12em] text-slate-500">
            Payment Amount
          </span>
          <span className="text-2xl font-black text-orange-600">
            {formatMoney(receipt.paymentAmount)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="font-bold text-slate-500">Date Issued</span>
          <span className="text-right font-black text-slate-900">
            {formatDate(receipt.dateIssued)}
          </span>
        </div>
      </div>
    </div>
  )
}

function BookingDetailsModal({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeclineOpen?: (booking: Booking) => void
}) {
  if (!booking) return null

  const contractSigned = booking.contractSigned || booking.contractStatus === "Signed"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] overflow-y-auto rounded-3xl border-slate-200 p-0 shadow-xl sm:max-w-4xl [&>button]:hidden">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5">
          <div>
            <DialogTitle className="text-2xl font-black text-slate-950">
              Booking Details
            </DialogTitle>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {booking.id} · {booking.eventName}
            </p>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Booking Information
                  </p>
                  <h3 className="mt-1 text-xl font-black text-slate-950">
                    {booking.eventName}
                  </h3>
                  <p className="mt-1 text-sm font-bold text-orange-600">
                    {booking.venue}
                  </p>
                </div>

                <StatusBadge
                  label={getStatusLabel(booking.status)}
                  className={getStatusClass(booking.status)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailTile label="Client" value={booking.userInfo?.name || "Client"} subValue={booking.userInfo?.email || "No email"} />
                <DetailTile label="Date & Time" value={formatDate(booking.date)} subValue={booking.time || `${booking.startTime} - ${booking.endTime}`} />
                <DetailTile label="Guests / Term" value={booking.isOfficeRental ? String((booking as any).contractTerm || (booking as any).rentalTerm || "Office Rental") : `${booking.guestCount} pax`} />
                <DetailTile label="Total Price" value={formatMoney(booking.totalPrice)} highlight />
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                contractSigned
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-orange-200 bg-orange-50"
              }`}
            >
              <div className="flex gap-3">
                {contractSigned ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                )}
                <div>
                  <p className={`text-sm font-black ${contractSigned ? "text-emerald-900" : "text-orange-900"}`}>
                    Contract Status: {contractSigned ? "Signed" : "Pending"}
                  </p>
                  <p className={`mt-1 text-xs font-semibold leading-5 ${contractSigned ? "text-emerald-700" : "text-orange-700"}`}>
                    {contractSigned
                      ? `Contract was signed${booking.contractSignedDate ? ` on ${formatDate(booking.contractSignedDate)}` : ""}.`
                      : "Client must visit One Estela Place office for contract signing."}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    Payment Status
                  </p>
                  <h3 className="text-lg font-black text-slate-950">
                    Payment Details
                  </h3>
                </div>

                <StatusBadge
                  label={getStatusLabel(booking.paymentStatus || "unpaid")}
                  className={getStatusClass(booking.paymentStatus || "unpaid")}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailTile label="Method" value={getPaymentMethodLabel(booking.paymentMethod)} />
                <DetailTile label="Amount Paid" value={formatMoney(booking.amountPaid)} />
                <DetailTile label="Balance" value={formatMoney(booking.remainingBalance)} />
                <DetailTile label="Payment Type" value={booking.paymentType || "Not selected"} />
                {booking.bankReferenceNumber && (
                  <DetailTile label="Bank Reference No." value={booking.bankReferenceNumber} />
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-orange-700">
                  Payment actions are only available in the Payment Verification tab.
                </p>

                <a
                  href={`/dashboard/payments?search=${booking.id}`}
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-orange-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-orange-700 sm:w-auto"
                >
                  Go to Payment Verification
                </a>
              </div>
            </div>

            <ReceiptPreview booking={booking} />
          </div>

          <div className="space-y-5">
            {booking.status === "cancellation_requested" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                  <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <h3 className="font-black text-amber-900">Cancellation Under Review</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-amber-800">
                      Reason: {booking.cancellationReason || "No reason provided"}
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
                      Cancellation/refund actions are reviewed separately. This modal is read-only.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {booking.cancellationStatus && booking.cancellationStatus !== "None" && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Cancellation Status</p>
                <div className="mt-3 space-y-2 text-sm font-semibold text-slate-600">
                  <p>Status: <span className="font-black text-slate-900">{booking.cancellationStatus}</span></p>
                  <p>Refund: <span className="font-black text-slate-900">{booking.refundStatus || "Not Applicable"}</span></p>
                  {booking.cancellationDeclineReason && <p>Decline Reason: {booking.cancellationDeclineReason}</p>}
                  {booking.cancellationCooldownUntil && <p>Cooldown Until: {formatDate(booking.cancellationCooldownUntil)}</p>}
                </div>
              </div>
            )}

            {booking.adminLogs && booking.adminLogs.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Admin Logs
                </p>
                <div className="space-y-3">
                  {booking.adminLogs.slice().reverse().map((log, index) => (
                    <div key={`${log.createdAt}-${index}`} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-black text-slate-900">{log.action}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{log.message}</p>
                      <p className="mt-1 text-[10px] font-bold text-slate-400">{formatDate(log.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailTile({ label, value, subValue, highlight = false }: { label: string; value: React.ReactNode; subValue?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-black ${highlight ? "text-orange-600" : "text-slate-800"}`}>{value || "N/A"}</p>
      {subValue && <p className="text-xs font-semibold text-slate-500">{subValue}</p>}
    </div>
  )
}

function DeclineCancellationModal({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { declineCancellation } = useBookings()
  const [reason, setReason] = useState("")

  const handleDecline = () => {
    if (!booking || !reason.trim()) return

    declineCancellation(booking.id, reason.trim())
    setReason("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] rounded-2xl border-slate-200 p-6 shadow-xl sm:max-w-md">
        <DialogTitle className="text-xl font-black text-slate-950">
          Decline Cancellation
        </DialogTitle>

        <p className="mt-1 text-sm font-semibold text-slate-500">
          Please provide a reason. This will be visible to the client.
        </p>

        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Type decline reason..."
          className="mt-5 min-h-[130px] resize-none rounded-xl border-slate-200 bg-slate-50"
        />

        <div className="mt-5 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-xl font-black"
          >
            Cancel
          </Button>

          <Button
            disabled={!reason.trim()}
            onClick={handleDecline}
            className="h-11 flex-1 rounded-xl bg-rose-600 font-black text-white hover:bg-rose-700 disabled:opacity-50"
          >
            Decline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function MaintenanceCalendarModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { bookings, maintenanceDates, toggleMaintenanceDate } = useBookings()
  const [calendarMonth, setCalendarMonth] = useState(() => new Date())
  const [selectedVenueKey, setSelectedVenueKey] = useState("")
  const [selectedDates, setSelectedDates] = useState<string[]>([])
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false)
  const [unblockTarget, setUnblockTarget] = useState<string | null>(null)

  const venues = useMemo(() => {
    const map = new Map<string, string>()

    bookings.forEach((booking) => {
      const key = String(booking.venueId || booking.venue || "").trim()
      const name = String(booking.venue || booking.eventName || "").trim()

      if (key && name && !map.has(key)) {
        map.set(key, name)
      }
    })

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [bookings])

  const activeVenueKey = selectedVenueKey || venues[0]?.id || "no-venue"
  const activeVenueName = venues.find((venue) => venue.id === activeVenueKey)?.name || "Selected Venue"

  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const emptySlots = Array.from({ length: firstDay })
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1)

  const isPastDate = (dateKey: string) => {
    const date = new Date(`${dateKey}T00:00:00`)
    return date < today
  }

  const isBookedDate = (dateKey: string) => {
    return bookings.some((booking) => {
      const bookingVenueKey = String(booking.venueId || booking.venue || "").trim()
      const validStatus =
        booking.status !== "cancelled" &&
        booking.status !== "declined" &&
        booking.status !== "cancellation_requested"

      return bookingVenueKey === activeVenueKey && booking.date === dateKey && validStatus
    })
  }

  const isMaintenanceDate = (dateKey: string) => {
    return maintenanceDates.includes(`${activeVenueKey}|${dateKey}`) || maintenanceDates.includes(dateKey)
  }

  const toggleSelectedDate = (dateKey: string) => {
    if (!activeVenueKey || activeVenueKey === "no-venue" || isPastDate(dateKey) || isBookedDate(dateKey)) return

    if (isMaintenanceDate(dateKey)) {
      setUnblockTarget(dateKey)
      return
    }

    setSelectedDates((current) =>
      current.includes(dateKey)
        ? current.filter((item) => item !== dateKey)
        : [...current, dateKey]
    )
  }

  const confirmBlockDates = () => {
    selectedDates.forEach((dateKey) => {
      if (!isMaintenanceDate(dateKey) && !isPastDate(dateKey)) {
        toggleMaintenanceDate(dateKey, activeVenueKey)
      }
    })

    setSelectedDates([])
    setConfirmBlockOpen(false)
  }

  const confirmUnblockDate = () => {
    if (unblockTarget && !isPastDate(unblockTarget)) {
      toggleMaintenanceDate(unblockTarget, activeVenueKey)
    }
    setUnblockTarget(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] rounded-3xl border-slate-200 p-0 shadow-xl sm:max-w-2xl [&>button]:hidden">
          <div className="flex items-start justify-between border-b border-slate-200 p-5">
            <div>
              <DialogTitle className="text-2xl font-black text-slate-950">
                Maintenance Calendar
              </DialogTitle>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Select future dates first, then confirm before blocking.
              </p>
            </div>

            <button
              onClick={() => onOpenChange(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5">
            <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <Select value={activeVenueKey} onValueChange={(value) => value !== "no-venue" && setSelectedVenueKey(value)}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white font-bold">
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.length > 0 ? (
                    venues.map((venue) => (
                      <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-venue" disabled>No venues found</SelectItem>
                  )}
                </SelectContent>
              </Select>

              <div className="rounded-xl bg-orange-50 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-orange-700">
                {activeVenueName}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="h-10 w-10 rounded-full p-0">
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="text-center">
                  <p className="text-lg font-black text-slate-950">
                    {calendarMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">Past dates are view-only</p>
                </div>

                <Button type="button" variant="outline" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="h-10 w-10 rounded-full p-0">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-2">{day}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {emptySlots.map((_, index) => <div key={`empty-${index}`} className="h-11" />)}
                {days.map((day) => {
                  const dateKey = toDateKey(new Date(year, month, day))
                  const booked = isBookedDate(dateKey)
                  const maintenance = isMaintenanceDate(dateKey)
                  const selected = selectedDates.includes(dateKey)
                  const past = isPastDate(dateKey)

                  let className = "border-slate-200 bg-white text-slate-700 hover:border-orange-400 hover:bg-orange-50"
                  let disabled = !activeVenueKey || activeVenueKey === "no-venue" || past || booked

                  if (past) className = "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300 opacity-60"
                  if (booked) className = "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-600"
                  if (selected) className = "border-orange-600 bg-orange-500 text-white shadow-md"
                  if (maintenance) {
                    className = past
                      ? "cursor-not-allowed border-slate-900 bg-slate-900 text-slate-500 opacity-60"
                      : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
                    disabled = past
                  }

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleSelectedDate(dateKey)}
                      className={`flex h-11 items-center justify-center rounded-xl border text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-xs font-bold">
                <span className="inline-flex items-center gap-2 text-slate-500"><span className="h-3 w-3 rounded-full border border-slate-200 bg-white" />Available</span>
                <span className="inline-flex items-center gap-2 text-orange-600"><span className="h-3 w-3 rounded-full bg-orange-500" />Selected</span>
                <span className="inline-flex items-center gap-2 text-rose-600"><span className="h-3 w-3 rounded-full bg-rose-100" />Booked</span>
                <span className="inline-flex items-center gap-2 text-slate-700"><span className="h-3 w-3 rounded-full bg-slate-900" />Maintenance</span>
              </div>

              <Button
                type="button"
                disabled={selectedDates.length === 0}
                onClick={() => setConfirmBlockOpen(true)}
                className="mt-5 h-11 w-full rounded-xl bg-orange-600 font-black text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Block Selected Dates ({selectedDates.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmBlockOpen} onOpenChange={setConfirmBlockOpen}>
        <DialogContent className="w-[92vw] max-w-md rounded-3xl border-slate-200 bg-white p-6 shadow-2xl">
          <DialogTitle className="text-xl font-black text-slate-950">Confirm Maintenance Block</DialogTitle>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Are you sure you want to block the selected date(s) for maintenance? These dates will become unavailable for customer bookings.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setConfirmBlockOpen(false)} className="h-11 rounded-xl border-slate-200 font-black">Cancel</Button>
            <Button onClick={confirmBlockDates} className="h-11 rounded-xl bg-orange-600 font-black text-white hover:bg-orange-700">Confirm Block Dates</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!unblockTarget} onOpenChange={(open) => !open && setUnblockTarget(null)}>
        <DialogContent className="w-[92vw] max-w-md rounded-3xl border-slate-200 bg-white p-6 shadow-2xl">
          <DialogTitle className="text-xl font-black text-slate-950">Unblock Maintenance Date?</DialogTitle>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Are you sure you want to remove this maintenance block? This date may become available for customer bookings again.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setUnblockTarget(null)} className="h-11 rounded-xl border-slate-200 font-black">Cancel</Button>
            <Button onClick={confirmUnblockDate} className="h-11 rounded-xl bg-slate-900 font-black text-white hover:bg-slate-800">Yes, Unblock Date</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function OfficeRentalCard({ rental }: { rental: OfficeRental }) {
  const {
    approveOfficeRentalForContractSigning,
    declineOfficeRental,
    markOfficeContractSigned,
    markOfficeAdvanceDepositPaid,
    updateOfficeChequeSubmission,
    activateOfficeLease,
    cancelOfficeRental,
    completeOfficeRental,
  } = useBookings()

  const [declineReason, setDeclineReason] = useState("")
  const [chequeCount, setChequeCount] = useState(String(rental.submittedChequeCount || 0))
  const [chequeNotes, setChequeNotes] = useState(rental.chequeNotes || "")

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Office Rental
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950">
            {rental.officeSpaceName}
          </h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {rental.clientName} · {rental.rentalTerm.replace("_", " ")}
          </p>
        </div>

        <StatusBadge
          label={rental.leaseStatus}
          className={getOfficeStatusClass(rental.leaseStatus)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-orange-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
            Monthly Rent
          </p>
          <p className="mt-1 text-xl font-black text-orange-700">
            {formatMoney(rental.monthlyRent)}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Advance + Deposit
          </p>
          <p className="mt-1 text-xl font-black text-slate-900">
            {formatMoney(rental.totalInitialPayment)}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
            Physical Cheques
          </p>
          <p className="mt-1 text-xl font-black text-blue-700">
            {rental.submittedChequeCount}/{rental.requiredChequeCount}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-semibold leading-6 text-amber-800">
            Office rentals require face-to-face contract signing. Monthly rental payments
            are by cheque only and must be submitted personally at the office.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Contract & Payment
          </p>

          <div className="grid gap-2">
            <Button
              onClick={() => approveOfficeRentalForContractSigning(rental.id)}
              className="h-10 rounded-xl bg-orange-600 text-xs font-black text-white hover:bg-orange-700"
            >
              Approve for Contract Signing
            </Button>

            <Button
              disabled={rental.contractSigned}
              onClick={() => markOfficeContractSigned(rental.id)}
              className="h-10 rounded-xl bg-slate-900 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Mark Contract Signed
            </Button>

            <Button
              disabled={rental.advanceDepositPaid}
              onClick={() => markOfficeAdvanceDepositPaid(rental.id)}
              className="h-10 rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Confirm Advance/Deposit Paid
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Physical Cheque Submission
          </p>

          <div className="grid gap-3">
            <Input
              type="number"
              min={0}
              max={rental.requiredChequeCount}
              value={chequeCount}
              onChange={(event) => setChequeCount(event.target.value)}
              className="h-10 rounded-xl border-slate-200"
            />

            <Textarea
              value={chequeNotes}
              onChange={(event) => setChequeNotes(event.target.value)}
              placeholder="Cheque submission notes..."
              className="min-h-[80px] resize-none rounded-xl border-slate-200"
            />

            <Button
              onClick={() =>
                updateOfficeChequeSubmission(
                  rental.id,
                  Number(chequeCount || 0),
                  chequeNotes,
                  "Admin"
                )
              }
              className="h-10 rounded-xl bg-blue-600 text-xs font-black text-white hover:bg-blue-700"
            >
              Update Cheque Submission
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Button
          onClick={() => activateOfficeLease(rental.id)}
          className="h-10 rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-700"
        >
          Activate Lease
        </Button>

        <Button
          onClick={() => completeOfficeRental(rental.id)}
          variant="outline"
          className="h-10 rounded-xl border-slate-200 text-xs font-black"
        >
          Mark Completed
        </Button>

        <Button
          onClick={() => cancelOfficeRental(rental.id)}
          variant="outline"
          className="h-10 rounded-xl border-rose-200 text-xs font-black text-rose-600 hover:bg-rose-50"
        >
          Cancel
        </Button>
      </div>

      {rental.leaseStatus !== "Declined" && (
        <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-rose-600">
            Decline Request
          </p>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              placeholder="Decline reason..."
              className="h-10 rounded-xl border-rose-200 bg-white"
            />

            <Button
              disabled={!declineReason.trim()}
              onClick={() => {
                declineOfficeRental(rental.id, declineReason.trim())
                setDeclineReason("")
              }}
              className="h-10 rounded-xl bg-rose-600 px-5 text-xs font-black text-white hover:bg-rose-700 disabled:opacity-50"
            >
              Decline
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminBookingsContent() {
  const bookingCtx = useBookings()

  const bookings = bookingCtx.bookings || []
  const officeRentals = bookingCtx.officeRentals || []

  const [mode, setMode] = useState<"venue" | "office">("venue")
  const [statusFilter, setStatusFilter] = useState<string>(ALL_VALUE)
  const [eventFilter, setEventFilter] = useState<string>(ALL_VALUE)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null)
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false)

  const eventOptions = useMemo(() => {
    const events = new Set<string>()

    bookings.forEach((booking) => {
      if (booking.eventName) events.add(booking.eventName)
    })

    return Array.from(events).sort()
  }, [bookings])

  const filteredBookings = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()

    return bookings
      .filter((booking) => {
        const matchesStatus =
          statusFilter === ALL_VALUE || booking.status === statusFilter

        const matchesEvent =
          eventFilter === ALL_VALUE || booking.eventName === eventFilter

        const searchable = [
          booking.id,
          booking.eventName,
          booking.venue,
          booking.userInfo?.name,
          booking.userInfo?.email,
          booking.status,
          booking.paymentStatus,
        ]
          .join(" ")
          .toLowerCase()

        const matchesSearch = !keyword || searchable.includes(keyword)

        return matchesStatus && matchesEvent && matchesSearch
      })
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [bookings, statusFilter, eventFilter, searchQuery])

  const filteredOfficeRentals = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()

    return officeRentals
      .filter((rental) => {
        const searchable = [
          rental.id,
          rental.clientName,
          rental.officeSpaceName,
          rental.leaseStatus,
          rental.rentalTerm,
        ]
          .join(" ")
          .toLowerCase()

        return !keyword || searchable.includes(keyword)
      })
      .sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  }, [officeRentals, searchQuery])

  return (
    <div className="mx-auto w-full max-w-[1400px] animate-in fade-in p-5 duration-500 md:p-8 xl:p-10">
      <BookingDetailsModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onOpenChange={(open) => {
          if (!open) setSelectedBooking(null)
        }}
        onDeclineOpen={(booking) => setDeclineTarget(booking)}
      />

      <DeclineCancellationModal
        booking={declineTarget}
        open={!!declineTarget}
        onOpenChange={(open) => {
          if (!open) setDeclineTarget(null)
        }}
      />

      <MaintenanceCalendarModal
        open={isMaintenanceOpen}
        onOpenChange={setIsMaintenanceOpen}
      />

      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-orange-600">
            Admin Booking Management
          </p>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            Bookings
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Manage venue bookings, cancellation requests, refunds, contracts,
            e-receipts, office rentals, and maintenance dates.
          </p>
        </div>

        {mode === "venue" && (
          <Button
            type="button"
            onClick={() => setIsMaintenanceOpen(true)}
            className="h-11 w-full rounded-xl bg-slate-900 px-5 text-xs font-black text-white shadow-sm hover:bg-slate-800 sm:w-auto"
          >
            <Wrench className="mr-2 h-4 w-4" />
            Maintenance Calendar
          </Button>
        )}
      </div>

      <div className="mb-5 flex w-full justify-center lg:justify-end">
        <div className="grid w-full grid-cols-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm sm:w-[430px]">
          <button
            type="button"
            onClick={() => setMode("venue")}
            className={`rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] transition ${
              mode === "venue"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            Venue
          </button>

          <button
            type="button"
            onClick={() => setMode("office")}
            className={`rounded-full px-5 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] transition ${
              mode === "office"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-orange-50 hover:text-orange-600"
            }`}
          >
            Office Rentals
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-600">
            {mode === "venue" ? "Venue Booking Records" : "Office Rental Requests"}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {mode === "venue"
              ? "Search and filter booking records."
              : "Track face-to-face contract signing and cheque submissions."}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center md:justify-end">
          {mode === "venue" && (
            <>
              <div className="relative w-full sm:w-[320px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search bookings..."
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm font-bold shadow-sm"
                />
              </div>

              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white font-bold shadow-sm sm:w-[210px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value={ALL_VALUE}>All Events</SelectItem>
                  {eventOptions.map((eventName) => (
                    <SelectItem key={eventName} value={eventName}>
                      {eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 bg-white font-bold shadow-sm sm:w-[190px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>

                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {mode === "office" && (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:max-w-[430px]">
                <p className="text-xs font-bold leading-5 text-amber-800">
                  Office rental cheque payments are face-to-face only. No online cheque upload.
                </p>
              </div>

              <div className="relative w-full sm:w-[340px]">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search office rentals..."
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-4 text-sm font-bold shadow-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {mode === "venue" ? (
        filteredBookings.length > 0 ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 lg:grid lg:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_.55fr] lg:gap-4">
              <div>Booking ID</div>
              <div>Client / Event</div>
              <div>Date</div>
              <div>Payment</div>
              <div>Status</div>
              <div className="text-right">Action</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="grid gap-4 px-6 py-5 transition hover:bg-orange-50/30 lg:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_.55fr] lg:items-center"
                >
                  <div>
                    <p className="text-sm font-black text-slate-950">{booking.id}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {formatDate(booking.createdAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {booking.userInfo?.name || "Client"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-orange-600">
                      {booking.eventName}
                    </p>
                    <p className="text-xs font-semibold text-slate-400">
                      {booking.venue}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {formatDate(booking.date)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {booking.time || `${booking.startTime} - ${booking.endTime}`}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-800">
                      {formatMoney(booking.amountPaid || booking.totalPrice)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {getPaymentMethodLabel(booking.paymentMethod)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <StatusBadge
                      label={getStatusLabel(booking.status)}
                      className={getStatusClass(booking.status)}
                    />

                    {booking.refundStatus && (
                      <div>
                        <StatusBadge
                          label={booking.refundStatus}
                          className={getRefundClass(booking.refundStatus)}
                        />
                      </div>
                    )}
                  </div>

                  <div className="lg:text-right">
                    <Button
                      onClick={() => setSelectedBooking(booking)}
                      className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-black text-white hover:bg-slate-800"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-14 text-center">
            <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-xl font-black text-slate-700">No bookings found</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Try another filter or search keyword.
            </p>
          </div>
        )
      ) : filteredOfficeRentals.length > 0 ? (
        <div className="space-y-5">
          {filteredOfficeRentals.map((rental) => (
            <OfficeRentalCard key={rental.id} rental={rental} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-14 text-center">
          <Inbox className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-xl font-black text-slate-700">No office rental requests</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Office rental requests will appear here after client submission.
          </p>
        </div>
      )}
    </div>
  )
}

export default function AdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }
    >
      <AdminBookingsContent />
    </Suspense>
  )
}