"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Eye,
  FileImage,
  Filter,
  Inbox,
  Receipt,
  Search,
  ShieldCheck,
  X,
  XCircle,
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
import { useToast } from "@/src/modules/shared/hooks/use-toast"

const BOOKING_STORAGE_KEY = "oneestela_global_bookings_v2"
const E_RECEIPT_STORAGE_KEY = "oneestela_e_receipts_v1"

const VENUE_OPTIONS = [
  "The Milestone Event",
  "The Moment Event",
  "Conference Room",
  "Business Room",
  "Office A",
  "Office B",
]

type PaymentTab = "verifying" | "verified" | "all"
type PaymentAction = "verify" | "reject" | "incomplete" | "mark_paid"
type BookingRecord = any

type PendingPaymentAction = {
  type: PaymentAction
  payment: BookingRecord
} | null

export default function AdminPaymentsPage() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [activeTab, setActiveTab] = useState<PaymentTab>("verifying")
  const [searchQuery, setSearchQuery] = useState("")
  const [venueFilter, setVenueFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<BookingRecord | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingPaymentAction>(null)
  const [actionNote, setActionNote] = useState("")

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchId = urlParams.get("search")

    if (searchId) {
      setSearchQuery(searchId)
      setActiveTab("all")

      // Remove the URL query after using it once so the page does not stay locked
      // on the same booking ID after refresh/navigation.
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [])

  useEffect(() => {
    const loadBookings = () => {
      setBookings(readStoredBookings())
    }

    loadBookings()

    window.addEventListener("storage", loadBookings)
    window.addEventListener("bookingsUpdated", loadBookings)
    window.addEventListener("oneestela_bookings_updated", loadBookings)

    return () => {
      window.removeEventListener("storage", loadBookings)
      window.removeEventListener("bookingsUpdated", loadBookings)
      window.removeEventListener("oneestela_bookings_updated", loadBookings)
    }
  }, [])

  const paymentBookings = useMemo(() => {
    return bookings
      .filter((booking) => isPaymentRecord(booking))
      .sort(
        (a, b) =>
          new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
          new Date(a?.updatedAt || a?.createdAt || 0).getTime()
      )
  }, [bookings])

  const tabCounts = useMemo(() => {
    const verifying = paymentBookings.filter((booking) => isForReviewPayment(booking)).length
    const verified = paymentBookings.filter((booking) => isVerifiedPayment(booking)).length

    return {
      verifying,
      verified,
      all: paymentBookings.length,
    }
  }, [paymentBookings])

  const filteredPayments = useMemo(() => {
    return paymentBookings.filter((booking) => {
      const searchText = [
        booking?.id,
        booking?.eventName,
        booking?.venue,
        booking?.paymentMethod,
        booking?.paymentType,
        booking?.paymentStatus,
        booking?.bankReferenceNumber,
        booking?.referenceNumber,
        booking?.transactionReferenceNumber,
        booking?.userInfo?.name,
        booking?.userInfo?.email,
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = searchText.includes(searchQuery.toLowerCase())
      const matchesVenue =
        venueFilter === "all" ||
        String(booking?.venue || "").includes(venueFilter)

      let matchesTab = true

      if (activeTab === "verifying") matchesTab = isForReviewPayment(booking)
      if (activeTab === "verified") matchesTab = isVerifiedPayment(booking)

      return matchesSearch && matchesVenue && matchesTab
    })
  }, [paymentBookings, searchQuery, venueFilter, activeTab])

  const refreshBookingsFromStorage = (fallback?: BookingRecord[]) => {
    const stored = readStoredBookings()
    const nextBookings = stored.length > 0 ? stored : fallback || []
    setBookings(nextBookings)
    return nextBookings
  }

  const persistBookings = (nextBookings: BookingRecord[]) => {
    setBookings(nextBookings)
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(nextBookings))
    window.dispatchEvent(new Event("oneestela_bookings_updated"))
  }

  const openActionModal = (payment: BookingRecord, type: PaymentAction) => {
    setPendingAction({ payment, type })
    setActionNote("")
  }

  const closeActionModal = () => {
    setPendingAction(null)
    setActionNote("")
  }

  const handleConfirmPaymentAction = async () => {
    if (!pendingAction) return

    const { payment, type } = pendingAction
    const bookingId = payment.id
    const note = actionNote.trim()

    if ((type === "reject" || type === "incomplete") && !note) {
      toast({
        title: type === "reject" ? "Reason Required" : "Note Required",
        description:
          type === "reject"
            ? "Please provide a reason for rejecting this payment."
            : "Please provide a note explaining the missing or insufficient amount.",
        variant: "destructive",
      })
      return
    }

    try {
      const baseBookings = readStoredBookings()
      const sourceBookings = baseBookings.length > 0 ? baseBookings : bookings

      const nextBookings = sourceBookings.map((booking) => {
        if (booking.id !== bookingId) return booking

        if (type === "verify") return buildVerifiedPaymentBooking(booking)
        if (type === "reject") return buildRejectedPaymentBooking(booking, note)
        if (type === "incomplete") return buildIncompletePaymentBooking(booking, note)
        if (type === "mark_paid") return buildCompletePaymentBooking(booking, note)

        return booking
      })

      persistBookings(nextBookings)

      const updatedBooking = nextBookings.find((booking) => booking.id === bookingId)
      setSelectedPayment(updatedBooking || null)

      if (type === "verify" && updatedBooking) {
        ensureReceiptForVerifiedBooking(updatedBooking)
      }

      toast({
        title: getActionSuccessTitle(type),
        description: getActionSuccessDescription(type, bookingId),
        className:
          type === "reject"
            ? "border-none bg-rose-500 text-white"
            : type === "incomplete"
              ? "border-none bg-amber-500 text-white"
              : "border-none bg-emerald-500 text-white",
      })

      closeActionModal()
    } catch (error) {
      console.error("Payment action error:", error)
      toast({
        title: "Action Failed",
        description: "Something went wrong while updating the payment record.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 lg:px-6">
        <PaymentActionConfirmModal
          pendingAction={pendingAction}
          note={actionNote}
          setNote={setActionNote}
          onCancel={closeActionModal}
          onConfirm={handleConfirmPaymentAction}
        />

        <section className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-orange-600">
                Admin Payments
              </p>

              <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl lg:whitespace-nowrap">
                Payment Verification
              </h1>

              <p className="mt-2 max-w-xl text-sm text-slate-500">
                Review client payment submissions. All payment actions require confirmation before updating LocalStorage.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Select value={venueFilter} onValueChange={setVenueFilter}>
                <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-orange-600 sm:w-[170px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <SelectValue placeholder="All Venues" />
                  </div>
                </SelectTrigger>

                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="all" className="font-bold">
                    All Venues
                  </SelectItem>

                  {VENUE_OPTIONS.map((venue) => (
                    <SelectItem key={venue} value={venue}>
                      {venue}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-[300px]">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />

                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search payment..."
                  className="h-10 rounded-xl border-slate-200 bg-white pl-9 pr-16 text-xs focus-visible:ring-orange-600"
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setActiveTab("verifying")
                      window.history.replaceState(null, "", window.location.pathname)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:bg-slate-100 hover:text-orange-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 border-b border-slate-200">
          <div className="grid grid-cols-3">
            <PaymentTabButton
              label="For Review"
              count={tabCounts.verifying}
              active={activeTab === "verifying"}
              onClick={() => setActiveTab("verifying")}
            />

            <PaymentTabButton
              label="Verified"
              count={tabCounts.verified}
              active={activeTab === "verified"}
              onClick={() => setActiveTab("verified")}
            />

            <PaymentTabButton
              label="All Records"
              count={tabCounts.all}
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
            />
          </div>
        </section>

        <section className="mt-4">
          <div className="border-t border-slate-200 md:hidden">
            {filteredPayments.length === 0 ? (
              <EmptyState />
            ) : (
              filteredPayments.map((payment) => (
                <MobilePaymentRow
                  key={payment.id}
                  payment={payment}
                  onView={() => setSelectedPayment(payment)}
                />
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto border-t border-slate-200 md:block">
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] uppercase tracking-widest text-slate-500">
                  <th className="p-4 pl-0 font-black">Transaction</th>
                  <th className="p-4 font-black">Client</th>
                  <th className="p-4 font-black">Payment Method</th>
                  <th className="p-4 text-right font-black">Amount Submitted</th>
                  <th className="p-4 font-black">Status</th>
                  <th className="p-4 pr-0 text-right font-black">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => {
                    const amountPaid = getAmountPaid(payment)

                    return (
                      <tr
                        key={payment.id}
                        className="border-b border-slate-200/80 transition-colors hover:bg-slate-50/70"
                      >
                        <td className="p-4 pl-0 align-top">
                          <div className="flex gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500">
                              <Receipt className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[260px] break-words text-sm font-black leading-tight text-slate-900">
                                {payment.eventName || "Untitled Event"}
                              </p>

                              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                ID: {payment.id || "No ID"}
                              </p>

                              <p className="mt-1 max-w-[260px] break-words text-xs text-slate-500">
                                {payment.venue || "No venue selected"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-4 align-top">
                          <p className="max-w-[220px] break-words text-sm font-bold text-slate-900">
                            {payment.userInfo?.name || "No Name"}
                          </p>

                          <p className="mt-0.5 max-w-[220px] break-all text-xs text-slate-500">
                            {payment.userInfo?.email || "No email"}
                          </p>
                        </td>

                        <td className="p-4 align-top">
                          <PaymentMethodLabel payment={payment} />

                          <p className="mt-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {getPaymentTypeLabel(payment.paymentType)}
                          </p>
                        </td>

                        <td className="p-4 text-right align-top">
                          <p className="text-base font-black text-slate-950">
                            {formatCurrency(amountPaid)}
                          </p>

                          {payment.paymentType === "downpayment" && (
                            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-amber-600">
                              Partial
                            </p>
                          )}
                        </td>

                        <td className="p-4 align-top">
                          <PaymentBadge payment={payment} />
                        </td>

                        <td className="p-4 pr-0 text-right align-top">
                          <Button
                            onClick={() => setSelectedPayment(payment)}
                            variant="outline"
                            className="h-9 rounded-xl border-slate-200 px-4 text-xs font-black text-slate-700 hover:border-orange-600 hover:bg-orange-600 hover:text-white"
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            Review
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <Dialog
          open={!!selectedPayment}
          onOpenChange={(open) => !open && setSelectedPayment(null)}
        >
          <DialogContent className="h-[calc(100svh-32px)] max-h-[calc(100svh-32px)] w-[calc(100vw-32px)] !max-w-[900px] overflow-hidden rounded-[1.75rem] border-0 bg-white p-0 shadow-2xl [&>button]:hidden">
            {selectedPayment && (
              <PaymentReviewModal
                payment={selectedPayment}
                onClose={() => setSelectedPayment(null)}
                onAction={(type) => openActionModal(selectedPayment, type)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function PaymentActionConfirmModal({
  pendingAction,
  note,
  setNote,
  onCancel,
  onConfirm,
}: {
  pendingAction: PendingPaymentAction
  note: string
  setNote: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
}) {
  const actionType = pendingAction?.type
  const payment = pendingAction?.payment

  const isReject = actionType === "reject"
  const isIncomplete = actionType === "incomplete"
  const isVerify = actionType === "verify"
  const isMarkPaid = actionType === "mark_paid"

  const title = isReject
    ? "Reject Payment?"
    : isIncomplete
      ? "Mark Payment as Incomplete?"
      : isMarkPaid
        ? "Mark Payment as Complete?"
        : "Verify Payment?"

  const description = isReject
    ? "Are you sure you want to reject this payment? Please provide a reason for rejection."
    : isIncomplete
      ? "Are you sure you want to mark this payment as incomplete? Please provide a note for the customer."
      : isMarkPaid
        ? "Are you sure you want to mark this payment as complete? This will update the payment record."
        : "Are you sure you want to verify this payment? This action will secure the customer’s slot and update the booking status."

  const confirmLabel = isReject
    ? "Reject Payment"
    : isIncomplete
      ? "Mark as Incomplete"
      : isMarkPaid
        ? "Mark Complete Payment"
        : "Yes, Verify Payment"

  const confirmColor = isReject
    ? "bg-rose-600 hover:bg-rose-700"
    : isIncomplete
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-emerald-600 hover:bg-emerald-700"

  return (
    <Dialog open={!!pendingAction} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="w-[calc(100vw-28px)] max-w-[520px] rounded-[1.75rem] border-0 bg-white p-0 shadow-2xl [&>button]:hidden">
        <div className="p-6 sm:p-7">
          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
              isReject
                ? "bg-rose-50 text-rose-600"
                : isIncomplete
                  ? "bg-amber-50 text-amber-600"
                  : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {isReject ? <XCircle className="h-8 w-8" /> : isIncomplete ? <AlertCircle className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
          </div>

          <DialogTitle className="text-2xl font-black text-slate-950">
            {title}
          </DialogTitle>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>

          {payment && (
            <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
              <ConfirmLine label="Customer" value={payment.userInfo?.name || "No Name"} />
              <ConfirmLine label="Booking ID" value={payment.id || "No ID"} />
              <ConfirmLine label="Payment Method" value={getPaymentMethodLabel(payment.paymentMethod)} />
              {payment.paymentMethod === "bank" && (
                <ConfirmLine label="Bank Reference No." value={getBankReferenceNumber(payment)} />
              )}
              <ConfirmLine label="Amount Submitted" value={formatCurrency(getAmountPaid(payment))} />
              <ConfirmLine label="Current Status" value={getPaymentStatusText(payment)} />
              <ConfirmLine label="Action" value={getActionLabel(actionType || "verify")} />
            </div>
          )}

          {(isReject || isIncomplete) && (
            <div className="mt-4">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                {isReject ? "Rejection Reason" : "Customer Note"}
              </label>
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={
                  isReject
                    ? "Enter reason for rejecting this payment..."
                    : "Enter note about missing or insufficient amount..."
                }
                className="min-h-[100px] resize-none rounded-xl border-slate-200 focus-visible:ring-orange-600"
              />
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="h-11 rounded-xl border-slate-200 text-sm font-black text-slate-700"
            >
              Cancel
            </Button>

            <Button
              disabled={(isReject || isIncomplete) && !note.trim()}
              onClick={onConfirm}
              className={`h-11 rounded-xl text-sm font-black text-white disabled:opacity-50 ${confirmColor}`}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-2 last:border-b-0 last:pb-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-right text-xs font-black text-slate-900">{value}</p>
    </div>
  )
}

function PaymentTabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-[58px] min-w-0 items-center justify-center gap-2 px-2 text-center text-xs font-black transition sm:text-sm ${
        active ? "text-orange-600" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span className="line-clamp-2 leading-tight">{label}</span>

      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black sm:text-[10px] ${
          active ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>

      {active && (
        <span className="absolute bottom-0 left-0 h-[2px] w-full bg-orange-600" />
      )}
    </button>
  )
}

function MobilePaymentRow({
  payment,
  onView,
}: {
  payment: BookingRecord
  onView: () => void
}) {
  return (
    <div className="border-b border-slate-200 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            ID: {payment.id || "No ID"}
          </p>

          <h3 className="mt-1 break-words text-base font-black leading-snug text-slate-900">
            {payment.eventName || "Untitled Event"}
          </h3>

          <p className="mt-1 break-words text-sm font-medium text-slate-500">
            {payment.venue || "No venue selected"}
          </p>
        </div>

        <div className="shrink-0">
          <PaymentBadge payment={payment} />
        </div>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <p className="text-slate-700">
          <span className="font-black text-slate-900">Client:</span>{" "}
          {payment.userInfo?.name || "No Name"}
        </p>

        <p className="text-slate-700">
          <span className="font-black text-slate-900">Method:</span>{" "}
          {getPaymentMethodLabel(payment.paymentMethod)}
        </p>

        <p className="text-orange-600">
          <span className="font-black">Amount:</span>{" "}
          {formatCurrency(getAmountPaid(payment))}
        </p>
      </div>

      <div className="mt-4">
        <Button
          onClick={onView}
          variant="outline"
          className="h-10 w-full rounded-xl border-slate-200 text-xs font-black hover:border-orange-600 hover:bg-orange-600 hover:text-white"
        >
          <Eye className="mr-1.5 h-4 w-4" />
          Review Payment
        </Button>
      </div>
    </div>
  )
}

function PaymentReviewModal({
  payment,
  onClose,
  onAction,
}: {
  payment: BookingRecord
  onClose: () => void
  onAction: (type: PaymentAction) => void
}) {
  const totalAmount = getSafePrice(payment.totalPrice)
  const amountPaid = getAmountPaid(payment)
  const remainingBalance = Math.max(totalAmount - amountPaid, 0)
  const isActionable = isForReviewPayment(payment)
  const canMarkPaid = isVerifiedPayment(payment) && Number(payment.remainingBalance || 0) > 0 && !payment.remainingBalancePaid
  const hasImageProof = isImageProof(payment.paymentProof || payment.proofOfPayment || payment.proofImage || payment.receiptImage)

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]">
      <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {payment.id || "No ID"}
              </span>

              <PaymentBadge payment={payment} />
            </div>

            <DialogTitle className="break-words text-xl font-black leading-tight text-slate-950 sm:text-2xl">
              Payment Verification
            </DialogTitle>

            <p className="mt-1 break-words text-sm font-bold text-orange-600">
              {payment.eventName || "Untitled Event"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto px-5 py-4 sm:px-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4">
            <ModalSection title="Payment Proof">
              {payment.paymentMethod === "bank" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {hasImageProof ? (
                    <div className="mx-auto w-full max-w-[260px]">
                      <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <img
                          src={payment.paymentProof || payment.proofOfPayment || payment.proofImage || payment.receiptImage}
                          alt="Payment proof"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mx-auto flex min-h-[250px] w-full max-w-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center">
                      <FileImage className="mb-3 h-10 w-10 text-slate-300" />

                      <p className="text-sm font-black text-slate-900">
                        {payment.paymentProof || payment.proofOfPayment || "No receipt file name"}
                      </p>

                      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                        Image preview is only available if the proof is saved as a data URL or image link.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                  <Banknote className="mx-auto mb-3 h-10 w-10 text-emerald-500" />

                  <p className="text-sm font-black text-emerald-950">
                    Cash Payment at Office
                  </p>

                  <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-emerald-700">
                    Confirm this booking only after the physical cash payment is received.
                  </p>
                </div>
              )}
            </ModalSection>

            <ModalSection title="Client Details">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">
                  {payment.userInfo?.name || "No Name"}
                </p>

                <p className="mt-1 break-all text-sm text-slate-500">
                  {payment.userInfo?.email || "No email"}
                </p>
              </div>
            </ModalSection>
          </div>

          <div className="space-y-4">
            <ModalSection title="Amount Summary">
              <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600">
                  Amount Submitted
                </p>

                <p className="mt-1 text-3xl font-black tracking-tight text-orange-600">
                  {formatCurrency(amountPaid)}
                </p>

                <p className="mt-2 text-xs font-semibold text-orange-700/70">
                  {getPaymentTypeLabel(payment.paymentType)}
                </p>
              </div>
            </ModalSection>

            {payment.paymentType === "downpayment" && (
              <div className="rounded-2xl bg-slate-950 p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                    <AlertCircle className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Remaining Balance
                    </p>

                    <p className="mt-1 text-xl font-black">
                      {formatCurrency(remainingBalance)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ModalSection title="Payment Details">
              <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <InfoLine label="Method" value={getPaymentMethodLabel(payment.paymentMethod)} />
                {payment.paymentMethod === "bank" && (
                  <InfoLine label="Bank Reference No." value={getBankReferenceNumber(payment)} />
                )}
                <InfoLine label="Type" value={getPaymentTypeLabel(payment.paymentType)} />
                <InfoLine label="Total Booking" value={formatCurrency(totalAmount)} />
                <InfoLine label="Status" value={getPaymentStatusText(payment)} />
              </div>
            </ModalSection>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
        {isActionable ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              onClick={() => onAction("reject")}
              variant="outline"
              className="h-11 rounded-xl border-rose-200 text-sm font-black text-rose-500 hover:bg-rose-50"
            >
              Reject Payment
            </Button>

            <Button
              onClick={() => onAction("incomplete")}
              variant="outline"
              className="h-11 rounded-xl border-amber-200 text-sm font-black text-amber-600 hover:bg-amber-50"
            >
              Incomplete
            </Button>

            <Button
              onClick={() => onAction("verify")}
              className="h-11 rounded-xl bg-emerald-500 text-sm font-black text-white hover:bg-emerald-600"
            >
              Verify Payment
            </Button>
          </div>
        ) : canMarkPaid ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="h-11 rounded-xl border-slate-200 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Close Window
            </Button>
            <Button
              onClick={() => onAction("mark_paid")}
              className="h-11 rounded-xl bg-blue-600 text-sm font-black text-white hover:bg-blue-700"
            >
              Mark Complete Payment
            </Button>
          </div>
        ) : (
          <Button
            onClick={onClose}
            variant="outline"
            className="h-11 w-full rounded-xl border-slate-200 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Close Window
          </Button>
        )}
      </div>
    </div>
  )
}

function PaymentMethodLabel({ payment }: { payment: BookingRecord }) {
  const isBank = payment.paymentMethod === "bank"

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-800">
      {isBank ? (
        <FileImage className="h-3.5 w-3.5 text-blue-500" />
      ) : (
        <Banknote className="h-3.5 w-3.5 text-emerald-500" />
      )}
      {getPaymentMethodLabel(payment.paymentMethod)}
    </span>
  )
}

function PaymentBadge({ payment }: { payment: BookingRecord }) {
  const status = String(payment?.status || "").toLowerCase()
  const paymentStatus = String(payment?.paymentStatus || "").toLowerCase()
  const baseClass =
    "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"

  if (paymentStatus === "incomplete") {
    return (
      <span className={`${baseClass} border-amber-100 bg-amber-50 text-amber-600`}>
        <AlertCircle className="h-3 w-3" />
        Incomplete
      </span>
    )
  }

  if (paymentStatus === "rejected" || status === "pending") {
    return (
      <span className={`${baseClass} border-rose-100 bg-rose-50 text-rose-600`}>
        <XCircle className="h-3 w-3" />
        Rejected
      </span>
    )
  }

  if (isForReviewPayment(payment)) {
    return (
      <span className={`${baseClass} border-purple-100 bg-purple-50 text-purple-600`}>
        <ShieldCheck className="h-3 w-3" />
        For Review
      </span>
    )
  }

  if (isVerifiedPayment(payment)) {
    return (
      <span className={`${baseClass} border-emerald-100 bg-emerald-50 text-emerald-600`}>
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </span>
    )
  }

  return (
    <span className={`${baseClass} border-slate-200 bg-slate-50 text-slate-600`}>
      {paymentStatus || status || "Unknown"}
    </span>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="text-right text-xs font-black text-slate-900">{value}</p>
    </div>
  )
}

function ModalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="border-b border-slate-100 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        {title}
      </h4>

      <div className="pt-4">{children}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[230px] flex-col items-center justify-center px-6 py-10 text-center">
      <Inbox className="mb-3 h-10 w-10 text-slate-300" />

      <h3 className="text-base font-black text-slate-900">
        No payment records found
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">
        No payments match your current filters or search keyword.
      </p>
    </div>
  )
}

function readStoredBookings() {
  try {
    const stored = localStorage.getItem(BOOKING_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStoredReceipts(receipts: any[]) {
  localStorage.setItem(E_RECEIPT_STORAGE_KEY, JSON.stringify(receipts))
  window.dispatchEvent(new Event("oneestela_receipts_updated"))
}

function readStoredReceipts() {
  try {
    const stored = localStorage.getItem(E_RECEIPT_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getSafePrice(value: unknown) {
  if (typeof value === "number") return value

  const cleanedValue = String(value || "0").replace(/[^\d.]/g, "")
  return Number(cleanedValue) || 0
}

function getAmountPaid(payment: BookingRecord) {
  if (payment.amountPaid && Number(payment.amountPaid) > 0) {
    return getSafePrice(payment.amountPaid)
  }

  if (payment.paymentAmount && Number(payment.paymentAmount) > 0) {
    return getSafePrice(payment.paymentAmount)
  }

  const totalPrice = getSafePrice(payment.totalPrice)

  if (payment.paymentType === "downpayment") {
    return totalPrice * 0.5
  }

  return totalPrice
}

function formatCurrency(value: number) {
  return `₱${Number(value || 0).toLocaleString()}`
}

function getPaymentMethodLabel(method?: string) {
  if (method === "bank") return "Bank Transfer"
  if (method === "cash") return "Cash at Office"
  return "Payment Method"
}

function getBankReferenceNumber(payment: BookingRecord) {
  const value =
    payment?.bankReferenceNumber ||
    payment?.referenceNumber ||
    payment?.transactionReferenceNumber

  const text = String(value || "").trim()
  return text || "No reference number"
}

function getPaymentTypeLabel(type?: string) {
  if (type === "full") return "Full Payment"
  if (type === "downpayment") return "50% Downpayment"
  if (type === "slot_reservation") return "Slot Reservation Only"
  return "Payment Type"
}

function isImageProof(proof: unknown) {
  const value = String(proof || "")
  return (
    value.startsWith("data:image") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  )
}

function isPaymentRecord(booking: BookingRecord) {
  const status = String(booking?.status || "").toLowerCase()
  const paymentStatus = String(booking?.paymentStatus || "").toLowerCase()
  const paymentMethod = String(booking?.paymentMethod || "").toLowerCase()
  const paymentType = String(booking?.paymentType || "").toLowerCase()
  const hasProof = Boolean(
    booking?.paymentProof ||
      booking?.proofOfPayment ||
      booking?.proofImage ||
      booking?.receiptImage
  )

  return (
    status === "verifying" ||
    status === "confirmed" ||
    status === "completed" ||
    status === "reservation_secured" ||
    status === "slot_secured" ||
    paymentStatus === "for_review" ||
    paymentStatus === "cash_pending" ||
    paymentStatus === "slot_pending" ||
    paymentStatus === "pending_verification" ||
    paymentStatus === "pending verification" ||
    paymentStatus === "for verification" ||
    paymentStatus === "incomplete" ||
    paymentStatus === "verified" ||
    paymentStatus === "paid" ||
    paymentStatus === "slot_verified" ||
    paymentStatus === "rejected" ||
    paymentMethod === "cash" ||
    paymentMethod === "bank" ||
    paymentType === "slot_reservation" ||
    hasProof
  )
}

function isForReviewPayment(booking: BookingRecord) {
  const status = String(booking?.status || "").toLowerCase()
  const paymentStatus = String(booking?.paymentStatus || "").toLowerCase()

  return (
    status === "verifying" ||
    paymentStatus === "for_review" ||
    paymentStatus === "cash_pending" ||
    paymentStatus === "slot_pending" ||
    paymentStatus === "pending_verification" ||
    paymentStatus === "for verification" ||
    paymentStatus === "pending verification" ||
    paymentStatus === "incomplete"
  )
}

function isVerifiedPayment(booking: BookingRecord) {
  const status = String(booking?.status || "").toLowerCase()
  const paymentStatus = String(booking?.paymentStatus || "").toLowerCase()

  return (
    ["confirmed", "completed", "reservation_secured", "slot_secured"].includes(status) ||
    ["verified", "paid", "slot_verified", "reservation secured"].includes(paymentStatus)
  )
}

function getPaymentStatusText(payment: BookingRecord) {
  if (payment.paymentStatus === "for_review") return "For Review"
  if (payment.paymentStatus === "cash_pending") return "Cash Pending"
  if (payment.paymentStatus === "slot_pending") return "Slot Pending"
  if (payment.paymentStatus === "incomplete") return "Incomplete"
  if (payment.paymentStatus === "rejected") return "Rejected"
  if (isVerifiedPayment(payment)) return "Verified"
  if (isForReviewPayment(payment)) return "For Review"
  return String(payment.paymentStatus || payment.status || "Unknown")
}

function getActionLabel(action: PaymentAction) {
  if (action === "verify") return "Verify / Accept Payment"
  if (action === "reject") return "Reject Payment"
  if (action === "incomplete") return "Mark as Incomplete Payment"
  return "Mark as Complete Payment"
}

function getActionSuccessTitle(action: PaymentAction) {
  if (action === "verify") return "Payment Verified"
  if (action === "reject") return "Payment Rejected"
  if (action === "incomplete") return "Payment Marked Incomplete"
  return "Payment Marked Complete"
}

function getActionSuccessDescription(action: PaymentAction, bookingId: string) {
  if (action === "verify") {
    return `Booking ${bookingId} has been verified and the customer's slot has been secured.`
  }

  if (action === "reject") {
    return `Booking ${bookingId} payment was rejected with admin reason.`
  }

  if (action === "incomplete") {
    return `Booking ${bookingId} payment was marked as incomplete.`
  }

  return `Booking ${bookingId} payment record was marked as complete.`
}

function isOfficeRental(booking: BookingRecord) {
  return (
    String(booking?.bookingType || "").toLowerCase().includes("office") ||
    String(booking?.rentalType || "").toLowerCase().includes("office") ||
    String(booking?.venue || "").toLowerCase().includes("office") ||
    Boolean(booking?.isOfficeRental)
  )
}

function appendAdminLog(booking: BookingRecord, action: string, message: string) {
  return [
    ...(Array.isArray(booking.adminLogs) ? booking.adminLogs : []),
    {
      action,
      message,
      createdAt: new Date().toISOString(),
    },
  ]
}

function buildVerifiedPaymentBooking(booking: BookingRecord) {
  const office = isOfficeRental(booking)
  const amountPaid = getAmountPaid(booking)
  const nextStatus = office ? "reservation_secured" : "confirmed"
  const paymentStatus = office ? "slot_verified" : "verified"

  return {
    ...booking,
    status: nextStatus,
    bookingStatus: office ? "Slot Secured" : "Confirmed",
    paymentStatus,
    isSlotSecured: true,
    amountPaid,
    verifiedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminLogs: appendAdminLog(
      booking,
      "PAYMENT_VERIFIED",
      office
        ? "Admin verified the office slot reservation payment. Succeeding payments are onsite check payments."
        : "Admin verified the booking payment and secured the customer slot."
    ),
  }
}

function buildRejectedPaymentBooking(booking: BookingRecord, reason: string) {
  return {
    ...booking,
    status: "pending",
    bookingStatus: "Pending Verification",
    paymentStatus: "rejected",
    isSlotSecured: false,
    paymentRejectedReason: reason,
    paymentRejectionReason: reason,
    paymentRejectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminLogs: appendAdminLog(
      booking,
      "PAYMENT_REJECTED",
      `Admin rejected the payment. Reason: ${reason}`
    ),
  }
}

function buildIncompletePaymentBooking(booking: BookingRecord, note: string) {
  return {
    ...booking,
    status: "verifying",
    bookingStatus: "Pending Verification",
    paymentStatus: "incomplete",
    isSlotSecured: false,
    incompletePaymentNote: note,
    incompletePaymentAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminLogs: appendAdminLog(
      booking,
      "PAYMENT_INCOMPLETE",
      `Admin marked payment as incomplete. Note: ${note}`
    ),
  }
}

function buildCompletePaymentBooking(booking: BookingRecord, note: string) {
  return {
    ...booking,
    paymentStatus: "paid",
    remainingBalance: 0,
    remainingBalancePaid: true,
    remainingBalancePaidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminLogs: appendAdminLog(
      booking,
      "PAYMENT_COMPLETED",
      note || "Admin marked the remaining payment as complete."
    ),
  }
}

function ensureReceiptForVerifiedBooking(booking: BookingRecord) {
  const receipts = readStoredReceipts()
  const existingReceipt = receipts.find((receipt) => receipt.bookingId === booking.id)

  if (existingReceipt || booking.receipt || booking.receiptIssued) return

  const office = isOfficeRental(booking)
  const receipt = {
    id: `ER-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    receiptNumber: `ER-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
    bookingId: booking.id,
    fullName: booking.userInfo?.name || "Client",
    bookingDate: booking.createdAt || new Date().toISOString(),
    startDate: booking.date,
    endDate: office ? booking.endDate || booking.contractEndDate || booking.date : booking.date,
    rentalType: office ? "Office Space Rental" : "Event Venue Booking",
    contractTerm: office ? booking.contractTerm || booking.rentalTerm || "N/A" : undefined,
    paymentPurpose: office ? "Slot Reservation Only" : getPaymentTypeLabel(booking.paymentType),
    paymentMethod: getPaymentMethodLabel(booking.paymentMethod),
    amountPaid: formatCurrency(getAmountPaid(booking)),
    paymentStatus: office ? "Reservation Secured" : "Payment Verified",
    dateGenerated: new Date().toISOString(),
  }

  writeStoredReceipts([receipt, ...receipts])
}
