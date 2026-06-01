"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  FileImage,
  Info,
  Loader2,
  MapPin,
  Receipt,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";

import { Button } from "@/src/modules/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/src/modules/shared/components/ui/dialog";
import { Input } from "@/src/modules/shared/components/ui/input";
import { Label } from "@/src/modules/shared/components/ui/label";
import { useToast } from "@/src/modules/shared/hooks/use-toast";
import {
  useBookings,
  type Booking,
} from "@/src/modules/client/contexts/booking-context";
import { useAuth } from "@/src/modules/shared/auth/auth-context";

const PAYMENT_WINDOW_HOURS = 24;
const PAYMENT_WINDOW_MS = PAYMENT_WINDOW_HOURS * 60 * 60 * 1000;
const BOOKING_STORAGE_KEY = "oneestela_global_bookings_v2";
const MAX_PROOF_FILE_MB = 5;
const MAX_PROOF_FILE_SIZE = MAX_PROOF_FILE_MB * 1024 * 1024;

function getDeadline(booking?: Booking | null) {
  if (!booking?.createdAt) return null;

  const created = new Date(booking.createdAt).getTime();
  if (Number.isNaN(created)) return null;

  return created + PAYMENT_WINDOW_MS;
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(2, "0")}`;
}

function getRemainingMs(booking?: Booking | null) {
  const deadline = getDeadline(booking);
  if (!deadline) return PAYMENT_WINDOW_MS;
  return deadline - Date.now();
}

function readStoredBookings() {
  try {
    const stored = localStorage.getItem(BOOKING_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function formatMoney(value: number) {
  return `₱${Number(value || 0).toLocaleString("en-PH")}`;
}

function isOfficeRentalBooking(booking?: Partial<Booking> | null) {
  return (
    booking?.isOfficeRental === true ||
    booking?.bookingCategory === "office" ||
    String(booking?.venue || "")
      .toLowerCase()
      .includes("office")
  );
}

function getOfficeReservationFee(booking: Partial<Booking>) {
  return Number(booking.officeReservationFee || booking.totalPrice || 0) || 0;
}

function getOfficeTermLabel(term?: string) {
  if (term === "6_months") return "6 months";
  if (term === "1_year") return "1 year";
  if (term === "2_years") return "2 years";
  return "Not selected";
}

function getOfficePaymentStatusClass(status?: string) {
  if (status === "Paid")
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "Verified") return "border-blue-100 bg-blue-50 text-blue-700";
  if (status === "Overdue") return "border-rose-100 bg-rose-50 text-rose-700";
  return "border-amber-100 bg-amber-50 text-amber-700";
}

function getPaymentTermLabel(
  type: "full" | "downpayment",
  isSettlingBalance: boolean,
) {
  if (isSettlingBalance) return "Remaining Balance";
  return type === "full" ? "Full Payment" : "Down Payment";
}

function getPaymentMethodLabel(method: "bank" | "cash") {
  return method === "bank" ? "Bank Transfer" : "Cash / Pay at the Office";
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="max-w-[230px] break-all text-right text-xs font-black text-slate-900">
        {value}
      </span>
    </div>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlBookingId = searchParams.get("bookingId");

  const { toast } = useToast();
  const { bookings, submitPayment, cancelBooking } = useBookings();
  const { user } = useAuth();

  const [selectedBookingToPay, setSelectedBookingToPay] = useState<
    string | null
  >(null);
  const [localBookings, setLocalBookings] = useState<Booking[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [paymentType, setPaymentType] = useState<"full" | "downpayment">(
    "full",
  );
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "cash">("bank");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [bankReferenceNumber, setBankReferenceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (urlBookingId) setSelectedBookingToPay(urlBookingId);
  }, [urlBookingId]);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      setLocalBookings(bookings);
    } else {
      setLocalBookings(readStoredBookings());
    }

    setIsHydrated(true);
  }, [bookings]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const myTransactions = useMemo(() => {
    return (
      localBookings
        .filter((booking) => booking.userId === user?.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ) || []
    );
  }, [localBookings, user?.id]);

  useEffect(() => {
    if (!isHydrated) return;

    const expiredPendingBookings = myTransactions.filter((booking) => {
      if (booking.status !== "pending") return false;
      if (
        booking.paymentStatus === "verified" ||
        booking.paymentStatus === "paid"
      ) {
        return false;
      }
      return getRemainingMs(booking) <= 0;
    });

    if (expiredPendingBookings.length === 0) return;

    expiredPendingBookings.forEach((booking) => cancelBooking(booking.id));

    setLocalBookings((prev) =>
      prev.map((booking) =>
        expiredPendingBookings.some((expired) => expired.id === booking.id)
          ? { ...booking, status: "cancelled" }
          : booking,
      ),
    );

    if (
      selectedBookingToPay &&
      expiredPendingBookings.some(
        (booking) => booking.id === selectedBookingToPay,
      )
    ) {
      setSelectedBookingToPay(null);
      router.replace("/portal/payments");
      toast({
        title: "Booking Automatically Cancelled",
        description:
          "The 24-hour payment window ended, so the pending booking was cancelled.",
        variant: "destructive",
      });
    }
  }, [
    now,
    isHydrated,
    myTransactions,
    selectedBookingToPay,
    cancelBooking,
    router,
    toast,
  ]);

  const getTransactionBadge = (booking: Booking) => {
    const baseClass =
      "px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest border shadow-none";

    if (booking.status === "pending" && booking.paymentMethod === "cash") {
      return (
        <span
          className={`${baseClass} border-amber-200 bg-amber-50 text-amber-700`}
        >
          Cash Pending
        </span>
      );
    }

    switch (booking.status) {
      case "pending":
        return (
          <span
            className={`${baseClass} border-orange-100 bg-orange-50 text-orange-600`}
          >
            Pencil Booking
          </span>
        );
      case "verifying":
        return (
          <span
            className={`${baseClass} border-purple-100 bg-purple-50 text-purple-600`}
          >
            For Review
          </span>
        );
      case "reservation_secured":
        return (
          <span
            className={`${baseClass} border-emerald-100 bg-emerald-50 text-emerald-600`}
          >
            Reservation Secured
          </span>
        );
      case "confirmed":
        return (
          <span
            className={`${baseClass} border-emerald-100 bg-emerald-50 text-emerald-600`}
          >
            Confirmed
          </span>
        );
      case "cancellation_requested":
        return (
          <span
            className={`${baseClass} border-amber-100 bg-amber-50 text-amber-600`}
          >
            Cancel Review
          </span>
        );
      case "cancelled":
      case "declined":
        return (
          <span
            className={`${baseClass} border-rose-100 bg-rose-50 text-rose-600`}
          >
            Cancelled
          </span>
        );
      case "completed":
        return (
          <span
            className={`${baseClass} border-blue-100 bg-blue-50 text-blue-600`}
          >
            Completed
          </span>
        );
      default:
        return (
          <span
            className={`${baseClass} border-slate-200 bg-slate-50 text-slate-600`}
          >
            {booking.status}
          </span>
        );
    }
  };

  if (!isHydrated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (selectedBookingToPay) {
    const booking = myTransactions.find(
      (item) => item.id === selectedBookingToPay,
    );

    if (!booking) {
      return (
        <div className="animate-in fade-in py-20 text-center">
          <h2 className="mb-2 text-xl font-black text-slate-900">
            Transaction not found
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            We couldn&apos;t find the booking you are trying to pay for.
          </p>
          <Button
            onClick={() => {
              setSelectedBookingToPay(null);
              router.replace("/portal/payments");
            }}
            className="h-10 rounded-xl bg-orange-600 px-6 font-bold text-white hover:bg-orange-700"
          >
            Back to Transactions
          </Button>
        </div>
      );
    }

    const isOfficeRental = isOfficeRentalBooking(booking);
    const isOfficeSecured =
      isOfficeRental &&
      (booking.status === "reservation_secured" ||
        booking.officeReservationStatus === "reservation_secured");
    const isSettlingBalance =
      !isOfficeRental &&
      booking.status === "confirmed" &&
      booking.paymentType === "downpayment";

    const totalPrice = booking.totalPrice || 15000;
    const officeReservationFee = getOfficeReservationFee(booking) || totalPrice;
    const downpaymentAmount = totalPrice * 0.5;
    const amountToPay = isOfficeRental
      ? officeReservationFee
      : isSettlingBalance
        ? downpaymentAmount
        : paymentType === "full"
          ? totalPrice
          : downpaymentAmount;

    const remainingMs = getRemainingMs(booking);
    const isExpired = booking.status === "pending" && remainingMs <= 0;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please upload an image file only.",
          variant: "destructive",
        });
        event.target.value = "";
        return;
      }

      if (file.size > MAX_PROOF_FILE_SIZE) {
        toast({
          title: "File Too Large",
          description: `Please upload an image below ${MAX_PROOF_FILE_MB}MB.`,
          variant: "destructive",
        });
        event.target.value = "";
        return;
      }

      setProofFile(file);
    };

    const submitSelectedPayment = async () => {
      if (isSubmitting) return;

      setIsSubmitting(true);

      try {
        const finalPaymentType = isOfficeRental
          ? ("slot_reservation" as any)
          : isSettlingBalance
            ? "full"
            : paymentType;
        const proofDataUrl =
          paymentMethod === "bank" && proofFile
            ? await fileToDataUrl(proofFile)
            : undefined;

        submitPayment(booking.id, {
          type: finalPaymentType,
          method: paymentMethod,
          proof: proofDataUrl,
          bankReferenceNumber:
            paymentMethod === "bank" ? bankReferenceNumber.trim() : undefined,
          amount: amountToPay,
        });

        toast({
          title: isOfficeRental
            ? "Slot Reservation Payment Submitted"
            : paymentMethod === "cash"
              ? "Cash Payment Selected"
              : "Payment Submitted!",
          description: isOfficeRental
            ? paymentMethod === "cash"
              ? "Please visit One Estela Place within 24 hours to pay the slot reservation fee. After admin verification, your office slot will be secured."
              : "Your slot reservation payment proof is now under admin review."
            : paymentMethod === "cash"
              ? "Please visit One Estela Place within 24 hours to settle your payment."
              : "Your bank transfer payment is now under review by the admin.",
          className: "border-none bg-emerald-500 text-white",
        });

        setIsPaymentConfirmOpen(false);
        setSelectedBookingToPay(null);
        setProofFile(null);
        setBankReferenceNumber("");
        setPaymentType("full");
        setPaymentMethod("bank");
        router.replace("/portal/payments");
      } catch {
        toast({
          title: "Payment Failed",
          description:
            "Something went wrong while submitting your payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleSubmitPayment = () => {
      if (isOfficeSecured) {
        toast({
          title: "Reservation Already Secured",
          description:
            "Succeeding office rental payments are settled onsite via check and recorded by admin.",
        });
        return;
      }

      if (isExpired) {
        toast({
          title: "Payment Window Expired",
          description: "This booking has already expired and cannot be paid.",
          variant: "destructive",
        });
        return;
      }

      if (paymentMethod === "bank" && !proofFile) {
        toast({
          title: "Proof Required",
          description: "Please upload your proof of payment for Bank Transfer.",
          variant: "destructive",
        });
        return;
      }

      if (
        paymentMethod === "bank" &&
        bankReferenceNumber.replace(/\D/g, "").length < 13
      ) {
        toast({
          title: "Invalid Reference Number",
          description:
            "Please enter at least 13 digits for your bank reference number.",
          variant: "destructive",
        });
        return;
      }

      setIsPaymentConfirmOpen(true);
    };

    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 p-4 pb-10 md:p-6">
        <Dialog
          open={isPaymentConfirmOpen}
          onOpenChange={setIsPaymentConfirmOpen}
        >
          <DialogContent className="w-[calc(100vw-32px)] max-w-[500px] rounded-[1.75rem] border-0 bg-white p-0 shadow-2xl [&>button]:hidden">
            <div className="p-6 text-center sm:p-7">
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${
                  paymentMethod === "cash"
                    ? "bg-orange-50 text-orange-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {paymentMethod === "cash" ? (
                  <Banknote className="h-8 w-8" />
                ) : (
                  <CreditCard className="h-8 w-8" />
                )}
              </div>

              <DialogTitle className="text-2xl font-black text-slate-950">
                {paymentMethod === "cash"
                  ? isOfficeRental
                    ? "Submit office slot reservation cash payment?"
                    : "Are you sure you want to pay cash?"
                  : isOfficeRental
                    ? "Submit office slot reservation proof?"
                    : "Are you sure you want to submit bank transfer?"}
              </DialogTitle>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {paymentMethod === "cash"
                  ? isOfficeRental
                    ? "You selected Pay at the Office for the office slot reservation fee. Your office slot is not secured until admin verifies the payment."
                    : "You selected Pay at the Office. Your booking will remain as Pencil Booking until the admin verifies your cash payment."
                  : isOfficeRental
                    ? "You are submitting proof for slot reservation only. After verification, customer-side online payments stop and succeeding office rental payments are tracked by admin."
                    : "You are about to submit your bank transfer proof. Please make sure the uploaded receipt and amount are correct before continuing."}
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Payment Summary
                </p>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-semibold text-slate-500">
                      Booking
                    </span>
                    <span className="max-w-[230px] text-right font-black text-slate-900">
                      {booking.eventName}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="font-semibold text-slate-500">Method</span>
                    <span className="text-right font-black text-slate-900">
                      {getPaymentMethodLabel(paymentMethod)}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <span className="font-semibold text-slate-500">Term</span>
                    <span className="text-right font-black text-slate-900">
                      {isOfficeRental
                        ? "Slot Reservation Only"
                        : getPaymentTermLabel(paymentType, isSettlingBalance)}
                    </span>
                  </div>

                  {paymentMethod === "bank" && bankReferenceNumber.trim() && (
                    <SummaryLine
                      label="Bank Reference No."
                      value={bankReferenceNumber.trim()}
                    />
                  )}

                  {paymentMethod === "bank" && proofFile && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-semibold text-slate-500">
                        Proof
                      </span>
                      <span className="max-w-[220px] break-all text-right text-xs font-black text-slate-900">
                        {proofFile.name}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-dashed border-slate-300 pt-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                        Amount to Pay
                      </span>
                      <span className="text-2xl font-black text-orange-600">
                        {formatMoney(amountToPay)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {paymentMethod === "cash" && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                  <p className="text-sm font-black text-amber-900">
                    Cash Payment Reminder
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-amber-700">
                    {isOfficeRental
                      ? "Please visit One Estela Place within 24 hours to pay the slot reservation fee. After admin verification, the office slot will be secured and contract signing is required onsite."
                      : "Please visit One Estela Place within 24 hours to settle your payment. Admin can manually verify your payment once paid at the office."}
                  </p>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentConfirmOpen(false)}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl border-slate-200 text-sm font-black text-slate-700"
                >
                  Cancel / Go Back
                </Button>

                <Button
                  type="button"
                  onClick={submitSelectedPayment}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl bg-orange-600 text-sm font-black text-white hover:bg-orange-700"
                >
                  {isSubmitting
                    ? "Submitting..."
                    : paymentMethod === "cash"
                      ? "Yes, Pay Cash"
                      : "Yes, Submit Bank Transfer"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          onClick={() => {
            setSelectedBookingToPay(null);
            router.replace("/portal/payments");
          }}
          className="-ml-3 h-10 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Transactions
        </Button>

        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Clock className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black text-orange-950">
                  {isOfficeRental
                    ? "Secure Office Reservation Slot"
                    : isSettlingBalance
                      ? "Settle Your Balance"
                      : "Secure Your Booking"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-orange-800">
                  {isOfficeRental
                    ? "This payment is for slot reservation only. After admin verification, succeeding office rental payments are settled onsite via check."
                    : isSettlingBalance
                      ? "Please settle your remaining balance."
                      : "Please complete your payment within 24 hours to confirm your slot."}
                </p>
              </div>
            </div>

            {!isSettlingBalance && booking.status === "pending" && (
              <div className="rounded-2xl border border-orange-200 bg-white px-5 py-3 text-center shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                  Time Left
                </p>
                <p className="mt-1 text-2xl font-black tabular-nums text-orange-700">
                  {formatCountdown(remainingMs)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                  1
                </span>
                Payment Term
              </h3>

              {isOfficeRental ? (
                <div className="rounded-xl border-2 border-orange-600 bg-orange-50 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">
                      Slot Reservation Only
                    </p>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-600" />
                  </div>
                  <p className="text-2xl font-black text-orange-600">
                    ₱{officeReservationFee.toLocaleString()}
                  </p>
                  <p className="mt-3 text-xs font-semibold leading-5 text-orange-800">
                    This is not full payment or down payment. After admin
                    verifies this reservation fee, succeeding payments are
                    settled onsite via check and tracked by admin.
                  </p>
                  <div className="mt-3 rounded-lg bg-white p-3 text-xs font-bold text-slate-700">
                    Contract term:{" "}
                    {getOfficeTermLabel(booking.officeRentalTerm)} · Required
                    onsite: contract signing, 1 month advance, and 2 months
                    deposit.
                  </div>
                </div>
              ) : isSettlingBalance ? (
                <div className="rounded-xl border-2 border-orange-600 bg-orange-50 p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-slate-900">
                      Remaining Balance Settlement
                    </p>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-600" />
                  </div>
                  <p className="text-2xl font-black text-orange-600">
                    ₱{amountToPay.toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setPaymentType("full")}
                    className={`rounded-xl border-2 p-5 text-left transition-all ${
                      paymentType === "full"
                        ? "border-orange-600 bg-orange-50"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900">
                        Full Payment
                      </p>
                      {paymentType === "full" && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-600" />
                      )}
                    </div>
                    <p className="text-2xl font-black text-orange-600">
                      ₱{totalPrice.toLocaleString()}
                    </p>
                  </button>

                  <button
                    onClick={() => setPaymentType("downpayment")}
                    className={`rounded-xl border-2 p-5 text-left transition-all ${
                      paymentType === "downpayment"
                        ? "border-orange-600 bg-orange-50"
                        : "border-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-slate-900">
                        Down Payment
                      </p>
                      {paymentType === "downpayment" && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-orange-600" />
                      )}
                    </div>
                    <p className="text-2xl font-black text-orange-600">
                      ₱{downpaymentAmount.toLocaleString()}
                    </p>
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h3 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600">
                  2
                </span>
                Payment Method
              </h3>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setPaymentMethod("bank")}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === "bank"
                      ? "border-orange-600 bg-orange-50"
                      : "border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      paymentMethod === "bank"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    Bank Transfer
                  </p>
                </button>

                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                    paymentMethod === "cash"
                      ? "border-orange-600 bg-orange-50"
                      : "border-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      paymentMethod === "cash"
                        ? "bg-orange-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <Banknote className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    Pay at the Office
                  </p>
                </button>
              </div>

              {paymentMethod === "bank" ? (
                <div className="animate-in fade-in space-y-5">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Bank Details
                    </p>
                    <div className="flex flex-col gap-1 border-b border-slate-200 pb-3 sm:flex-row sm:justify-between">
                      <span className="text-slate-600">BDO Account</span>
                      <span className="break-words font-bold text-slate-900">
                        0012 3456 7890
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pt-3 sm:flex-row sm:justify-between">
                      <span className="text-slate-600">Account Name</span>
                      <span className="break-words font-bold text-slate-900">
                        One Estela Place
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900">
                      Bank Reference Number / Transaction Reference Number
                    </Label>
                    <Input
                      value={bankReferenceNumber}
                      onChange={(event) => {
                        const digitsOnly = event.target.value.replace(/\D/g, "");
                        setBankReferenceNumber(digitsOnly);
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={32}
                      placeholder="Enter at least 13 digits"
                      className="h-11 rounded-xl border-slate-200 bg-white text-sm font-bold focus-visible:ring-orange-600"
                    />
                    <p
                      className={`text-[11px] font-semibold leading-5 ${
                        bankReferenceNumber.length > 0 &&
                        bankReferenceNumber.length < 13
                          ? "text-rose-600"
                          : "text-slate-500"
                      }`}
                    >
                      Required for Bank Transfer payments. Numbers only, minimum
                      13 digits. ({bankReferenceNumber.length}/13)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-900">
                      Upload Proof
                    </Label>

                    {!proofFile ? (
                      <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition-colors hover:bg-slate-50">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          onChange={handleFileChange}
                        />
                        <UploadCloud className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                        <p className="text-sm font-bold text-slate-900">
                          Click to upload
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Upload your payment screenshot or receipt.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <FileImage className="h-5 w-5 shrink-0 text-emerald-600" />
                          <p className="break-all text-xs font-bold text-emerald-900">
                            {proofFile.name}
                          </p>
                        </div>

                        <button
                          onClick={() => setProofFile(null)}
                          className="shrink-0 p-1 text-emerald-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <Info className="h-5 w-5 shrink-0 text-amber-600" />
                  <p className="text-xs leading-relaxed text-amber-800">
                    You selected Pay at the Office. Please visit One Estela
                    Place within 24 hours to settle your payment. Your booking
                    will remain as Pencil Booking until the payment is verified
                    by the admin.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl bg-slate-900 p-5 shadow-lg">
              <h3 className="mb-4 text-lg font-black text-white">Summary</h3>

              <div className="mb-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Event
                </p>
                <p className="break-words text-sm font-bold text-white">
                  {booking.eventName}
                </p>

                <div className="mt-3 grid gap-2 text-xs text-slate-400">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {booking.date}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="break-words">{booking.venue}</span>
                  </p>
                </div>
              </div>

              <div className="mb-6 space-y-3 rounded-xl border border-slate-700 bg-slate-800 p-4">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">
                    {isOfficeRental ? "Slot Reservation Fee" : "Total Fee"}
                  </span>
                  <span className="font-bold text-white">
                    ₱{totalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-700 pt-3">
                  <span className="text-xs font-black uppercase text-slate-300">
                    Amount to Pay
                  </span>
                  <span className="text-xl font-black text-orange-500">
                    ₱{amountToPay.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleSubmitPayment}
                disabled={
                  isSubmitting ||
                  isOfficeSecured ||
                  isExpired ||
                  (paymentMethod === "bank" &&
                    (!proofFile ||
                      bankReferenceNumber.replace(/\D/g, "").length < 13))
                }
                className="h-11 w-full rounded-xl bg-orange-600 font-bold text-white shadow-sm transition-transform hover:bg-orange-700 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Processing..."
                  : isOfficeSecured
                    ? "Reservation Secured"
                    : isExpired
                      ? "Payment Expired"
                      : paymentMethod === "cash"
                        ? "Submit Cash Payment"
                        : "Submit Verification"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl animate-in fade-in p-4 duration-500 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          My Transactions
        </h1>
        <p className="mt-1 text-xs text-slate-500 md:text-sm">
          Manage your payments and invoices.
        </p>
      </div>

      {myTransactions.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Receipt className="mb-3 h-12 w-12 text-slate-300" />
          <h3 className="mb-1 text-lg font-black text-slate-900">
            No transactions yet
          </h3>
          <p className="mb-4 text-xs text-slate-500">
            You don&apos;t have any payment history.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {myTransactions.map((booking) => {
            const isCancelled =
              booking.status === "cancelled" || booking.status === "declined";
            const displayTotal = isCancelled ? 0 : booking.totalPrice || 15000;
            const amountPaid =
              typeof booking.amountPaid === "number"
                ? booking.amountPaid
                : booking.paymentType === "downpayment"
                  ? displayTotal * 0.5
                  : booking.paymentStatus === "paid" ||
                      booking.paymentStatus === "verified"
                    ? displayTotal
                    : 0;
            const remainingBalance =
              typeof booking.remainingBalance === "number"
                ? booking.remainingBalance
                : Math.max(displayTotal - amountPaid, 0);
            const isDownpaymentActive =
              booking.status === "confirmed" &&
              booking.paymentType === "downpayment" &&
              !isCancelled;
            const hasCashReminder =
              booking.paymentMethod === "cash" &&
              booking.paymentStatus === "cash_pending";
            const isOfficeRental = isOfficeRentalBooking(booking);
            const isOfficeSecured =
              isOfficeRental &&
              (booking.status === "reservation_secured" ||
                booking.officeReservationStatus === "reservation_secured");
            const officeTracker = booking.officePaymentTracker || [];
            const pendingRemainingMs = getRemainingMs(booking);

            return (
              <div
                key={booking.id}
                className="relative flex min-h-[310px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="relative z-10 mb-4 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="min-w-0 flex-1">
                    <span className="mb-1 block text-[10px] font-black tracking-widest text-slate-400">
                      {booking.id}
                    </span>
                    <h3 className="break-words text-base font-black leading-snug text-slate-900">
                      {booking.eventName}
                    </h3>
                    <p className="mt-1 break-words text-[11px] font-medium leading-snug text-slate-500">
                      {booking.date}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {getTransactionBadge(booking)}
                    <p
                      className={`mt-2 text-lg font-black ${
                        isCancelled
                          ? "text-rose-500 line-through opacity-70"
                          : "text-slate-900"
                      }`}
                    >
                      ₱{displayTotal.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 mb-5 flex-1 space-y-3">
                  {hasCashReminder && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <div className="mb-1 flex items-center gap-2 text-amber-800">
                        <Banknote className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-[10px] font-black uppercase tracking-widest">
                          Payment Method: Pay at the Office
                        </p>
                      </div>
                      <p className="text-xs leading-5 text-amber-800">
                        Please visit the venue within 24 hours to complete your
                        payment. Your booking is not yet confirmed until the
                        admin verifies your payment.
                      </p>
                    </div>
                  )}

                  {booking.status === "pending" && !hasCashReminder && (
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                      <div className="mb-2 flex items-center gap-2 text-orange-800">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">
                          Secure your booking
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-orange-700">
                          Time left
                        </span>
                        <span className="font-black tabular-nums text-orange-700">
                          {formatCountdown(pendingRemainingMs)}
                        </span>
                      </div>
                    </div>
                  )}

                  {isOfficeSecured ? (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">
                          Reservation Secured
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
                          Customer-side online payment is complete. Succeeding
                          office rental payments are settled onsite via check.
                        </p>
                      </div>
                      <OfficePaymentTracker payments={officeTracker} compact />
                    </div>
                  ) : isDownpaymentActive ? (
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-slate-500">
                          Paid (DP)
                        </span>
                        <span className="font-black text-emerald-600">
                          ₱{amountPaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-1.5 text-xs">
                        <span className="font-bold text-slate-500">
                          Balance
                        </span>
                        <span className="font-black text-orange-600">
                          ₱{remainingBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : booking.paymentMethod ? (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                      <div className="text-xs">
                        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                          Method
                        </p>
                        <p className="font-bold capitalize text-slate-700">
                          {booking.paymentMethod === "cash"
                            ? "Pay at the Office"
                            : "Bank Transfer"}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                          Amount
                        </p>
                        <p className="font-black text-slate-900">
                          ₱{amountPaid.toLocaleString()}{" "}
                          <span className="text-[9px] font-medium uppercase">
                            ({booking.paymentType || "pending"})
                          </span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-[10px] font-bold text-orange-800">
                      Settle payment within 24hrs.
                    </div>
                  )}
                </div>

                <div className="relative z-10 mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-bold"
                      >
                        E-Receipt
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="!w-[calc(100vw-1.5rem)] !max-w-[680px] overflow-hidden rounded-[1.35rem] border-slate-200 bg-white p-0 shadow-2xl [&>button]:hidden">
                      <DialogTitle className="sr-only">
                        E-Receipt Details
                      </DialogTitle>

                      <ReceiptDetails
                        booking={booking}
                        isCancelled={isCancelled}
                        displayTotal={displayTotal}
                      />
                    </DialogContent>
                  </Dialog>

                  {isDownpaymentActive && (
                    <Button
                      onClick={() => setSelectedBookingToPay(booking.id)}
                      className="h-10 flex-1 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      Settle Balance
                    </Button>
                  )}

                  {booking.status === "pending" && !hasCashReminder && (
                    <Button
                      onClick={() => setSelectedBookingToPay(booking.id)}
                      className="h-10 flex-1 rounded-xl bg-orange-600 text-xs font-bold text-white hover:bg-orange-700"
                    >
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OfficePaymentTracker({
  payments,
  compact = false,
}: {
  payments: any[];
  compact?: boolean;
}) {
  if (!payments || payments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-600">
        No onsite check payment records yet. Once admin records monthly
        payments, they will appear here.
      </div>
    );
  }

  const visiblePayments = compact ? payments.slice(0, 3) : payments;

  return (
    <div className="space-y-2">
      {visiblePayments.map((payment) => (
        <div
          key={payment.id}
          className="rounded-xl border border-slate-100 bg-slate-50 p-3"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-slate-900">
                {payment.billingPeriod || "Billing period"}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                Check #{payment.checkNumber || "N/A"}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${getOfficePaymentStatusClass(
                payment.paymentStatus,
              )}`}
            >
              {payment.paymentStatus || "Pending"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
            <span>Due: {payment.dueDate || "No due date"}</span>
            <span className="text-right">
              {formatMoney(Number(payment.amountPaid || 0))}
            </span>
          </div>
        </div>
      ))}
      {compact && payments.length > 3 && (
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          +{payments.length - 3} more check payment records
        </p>
      )}
    </div>
  );
}


function formatReceiptDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReceiptDetails({
  booking,
  isCancelled,
  displayTotal,
}: {
  booking: Booking;
  isCancelled: boolean;
  displayTotal: number;
}) {
  const receipt = booking.receipt as any;
  const isOfficeRental = isOfficeRentalBooking(booking);
  const amountToShow = Number(receipt?.amountPaid ?? receipt?.paymentAmount ?? displayTotal ?? 0);
  const remainingBalance = Number(
    receipt?.remainingBalance ??
      (booking as any).remainingBalance ??
      Math.max(Number((booking as any).totalPrice || displayTotal || 0) - Number(amountToShow || 0), 0)
  );
  const contractTerm = receipt?.contractTerm || (booking as any).contractTerm || (booking as any).rentalTerm;
  const paymentType = isOfficeRental
    ? "Slot Reservation Only"
    : receipt?.paymentType || receipt?.paymentPurpose || "Booking Payment";
  const paymentMethod = receipt?.paymentMethod || booking.paymentMethod || "Not specified";
  const paymentStatus = receipt?.paymentStatus || booking.paymentStatus || "Payment Verified";
  const dateGenerated = receipt?.dateGenerated || receipt?.dateIssued || new Date().toISOString();

  return (
    <div className="max-h-[92vh] overflow-y-auto p-4 sm:p-5">
      {!receipt ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 p-4">
            <div>
              <h2 className="text-xl font-black leading-tight text-slate-900">
                E-Receipt Not Generated Yet
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                The system will automatically generate your e-receipt after admin verifies your payment.
              </p>
            </div>

            <DialogClose asChild>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </div>

          <div className="space-y-3 p-4">
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
        </div>
      ) : (
        <div className="mx-auto max-w-[680px] rounded-[1.1rem] border border-slate-200 bg-white shadow-sm">
          <div className="relative border-b border-dashed border-slate-200 px-5 py-4 text-center">
            <DialogClose asChild>
              <button
                type="button"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>

            <h2 className="text-xl font-black tracking-wide text-slate-950 sm:text-2xl">
              ONE ESTELA PLACE
            </h2>
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
                <span className="text-slate-900">{formatReceiptDate(dateGenerated)}</span>
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
                value={receipt.startDate || booking.date || "Not set"}
              />
              <ReceiptLine
                label={isOfficeRental ? "Contract Term" : "Reservation Time"}
                value={isOfficeRental ? contractTerm || "N/A" : getBookingTime(booking)}
              />
            </ReceiptSection>

            <ReceiptDivider />

            <ReceiptSection title="Payment Details">
              <ReceiptLine label="Payment Method" value={paymentMethod} />
              {booking.bankReferenceNumber && (
                <ReceiptLine label="Bank Reference No." value={booking.bankReferenceNumber} />
              )}
              <ReceiptLine label="Payment Type" value={paymentType} />
              <ReceiptLine label="Amount Paid" value={formatMoney(amountToShow)} highlight />
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
      )}
    </div>
  );
}

function ReceiptSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
        {title}
      </h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReceiptLine({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
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
  );
}

function ReceiptDivider() {
  return <div className="border-t border-dashed border-slate-200" />;
}


function getBookingTime(booking: any) {
  if (!booking) return "N/A";

  if (booking.time) return booking.time;
  if (booking.reservationTime) return booking.reservationTime;

  const startTime =
    booking.startTime ||
    booking.start_time ||
    booking.start ||
    booking.bookingStartTime ||
    "";

  const endTime =
    booking.endTime ||
    booking.end_time ||
    booking.end ||
    booking.bookingEndTime ||
    "";

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  if (startTime) return startTime;
  if (endTime) return endTime;

  return "N/A";
}


export default function ClientTransactionsPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}
