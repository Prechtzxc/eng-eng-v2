"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  MapPin,
  PhilippinePeso,
  Plus,
  Receipt,
  ShieldAlert,
  Star,
  Users,
  X,
} from "lucide-react"

import { useAuth } from "@/src/modules/shared/auth/auth-context"
import {
  type Booking,
  calculateDaysBeforeEvent,
  getCancellationMessage,
  getRefundStatusLabel,
  isCancellationAllowed,
  isRefundEligible,
  useBookings,
} from "@/src/modules/client/contexts/booking-context"
import { Button } from "@/src/modules/shared/components/ui/button"
import { ReserveDialog } from "@/src/modules/client/components/reserve-dialog"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/src/modules/shared/components/ui/dialog"
import { Input } from "@/src/modules/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/modules/shared/components/ui/select"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Textarea } from "@/src/modules/shared/components/ui/textarea"

type ReviewRecord = {
  id: string
  bookingId: string
  eventId?: string
  eventName: string
  venue?: string
  customerName?: string
  rating: number
  comment: string
  createdAt: string
}

const REVIEW_STORAGE_KEY = "oneestela_event_reviews_v1"
const REVIEW_EVENT_NAME = "oneestela_reviews_updated"

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`
}

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isPastDate(date: Date) {
  return startOfDay(date).getTime() < startOfDay(new Date()).getTime()
}

function normalizeBookingStatus(status?: string) {
  return String(status || "").trim().toLowerCase()
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function safeParseReviews(value: string | null): ReviewRecord[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadReviews() {
  if (typeof window === "undefined") return []
  return safeParseReviews(window.localStorage.getItem(REVIEW_STORAGE_KEY))
}

function saveReviews(reviews: ReviewRecord[]) {
  if (typeof window === "undefined") return

  window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviews))
  window.dispatchEvent(new Event(REVIEW_EVENT_NAME))
}

function hasReviewForBooking(reviews: ReviewRecord[], bookingId: string | number) {
  return reviews.some((review) => String(review.bookingId) === String(bookingId))
}

function getBookingEventName(booking: Booking | null) {
  if (!booking) return "Booked Event"
  return booking.eventName || booking.eventType || booking.venue || "Booked Event"
}

function getBookingCustomerName(booking: Booking | null) {
  const userInfo = (booking as any)?.userInfo

  return userInfo?.name || userInfo?.fullName || userInfo?.email || "Customer"
}

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

function getPaymentMethodLabel(method?: string) {
  if (method === "cash") return "Cash / Pay at the Office"
  if (method === "bank") return "Bank Transfer"
  return "Not yet selected"
}

const ContractReminder = ({ booking }: { booking: Booking }) => {
  if (booking.contractSigningRequired === false) return null

  const isSigned = booking.contractSigned || booking.contractStatus === "Signed"

  return (
    <div
      className={`rounded-xl border p-3 ${
        isSigned ? "border-emerald-200 bg-emerald-50" : "border-orange-200 bg-orange-50"
      }`}
    >
      <div className="flex items-start gap-2">
        {isSigned ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        ) : (
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
        )}

        <div>
          <p
            className={`text-xs font-black uppercase tracking-[0.12em] ${
              isSigned ? "text-emerald-700" : "text-orange-700"
            }`}
          >
            Contract Status: {isSigned ? "Signed" : "Pending"}
          </p>

          <p
            className={`mt-1 text-xs font-semibold leading-5 ${
              isSigned ? "text-emerald-700" : "text-orange-800"
            }`}
          >
            {isSigned
              ? `Contract signed${booking.contractSignedDate ? ` on ${formatDate(booking.contractSignedDate)}` : ""}.`
              : "Please visit One Estela Place office after booking to sign the contract and finalize your reservation."}
          </p>
        </div>
      </div>
    </div>
  )
}

const CancellationInfo = ({ booking }: { booking: Booking }) => {
  const daysBefore = calculateDaysBeforeEvent(booking.date)
  const allowed = isCancellationAllowed(booking.date)
  const refundEligible = isRefundEligible(booking.date)

  if (booking.status === "cancelled") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
          Cancellation Status
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-700">
          {booking.cancellationStatusLabel || "Cancellation Approved"}
        </p>

        {booking.refundStatus && (
          <p className="mt-1 text-xs font-semibold text-orange-700">
            Refund: {getRefundStatusLabel(booking.refundStatus)}
          </p>
        )}

        {booking.refundInstructions && (
          <p className="mt-1 text-xs leading-5 text-slate-600">{booking.refundInstructions}</p>
        )}
      </div>
    )
  }

  if (booking.cancellationStatus === "declined" || booking.cancellationStatusLabel === "Cancellation Declined") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-rose-600">
          Cancellation Declined
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-rose-700">
          Your cancellation request was declined.
          {booking.cancellationDeclineReason ? ` Reason: ${booking.cancellationDeclineReason}` : ""}
          {getCancellationCooldownInfo(booking).active ? ` ${getCancellationCooldownInfo(booking).label}` : ""}
        </p>
      </div>
    )
  }

  if (booking.status === "cancellation_requested") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
          Cancellation Requested
        </p>
        <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
          Admin is reviewing your cancellation request.
          {booking.refundEligible
            ? " This booking is eligible for cash refund once approved."
            : " This booking is not eligible for refund."}
        </p>
      </div>
    )
  }

  return (
    <div
      className={`rounded-xl border p-3 ${
        allowed
          ? refundEligible
            ? "border-emerald-200 bg-emerald-50"
            : "border-orange-200 bg-orange-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.14em] ${
          allowed
            ? refundEligible
              ? "text-emerald-700"
              : "text-orange-700"
            : "text-slate-500"
        }`}
      >
        Cancellation Info
      </p>

      <p
        className={`mt-1 text-xs font-semibold leading-5 ${
          allowed
            ? refundEligible
              ? "text-emerald-700"
              : "text-orange-800"
            : "text-slate-600"
        }`}
      >
        {getCancellationMessage(booking.date)}
      </p>

      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        Days before event: {daysBefore}
      </p>
    </div>
  )
}

const ReceiptModal = ({ booking }: { booking: Booking }) => {
  const receipt = booking.receipt as any
  const isOfficeRental =
    Boolean((booking as any).isOfficeRental) ||
    (booking as any).bookingType === "office" ||
    String(booking.venue || "").toLowerCase().includes("office")

  const amountPaid =
    receipt?.amountPaid ?? receipt?.paymentAmount ?? (booking as any).amountPaid ?? 0
  const remainingBalance =
    receipt?.remainingBalance ??
    (booking as any).remainingBalance ??
    Math.max(Number((booking as any).totalPrice || 0) - Number(amountPaid || 0), 0)
  const contractTerm =
    receipt?.contractTerm || (booking as any).contractTerm || (booking as any).rentalTerm
  const paymentMethod =
    receipt?.paymentMethod || getPaymentMethodLabel((booking as any).paymentMethod)
  const paymentType = isOfficeRental
    ? "Slot Reservation Only"
    : receipt?.paymentType || receipt?.paymentPurpose || "Booking Payment"
  const paymentStatus = receipt?.paymentStatus || booking.paymentStatus || "Payment Verified"
  const dateGenerated = receipt?.dateGenerated || receipt?.dateIssued || new Date().toISOString()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-bold"
        >
          <Receipt className="mr-1.5 h-3.5 w-3.5" />
          E-Receipt
        </Button>
      </DialogTrigger>

      <DialogContent className="!w-[calc(100vw-1.5rem)] !max-w-[680px] overflow-hidden rounded-[1.35rem] border-slate-200 bg-white p-0 shadow-2xl [&>button]:hidden">
        {!receipt ? (
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-xl font-black text-slate-950">
                  E-Receipt Not Generated Yet
                </DialogTitle>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  The system will automatically generate your e-receipt after admin verifies your payment.
                </p>
              </div>

              <DialogClose asChild>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Receipt className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-black text-slate-700">
                No system-generated receipt yet.
              </p>
              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Booking ID: {booking.id}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-h-[92vh] overflow-y-auto p-4 sm:p-5">
            <div className="rounded-[1.1rem] border border-slate-200 bg-white shadow-sm">
              <div className="relative border-b border-dashed border-slate-200 px-5 py-4 text-center">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </DialogClose>

                <DialogTitle className="text-xl font-black tracking-wide text-slate-950 sm:text-2xl">
                  ONE ESTELA PLACE
                </DialogTitle>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">
                  System-Generated E-Receipt
                </p>

                <div className="mx-auto mt-3 grid max-w-xl gap-1 text-xs font-bold text-slate-600 sm:grid-cols-2 sm:text-left">
                  <p>
                    <span className="text-slate-400">Receipt No:</span>{" "}
                    <span className="text-slate-900">
                      {receipt.receiptNumber || receipt.receiptNo || "N/A"}
                    </span>
                  </p>
                  <p className="sm:text-right">
                    <span className="text-slate-400">Date Generated:</span>{" "}
                    <span className="text-slate-900">{formatDate(dateGenerated)}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3 px-5 py-4">
                <ReceiptSection title="Customer Information">
                  <ReceiptLine
                    label="Customer Name"
                    value={receipt.fullName || booking.userInfo?.name || "Client"}
                  />
                </ReceiptSection>

                <ReceiptDivider />

                <ReceiptSection title="Booking Details">
                  <ReceiptLine label="Booking ID" value={receipt.bookingId || booking.id} />
                  <ReceiptLine
                    label={isOfficeRental ? "Rental Type" : "Event Type"}
                    value={
                      isOfficeRental
                        ? "Office Space Rental"
                        : receipt.eventType || (booking as any).eventType || "Event Venue Rental"
                    }
                  />
                  <ReceiptLine
                    label="Venue Reserved"
                    value={receipt.venueReserved || receipt.venue || booking.venue || "N/A"}
                  />
                  <ReceiptLine
                    label={isOfficeRental ? "Reservation Date" : "Event Date"}
                    value={formatDate(receipt.startDate || booking.date)}
                  />
                  <ReceiptLine
                    label={isOfficeRental ? "Contract Term" : "Reservation Time"}
                    value={isOfficeRental ? contractTerm || "N/A" : booking.time || `${booking.startTime || ""} - ${booking.endTime || ""}`}
                  />
                </ReceiptSection>

                <ReceiptDivider />

                <ReceiptSection title="Payment Details">
                  <ReceiptLine label="Payment Method" value={paymentMethod} />
                  <ReceiptLine label="Payment Type" value={paymentType} />
                  <ReceiptLine label="Amount Paid" value={formatMoney(amountPaid)} highlight />
                  {!isOfficeRental && (
                    <ReceiptLine label="Remaining Balance" value={formatMoney(remainingBalance)} />
                  )}
                </ReceiptSection>

                <ReceiptDivider />

                <ReceiptSection title="Payment Status">
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-emerald-50 px-4 py-3">
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-700">
                      Status
                    </span>
                    <span className="text-right text-sm font-black text-emerald-700">
                      {paymentStatus}
                    </span>
                  </div>
                </ReceiptSection>

                <ReceiptDivider />

                <div className="rounded-xl bg-orange-50 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700">
                    Important Notice
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-orange-950 sm:text-sm">
                    {isOfficeRental
                      ? "This receipt serves as proof that the slot reservation payment has been verified. This is not full payment, not monthly rental payment, and not cheque payment. Succeeding payments are settled onsite via check."
                      : "This receipt serves as proof that the reservation payment has been verified by the administrator of One Estela Place."}
                  </p>
                </div>

                <p className="text-center text-xs font-bold text-slate-500">
                  Thank you for choosing One Estela Place.
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReceiptSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function ReceiptLine({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 font-semibold text-slate-500">{label}:</span>
      <span
        className={`break-words text-right font-black ${
          highlight ? "text-orange-600" : "text-slate-950"
        }`}
      >
        {value || "N/A"}
      </span>
    </div>
  )
}

function ReceiptDivider() {
  return <div className="border-t border-dashed border-slate-200" />
}

const WriteReviewModal = ({
  open,
  booking,
  reviews,
  onClose,
  onSaved,
}: {
  open: boolean
  booking: Booking | null
  reviews: ReviewRecord[]
  onClose: () => void
  onSaved: (reviews: ReviewRecord[]) => void
}) => {
  const { toast } = useToast()

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (!open) {
      setRating(5)
      setComment("")
    }
  }, [open])

  const eventName = getBookingEventName(booking)

  const handleSubmit = () => {
    if (!booking) return

    if (!comment.trim()) {
      toast({
        title: "Review required",
        description: "Please write a short review before submitting.",
        variant: "destructive",
      })
      return
    }

    if (hasReviewForBooking(reviews, booking.id)) {
      toast({
        title: "Already reviewed",
        description: "You already wrote a review for this booking.",
        variant: "destructive",
      })
      return
    }

    const nextReviews: ReviewRecord[] = [
      {
        id: createLocalId("review"),
        bookingId: String(booking.id),
        eventId: String((booking as any)?.eventId || (booking as any)?.venueId || ""),
        eventName,
        venue: booking.venue,
        customerName: getBookingCustomerName(booking),
        rating: Math.min(5, Math.max(1, rating)),
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      },
      ...reviews,
    ]

    saveReviews(nextReviews)
    onSaved(nextReviews)

    toast({
      title: "Review submitted",
      description: "Your review has been added to this event.",
      className: "bg-slate-900 text-white border-none",
    })

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[95vw] rounded-2xl border-slate-200 p-6 shadow-xl sm:max-w-md">
        <DialogTitle className="text-xl font-black text-slate-900">
          Write a Review
        </DialogTitle>

        <p className="mt-1 text-sm font-medium text-slate-500">
          Share your experience for{" "}
          <span className="font-bold text-orange-600">{eventName}</span>.
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Rating
            </Label>

            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-full p-1 transition hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${
                      value <= rating
                        ? "fill-orange-500 text-orange-500"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Review
            </Label>

            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Tell us about your experience..."
              className="mt-2 min-h-[120px] resize-none rounded-xl border-slate-200 bg-slate-50 text-sm focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-bold"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSubmit}
              className="h-10 flex-1 rounded-xl bg-orange-600 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
            >
              Submit Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const PaymentConfirmationModal = ({
  booking,
  isProceeding,
  onClose,
  onConfirm,
}: {
  booking: Booking | null
  isProceeding: boolean
  onClose: () => void
  onConfirm: () => void
}) => {
  if (!booking) return null

  const totalAmount =
    (booking as any)?.totalPrice || (booking as any)?.totalAmount || (booking as any)?.amount || 0

  const paymentMethod = (booking as any)?.paymentMethod || "To be selected on payment page"

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] rounded-2xl border-slate-200 p-6 shadow-xl sm:max-w-lg">
        <DialogTitle className="text-xl font-black text-slate-900">
          Confirm Payment Details
        </DialogTitle>

        <p className="mt-1 text-sm font-medium text-slate-500">
          Please review your booking details before proceeding to payment.
        </p>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
              <div>
                <p className="font-black text-orange-900">
                  Double-check before checkout
                </p>
                <p className="mt-1 text-sm font-semibold text-orange-700">
                  Make sure the event, date, venue, and amount are correct.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Booking Summary
            </p>

            <div className="space-y-3 text-sm font-semibold text-slate-600">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <div>
                  <p className="font-black text-slate-950">
                    {booking.eventName || booking.eventType || "Selected Event"}
                  </p>
                  <p>{booking.venue}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 shrink-0 text-orange-600" />
                <span>{formatDate(booking.date)}</span>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-orange-600" />
                <span>{booking.time || `${booking.startTime} - ${booking.endTime}`}</span>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 shrink-0 text-orange-600" />
                <span>{paymentMethod}</span>
              </div>

              <div className="flex items-center gap-3">
                <PhilippinePeso className="h-4 w-4 shrink-0 text-orange-600" />
                <span className="text-lg font-black text-orange-600">
                  {formatMoney(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProceeding}
            className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-bold"
          >
            Go Back
          </Button>

          <Button
            onClick={onConfirm}
            disabled={isProceeding}
            className="h-10 flex-1 rounded-xl bg-orange-600 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
          >
            {isProceeding ? "Proceeding..." : "Proceed to Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const CancellationDialog = ({
  booking,
  reason,
  setReason,
  onClose,
  onSubmit,
}: {
  booking: Booking | null
  reason: string
  setReason: (value: string) => void
  onClose: () => void
  onSubmit: () => void
}) => {
  if (!booking) return null

  const allowed = isCancellationAllowed(booking.date)
  const refundEligible = isRefundEligible(booking.date)

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] rounded-2xl border-slate-200 p-6 shadow-xl sm:max-w-md">
        <DialogTitle className="text-xl font-black text-slate-900">
          Request Cancellation
        </DialogTitle>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">{booking.eventName}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {booking.venue} · {formatDate(booking.date)}
          </p>
        </div>

        <div
          className={`mt-4 rounded-2xl border p-4 ${
            allowed
              ? refundEligible
                ? "border-emerald-200 bg-emerald-50"
                : "border-orange-200 bg-orange-50"
              : "border-rose-200 bg-rose-50"
          }`}
        >
          <div className="flex gap-3">
            <ShieldAlert
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                allowed
                  ? refundEligible
                    ? "text-emerald-600"
                    : "text-orange-600"
                  : "text-rose-600"
              }`}
            />
            <p
              className={`text-sm font-semibold leading-6 ${
                allowed
                  ? refundEligible
                    ? "text-emerald-700"
                    : "text-orange-800"
                  : "text-rose-700"
              }`}
            >
              {getCancellationMessage(booking.date)}
            </p>
          </div>
        </div>

        {allowed && (
          <div className="mt-4">
            <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Reason for cancellation *
            </Label>

            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Type your reason here..."
              className="mt-2 min-h-[110px] resize-none rounded-xl border-slate-200 bg-slate-50 p-4 text-sm focus-visible:ring-2 focus-visible:ring-orange-500"
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-bold"
          >
            Close
          </Button>

          <Button
            disabled={!allowed || !reason.trim()}
            onClick={onSubmit}
            className="h-10 flex-1 rounded-xl bg-orange-600 text-xs font-bold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50"
          >
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const ModifyDialogContent = ({
  booking,
  allBookings,
}: {
  booking: Booking
  allBookings: Booking[]
}) => {
  const { toast } = useToast()
  const { maintenanceDates, updateBookingStatus } = useBookings()

  const todayStart = useMemo(() => startOfDay(new Date()), [])

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const bookingDate = new Date(booking.date)

    if (Number.isNaN(bookingDate.getTime())) {
      return new Date(todayStart.getFullYear(), todayStart.getMonth(), 1)
    }

    return new Date(bookingDate.getFullYear(), bookingDate.getMonth(), 1)
  })

  const [selectedDate, setSelectedDate] = useState<string | null>(booking.date)
  const [selectedDuration, setSelectedDuration] = useState<string | null>(
    booking.time || null
  )
  const [guests, setGuests] = useState<number | "">(booking.guestCount)

  const year = calendarMonth.getFullYear()
  const month = calendarMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const emptySlots = Array.from({ length: firstDay }).map((_, index) => null)
  const days = Array.from({ length: daysInMonth }).map((_, index) => index + 1)

  const venueSlots = [
    { start: 8, end: 14, startTimeLabel: "8:00 AM", label: "8:00 AM - 2:00 PM" },
    { start: 9, end: 15, startTimeLabel: "9:00 AM", label: "9:00 AM - 3:00 PM" },
    { start: 10, end: 16, startTimeLabel: "10:00 AM", label: "10:00 AM - 4:00 PM" },
    { start: 11, end: 17, startTimeLabel: "11:00 AM", label: "11:00 AM - 5:00 PM" },
    { start: 12, end: 18, startTimeLabel: "12:00 PM", label: "12:00 PM - 6:00 PM" },
    { start: 13, end: 19, startTimeLabel: "1:00 PM", label: "1:00 PM - 7:00 PM" },
    { start: 14, end: 20, startTimeLabel: "2:00 PM", label: "2:00 PM - 8:00 PM" },
    { start: 15, end: 21, startTimeLabel: "3:00 PM", label: "3:00 PM - 9:00 PM" },
    { start: 16, end: 22, startTimeLabel: "4:00 PM", label: "4:00 PM - 10:00 PM" },
  ]

  const getParsedTime = (timeStr: string) =>
    venueSlots.find((slot) => slot.label === timeStr)

  const existingBookings = allBookings.filter(
    (item) =>
      item.date === selectedDate &&
      item.venue === booking.venue &&
      item.id !== booking.id &&
      item.status !== "cancelled" &&
      item.status !== "declined"
  )

  const availableVenueSlots = venueSlots.filter((slot) => {
    return !existingBookings.some((item) => {
      if (!item.time) return false

      const parsedBookingTime = getParsedTime(item.time)

      if (!parsedBookingTime) return false

      return slot.start <= parsedBookingTime.end && slot.end >= parsedBookingTime.start
    })
  })

  const handleSave = () => {
    if (!selectedDate || !selectedDuration || !guests) return

    const parsedSelectedDate = new Date(selectedDate)

    if (isPastDate(parsedSelectedDate)) {
      toast({
        title: "Invalid Date",
        description: "Past dates cannot be selected or booked.",
        variant: "destructive",
      })
      return
    }

    updateBookingStatus(booking.id, "pending")

    toast({
      title: "Modification Request Sent",
      description: "Admin will review your new date and time request shortly.",
      className: "bg-slate-900 text-white border-none",
    })
  }

  return (
    <DialogContent className="flex h-[90vh] w-[95vw] flex-col overflow-hidden rounded-[1.5rem] border-0 bg-slate-50 p-0 shadow-2xl sm:rounded-2xl md:max-h-[85vh] md:max-w-[700px] xl:max-w-[800px]">
      <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-5">
        <div>
          <DialogTitle className="mb-0.5 text-xl font-black text-slate-900">
            Modify Booking
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Update the details for{" "}
            <span className="font-bold text-orange-600">{booking.venue}</span>.
          </p>
        </div>

        <DialogTrigger asChild>
          <button
            aria-label="Close Modal"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogTrigger>
      </div>

      <div className="flex-1 overflow-y-auto p-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900">
              Select New Date
            </Label>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                  className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <h5 className="text-xs font-black text-slate-900 md:text-sm">
                  {calendarMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h5>

                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                  className="rounded-full p-1 hover:bg-slate-100"
                >
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="mb-1.5 grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                  <div key={day} className="text-[8px] font-bold uppercase text-slate-400">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 justify-items-center gap-x-1 gap-y-1">
                {emptySlots.map((_, index) => (
                  <div key={`empty-${index}`} className="h-7 w-7" />
                ))}

                {days.map((day) => {
                  const iterDate = new Date(year, month, day)
                  const iterDateStr = toDateKey(iterDate)

                  const isSelected = selectedDate === iterDateStr
                  const isPast = isPastDate(iterDate)
                  const isMaintenance =
                    maintenanceDates?.includes(iterDateStr) ||
                    maintenanceDates?.includes(`${booking.venueId}|${iterDateStr}`)
                  const isDisabled = isPast || isMaintenance

                  let statusClass =
                    "bg-transparent hover:bg-orange-50 text-slate-700 font-bold"

                  if (isPast) {
                    statusClass =
                      "bg-transparent text-slate-300 opacity-40 cursor-not-allowed"
                  } else if (isMaintenance) {
                    statusClass = "bg-slate-800 text-slate-400 cursor-not-allowed"
                  }

                  if (isSelected && !isDisabled) {
                    statusClass = "bg-orange-600 text-white shadow-md scale-105 font-bold"
                  }

                  return (
                    <button
                      aria-label={`Select ${iterDateStr}`}
                      key={iterDateStr}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return
                        setSelectedDate(iterDateStr)
                        setSelectedDuration(null)
                      }}
                      className={`flex aspect-square h-7 w-7 items-center justify-center rounded-full text-[10px] outline-none transition-all ${statusClass}`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900">
                Select New Time
              </Label>

              {!selectedDate ? (
                <div className="flex h-[80px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select a date first
                </div>
              ) : (
                <Select value={selectedDuration || ""} onValueChange={setSelectedDuration}>
                  <SelectTrigger className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-orange-600">
                    <SelectValue placeholder="Select Start Time" />
                  </SelectTrigger>

                  <SelectContent className="max-h-[200px] rounded-xl border-slate-200 shadow-xl">
                    {availableVenueSlots.length > 0 ? (
                      availableVenueSlots.map((slot) => (
                        <SelectItem
                          key={slot.label}
                          value={slot.label}
                          className="cursor-pointer py-2 text-xs font-bold text-slate-700 focus:bg-orange-50 focus:text-orange-600"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-orange-600" />
                            {slot.startTimeLabel}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="m-1 rounded-md bg-slate-50 p-3 text-center text-[10px] font-bold text-slate-400">
                        🚫 Fully Booked
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900">
                Expected Guests
              </Label>

              <Input
                type="number"
                value={guests}
                onChange={(event) => setGuests(parseInt(event.target.value) || "")}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 flex shrink-0 justify-end border-t border-slate-200 bg-white p-5">
        <Button
          onClick={handleSave}
          disabled={!selectedDate || !selectedDuration || !guests}
          className="h-10 w-full rounded-lg bg-orange-600 px-6 text-sm font-bold text-white shadow-sm transition-transform hover:bg-orange-700 active:scale-95 disabled:opacity-50 sm:w-auto"
        >
          Submit Modification Request
        </Button>
      </div>
    </DialogContent>
  )
}


function EnhancedBookingCard({
  booking,
  alreadyReviewed,
  cancellationAllowed,
  myBookings,
  onPay,
  onCancelRequest,
  onReview,
}: {
  booking: Booking
  alreadyReviewed: boolean
  cancellationAllowed: boolean
  myBookings: Booking[]
  onPay: (booking: Booking) => void
  onCancelRequest: (booking: Booking) => void
  onReview: (booking: Booking) => void
}) {
  const status = normalizeBookingStatus(booking.status)
  const isOfficeRental = isOfficeBooking(booking)
  const dateLabel = formatBookingCardDate(booking.date)
  const timeLabel = getBookingCardTime(booking)
  const venueLabel = booking.venue || "One Estela Place"
  const typeLabel = isOfficeRental
    ? "Office Space Rental"
    : booking.eventType || "Event Venue Rental"
  const guestOrTerm = isOfficeRental
    ? formatContractTerm(booking.contractTerm || booking.rentalTerm || booking.time || "Office Rental")
    : `${booking.guestCount || 0} pax`
  const paymentLabel = isOfficeRental
    ? "Slot Reservation"
    : formatTextLabel(booking.paymentType || booking.paymentStatus || "Pending")

  return (
    <div className="group flex overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
      <div className="flex w-full flex-col">
        {/* IMAGE HEADER */}
        <div className="relative h-48 overflow-hidden bg-slate-950 sm:h-52">
          <img
            src={getBookingCardImage(booking)}
            alt={venueLabel}
            className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.display = "none"
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-slate-950/20" />

          <div className="absolute left-4 top-4 max-w-[58%] rounded-full bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur">
            <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-800">
              {venueLabel}
            </p>
          </div>

          <div className="absolute right-4 top-4">
            <BookingHeroStatusBadge status={booking.status} />
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-2xl font-black tracking-tight text-white drop-shadow-sm">
              {dateLabel}
            </p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/75">
              {booking.id}
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4">
            <h3 className="line-clamp-2 text-xl font-black leading-tight text-slate-950">
              {booking.eventName || "Untitled Booking"}
            </h3>

            <p className="mt-1 text-sm font-bold text-orange-600">
              {typeLabel}
            </p>
          </div>

          <div className="grid gap-3">
            <BookingInfoPill
              icon={<Clock className="h-4 w-4" />}
              label="Time"
              value={timeLabel}
            />

            <BookingInfoPill
              icon={<MapPin className="h-4 w-4" />}
              label="Venue"
              value={venueLabel}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <BookingInfoPill
                icon={<Users className="h-4 w-4" />}
                label={isOfficeRental ? "Contract" : "Guests"}
                value={guestOrTerm}
              />

              <BookingInfoPill
                icon={<CreditCard className="h-4 w-4" />}
                label="Payment"
                value={paymentLabel}
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <ContractReminder booking={booking} />

            {isOfficeRental ? (
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-700">
                  Office Rental Notice
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-orange-900">
                  Slot reservation only. Succeeding payments are handled onsite via check after contract signing.
                </p>
              </div>
            ) : (
              <CancellationInfo booking={booking} />
            )}
          </div>

          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
            {booking.status === "pending" && (
              <Button
                onClick={() => onPay(booking)}
                className="h-10 rounded-xl bg-orange-600 text-xs font-bold text-white shadow-sm hover:bg-orange-700"
              >
                <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                Pay
              </Button>
            )}

            <ReceiptModal booking={booking} />

            {canWriteReviewFromCard(status, alreadyReviewed, isOfficeRental) && (
              <Button
                onClick={() => onReview(booking)}
                className="h-10 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <Star className="mr-1.5 h-3.5 w-3.5" />
                Review
              </Button>
            )}

            {(status === "completed" || status === "complete") && alreadyReviewed && !isOfficeRental && (
              <Button
                disabled
                variant="outline"
                className="h-10 rounded-xl border-blue-100 bg-blue-50 text-xs font-bold text-blue-600 opacity-100"
              >
                Reviewed
              </Button>
            )}

            {(booking.status === "pending" || booking.status === "confirmed") && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 rounded-xl border-slate-200 text-xs font-bold"
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Modify
                  </Button>
                </DialogTrigger>

                <ModifyDialogContent booking={booking} allBookings={myBookings} />
              </Dialog>
            )}

            {cancellationAllowed ? (
              <Button
                onClick={() => onCancelRequest(booking)}
                variant="ghost"
                className="h-10 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <X className="mr-1.5 h-3.5 w-3.5" />
                Cancel
              </Button>
            ) : (
              booking.status !== "cancelled" &&
              booking.status !== "completed" &&
              booking.status !== "cancellation_requested" &&
              !isOfficeRental && (
                <Button
                  disabled
                  variant="ghost"
                  className="h-10 rounded-xl text-xs font-bold text-slate-400 opacity-100"
                >
                  Cancel Closed
                </Button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingInfoPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <div className="shrink-0 text-orange-500">{icon}</div>

      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-black text-slate-900">
          {value || "N/A"}
        </p>
      </div>
    </div>
  )
}

function BookingHeroStatusBadge({ status }: { status?: string }) {
  const normalized = normalizeBookingStatus(status)
  const base =
    "inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"

  if (["confirmed", "reservation secured", "reservation_secured", "slot verified", "slot_verified", "slot secured", "slot_secured"].includes(normalized)) {
    return <span className={`${base} bg-emerald-500`}>Confirmed</span>
  }

  if (normalized === "completed" || normalized === "complete") {
    return <span className={`${base} bg-blue-600`}>Completed</span>
  }

  if (normalized === "pending" || normalized === "verifying") {
    return <span className={`${base} bg-orange-500`}>Pending</span>
  }

  if (normalized === "cancellation requested" || normalized === "cancellation_requested") {
    return <span className={`${base} bg-amber-500`}>Cancel Req</span>
  }

  if (normalized === "cancelled" || normalized === "declined") {
    return <span className={`${base} bg-rose-500`}>Cancelled</span>
  }

  return <span className={`${base} bg-slate-700`}>{formatTextLabel(status || "Unknown")}</span>
}

function getBookingCardImage(booking: Booking) {
  const venue = String(booking?.venue || "").toLowerCase()
  const eventType = String(booking?.eventType || "").toLowerCase()

  const customImage =
    (booking as any)?.imageUrl ||
    (booking as any)?.venueImage ||
    (booking as any)?.image ||
    ""

  if (customImage) return customImage

  if (venue.includes("office")) return "/images/tour-reference.png"
  if (venue.includes("milestone")) return "/images/venue-chandelier.png"
  if (venue.includes("moment")) return "/images/venue-interior.jpg"
  if (venue.includes("conference")) return "/images/venue-interior.jpg"
  if (venue.includes("garden")) return "/images/cta-background.png"
  if (eventType.includes("wedding")) return "/images/venue-chandelier.png"

  return "/images/venue-interior.jpg"
}

function getBookingCardTime(booking: Booking) {
  if (booking?.time) return booking.time

  if (booking?.startTime || booking?.endTime) {
    return `${booking?.startTime || "No start"} - ${booking?.endTime || "No end"}`
  }

  return "No time"
}

function formatBookingCardDate(dateValue?: string) {
  if (!dateValue) return "No date"

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return dateValue

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function isOfficeBooking(booking: Booking) {
  const text = [
    (booking as any)?.bookingType,
    (booking as any)?.rentalType,
    booking?.venue,
    booking?.eventType,
  ]
    .join(" ")
    .toLowerCase()

  return text.includes("office")
}

function formatContractTerm(value?: string) {
  if (!value) return "Office Rental"

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatTextLabel(value?: string) {
  return String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function canWriteReviewFromCard(
  status: string,
  alreadyReviewed: boolean,
  isOfficeRental: boolean
) {
  return (
    !isOfficeRental &&
    !alreadyReviewed &&
    (status === "completed" || status === "complete")
  )
}


function getCancellationCooldownInfo(booking: Booking) {
  const cooldownRaw = (booking as any).cancellationCooldownUntil
  if (!cooldownRaw) return { active: false, label: "" }

  const cooldownTime = new Date(cooldownRaw).getTime()
  if (Number.isNaN(cooldownTime) || cooldownTime <= Date.now()) {
    return { active: false, label: "" }
  }

  const label = new Date(cooldownTime).toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  })

  return {
    active: true,
    label: `Your cancellation request was declined. You may submit another request after 1 hour. You can request cancellation again at ${label}.`,
  }
}

function isSlotSecuredForCancellation(booking: Booking) {
  const status = String(booking.status || "").toLowerCase()
  const paymentStatus = String(booking.paymentStatus || "").toLowerCase()

  return Boolean(
    booking.isSlotSecured ||
      booking.verifiedByAdmin ||
      ["confirmed", "completed", "reservation_secured", "slot_secured"].includes(status) ||
      ["paid", "verified", "partial", "slot_verified"].includes(paymentStatus),
  )
}

export default function MyBookingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { getUserBookings, cancelBooking, requestCancellation } = useBookings()
  const { toast } = useToast()

  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<Booking | null>(null)
  const [isPaymentProceeding, setIsPaymentProceeding] = useState(false)

  useEffect(() => {
    if (user) {
      setMyBookings(getUserBookings(user.id))
    } else {
      const stored = localStorage.getItem("oneestela_global_bookings_v2")
      if (stored) setMyBookings(JSON.parse(stored))
    }
  }, [user, getUserBookings])

  useEffect(() => {
    setReviews(loadReviews())

    const handleReviewsUpdated = () => setReviews(loadReviews())

    window.addEventListener(REVIEW_EVENT_NAME, handleReviewsUpdated)
    window.addEventListener("storage", handleReviewsUpdated)

    return () => {
      window.removeEventListener(REVIEW_EVENT_NAME, handleReviewsUpdated)
      window.removeEventListener("storage", handleReviewsUpdated)
    }
  }, [])

  const getStatusBadge = (booking: Booking) => {
    const status = booking.status

    const baseClass =
      "px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-none"

    if (status === "cancellation_requested") {
      return (
        <span className={`${baseClass} border-amber-100 bg-amber-50 text-amber-600`}>
          Cancel Req
        </span>
      )
    }

    if (booking.cancellationStatus === "declined") {
      return (
        <span className={`${baseClass} border-rose-100 bg-rose-50 text-rose-600`}>
          Cancel Declined
        </span>
      )
    }

    switch (status) {
      case "pending":
        return (
          <span className={`${baseClass} border-orange-100 bg-orange-50 text-orange-600`}>
            Pending
          </span>
        )
      case "verifying":
        return (
          <span className={`${baseClass} border-purple-100 bg-purple-50 text-purple-600`}>
            Verifying
          </span>
        )
      case "confirmed":
        return (
          <span className={`${baseClass} border-emerald-100 bg-emerald-50 text-emerald-600`}>
            Confirmed
          </span>
        )
      case "cancelled":
      case "declined":
        return (
          <span className={`${baseClass} border-rose-100 bg-rose-50 text-rose-600`}>
            {status}
          </span>
        )
      case "completed":
        return (
          <span className={`${baseClass} border-blue-100 bg-blue-50 text-blue-600`}>
            Completed
          </span>
        )
      default:
        return (
          <span className={`${baseClass} border-slate-200 bg-slate-50 text-slate-600`}>
            {status}
          </span>
        )
    }
  }

  const canWriteReview = (booking: Booking) => {
    const status = normalizeBookingStatus(booking.status)
    const isComplete = status === "complete" || status === "completed"

    return isComplete && !hasReviewForBooking(reviews, booking.id)
  }

  const canOpenCancellation = (booking: Booking) => {
    const status = normalizeBookingStatus(booking.status)
    const cancellationStatus = String(booking.cancellationStatus || "").toLowerCase()
    const cooldown = getCancellationCooldownInfo(booking)

    if (!isSlotSecuredForCancellation(booking)) return false
    if (status === "cancelled" || status === "declined" || status === "completed") return false
    if (status === "cancellation_requested" || cancellationStatus === "under review") return false
    if (cancellationStatus === "approved") return false
    if (cancellationStatus === "declined" && cooldown.active) return false

    return isCancellationAllowed(booking.date)
  }

  const executeCancellationRequest = () => {
    if (!bookingToCancel) return

    if (!isCancellationAllowed(bookingToCancel.date)) {
      toast({
        title: "Cancellation Not Available",
        description: getCancellationMessage(bookingToCancel.date),
        variant: "destructive",
      })
      return
    }

    if (!cancelReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation.",
        variant: "destructive",
      })
      return
    }

    requestCancellation(bookingToCancel.id, cancelReason.trim())

    toast({
      title: "Cancellation Requested",
      description: isRefundEligible(bookingToCancel.date)
        ? "Admin will review your request. If approved, your cash refund can be claimed at the office after 1 week."
        : "Admin will review your cancellation request.",
      className: "bg-slate-900 text-white border-none",
    })

    setBookingToCancel(null)
    setCancelReason("")
  }

  const proceedToPayment = () => {
    if (!paymentTarget) return

    setIsPaymentProceeding(true)
    router.push(`/portal/payments?bookingId=${paymentTarget.id}`)
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-in fade-in p-4 duration-500 md:p-6">
      <PaymentConfirmationModal
        booking={paymentTarget}
        isProceeding={isPaymentProceeding}
        onClose={() => {
          setPaymentTarget(null)
          setIsPaymentProceeding(false)
        }}
        onConfirm={proceedToPayment}
      />

      <WriteReviewModal
        open={!!reviewTarget}
        booking={reviewTarget}
        reviews={reviews}
        onClose={() => setReviewTarget(null)}
        onSaved={setReviews}
      />

      <CancellationDialog
        booking={bookingToCancel}
        reason={cancelReason}
        setReason={setCancelReason}
        onClose={() => {
          setBookingToCancel(null)
          setCancelReason("")
        }}
        onSubmit={executeCancellationRequest}
      />

      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage your space reservations.
          </p>
        </div>

        <ReserveDialog>
          <Button className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 font-bold text-white shadow-sm transition-all hover:bg-orange-700 sm:w-auto">
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </ReserveDialog>
      </div>

      {myBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center sm:p-10">
          <Calendar className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="mb-1 text-lg font-black text-slate-900">
            No bookings yet
          </h3>
          <p className="mb-6 text-sm text-slate-500">
            You haven't made any reservations. Ready to host your next event?
          </p>
          <ReserveDialog>
            <Button className="h-10 rounded-xl bg-orange-600 px-6 font-bold text-white shadow-sm hover:bg-orange-700">
              Book Now
            </Button>
          </ReserveDialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {myBookings
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .map((booking) => {
              const alreadyReviewed = hasReviewForBooking(reviews, booking.id)
              const cancellationAllowed = canOpenCancellation(booking)

              return (
                <EnhancedBookingCard
                  key={booking.id}
                  booking={booking}
                  alreadyReviewed={alreadyReviewed}
                  cancellationAllowed={cancellationAllowed}
                  myBookings={myBookings}
                  onPay={setPaymentTarget}
                  onCancelRequest={setBookingToCancel}
                  onReview={setReviewTarget}
                />
              )
            })}
        </div>
      )}
    </div>
  )
}