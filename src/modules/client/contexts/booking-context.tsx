"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/src/modules/shared/hooks/use-toast";

export type BookingStatus =
  | "pending"
  | "verifying"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "declined"
  | "cancellation_requested"
  | "reservation_secured";

export type PaymentStatus =
  | "unpaid"
  | "cash_pending"
  | "for_review"
  | "partial"
  | "verified"
  | "paid"
  | "rejected"
  | "slot_pending"
  | "slot_verified"
  | "cancelled";

export type CancellationStatus =
  | "None"
  | "Under Review"
  | "Approved"
  | "Declined"
  | "requested"
  | "approved"
  | "declined"
  | "Cancellation Requested"
  | "Cancellation Approved"
  | "Cancellation Declined";

export type RefundStatus =
  | "Not Applicable"
  | "Pending Review"
  | "Refund Eligible"
  | "Non-Refundable"
  | "Refund Pending"
  | "Refund Ready for Claiming"
  | "Refund Claimed"
  | "Not Eligible for Refund";

export type ContractStatus = "Pending" | "Signed";

export type BookingStatusLabel =
  | "Pending Verification"
  | "Confirmed"
  | "Slot Secured"
  | "Cancellation Under Review"
  | "Cancelled"
  | "Completed";

export type OfficeRentalTerm = "6_months" | "1_year" | "2_years";

export type OfficeReservationStatus =
  | "unpaid"
  | "pending_verification"
  | "reservation_secured"
  | "rejected";

export type OfficeCheckPaymentStatus =
  | "Pending"
  | "Paid"
  | "Overdue"
  | "Verified";

export interface OfficeCheckPayment {
  id: string;
  billingPeriod: string;
  amountPaid: number;
  paymentType: "Check";
  checkNumber: string;
  dueDate: string;
  datePaid?: string;
  paymentStatus: OfficeCheckPaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type OfficeLeaseStatus =
  | "Pending Review"
  | "Approved for Contract Signing"
  | "Contract Pending"
  | "Contract Signed"
  | "Advance/Deposit Paid"
  | "Cheques Submitted"
  | "Active Lease"
  | "Declined"
  | "Cancelled"
  | "Completed";

export interface AdminLog {
  action: string;
  message: string;
  createdAt: string;
}

export interface BookingReceipt {
  receiptNumber: string;
  bookingId: string;
  fullName: string;
  bookingDate: string;
  startDate: string;
  endDate: string;
  rentalType: string;
  bookingType: string;
  contractTerm?: string;
  paymentPurpose: string;
  paymentMethod: string;
  amountPaid: number;
  paymentAmount: number;
  paymentStatus: string;
  dateGenerated: string;
  dateIssued: string;
}

export interface Booking {
  id: string;
  userId: string;
  venueId?: string;
  venue?: string;
  eventName: string;
  eventType: string;
  guestCount: number;
  date: string;
  time?: string;
  startTime: string;
  endTime: string;
  specialRequests?: string;
  status: BookingStatus;
  bookingStatus?: BookingStatusLabel;
  isSlotSecured?: boolean;
  createdAt: string;
  updatedAt?: string;
  userInfo?: {
    name: string;
    email: string;
    phone: string;
  };

  cancellationRequested?: boolean;
  cancellationRequestedAt?: string;
  cancellationReviewedAt?: string;
  cancellationStatus?: CancellationStatus;
  cancellationStatusLabel?: string;
  cancellationReason?: string;
  cancellationDeclineReason?: string;
  cancellationDeclinedAt?: string;
  cancellationCooldownUntil?: string;
  previousStatus?: BookingStatus;
  previousBookingStatus?: BookingStatus;
  previousPaymentStatus?: PaymentStatus;

  refundEligible?: boolean;
  refundMethod?: "Cash";
  refundMode?: "Cash";
  refundStatus?: RefundStatus;
  refundEligibilityNote?: string;
  refundClaimNote?: string;
  daysBeforeEventAtCancellation?: number;
  refundReadyDate?: string;
  refundClaimedDate?: string;
  refundInstructions?: string;

  contractSigningRequired?: boolean;
  contractSigned?: boolean;
  contractSignedDate?: string;
  contractStatus?: ContractStatus;

  receiptIssued?: boolean;
  receiptNumber?: string;
  receiptIssuedAt?: string;
  receipt?: BookingReceipt;

  totalPrice: number;
  bookingCategory?: "venue" | "office";
  isOfficeRental?: boolean;
  officeRentalTerm?: OfficeRentalTerm;
  monthlyRent?: number;
  officeReservationFee?: number;
  officeReservationStatus?: OfficeReservationStatus;
  officeContractSigningRequired?: boolean;
  officePaymentInstructions?: string;
  officePaymentTracker?: OfficeCheckPayment[];
  paymentType?: "full" | "downpayment" | "slot_reservation";
  paymentMethod?: "bank" | "cash";
  paymentProof?: string;
  bankReferenceNumber?: string;
  paymentAmount?: number;
  paymentSubmittedAt?: string;
  paymentVerifiedAt?: string;
  paymentRejectedReason?: string;
  paymentRejectionReason?: string;
  incompletePaymentNote?: string;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  remainingBalance?: number;
  remainingBalancePaid?: boolean;
  verifiedByAdmin?: boolean;
  verifiedAt?: string;
  adminLogs?: AdminLog[];
}

export interface OfficeRental {
  id: string;
  userId: string;
  clientName: string;
  contactInfo: {
    email?: string;
    phone?: string;
  };
  officeSpaceId: string;
  officeSpaceName: string;
  monthlyRent: number;
  rentalTerm: OfficeRentalTerm;
  advanceMonths: 1;
  depositMonths: 2;
  advanceAmount: number;
  depositAmount: number;
  totalInitialPayment: number;
  contractStatus: ContractStatus;
  contractSigned: boolean;
  contractSignedDate?: string;
  advanceDepositPaid: boolean;
  advanceDepositPaidDate?: string;
  paymentMethodInitial: "Cash";
  monthlyPaymentMethod: "Cheque";
  chequeSubmissionMethod: "Face-to-face only";
  requiredChequeCount: number;
  submittedChequeCount: number;
  chequesSubmitted: boolean;
  chequeSubmittedDate?: string;
  chequeReceivedByAdmin?: string;
  chequeNotes?: string;
  chequeStatus: "Pending" | "Partial" | "Complete";
  leaseStatus: OfficeLeaseStatus;
  declineReason?: string;
  adminLogs?: AdminLog[];
  createdAt: string;
  updatedAt?: string;
}

interface BookingContextType {
  bookings: Booking[];
  officeRentals: OfficeRental[];
  maintenanceDates: string[];

  addBooking: (booking: Omit<Booking, "id" | "createdAt">) => Promise<string>;
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  cancelBooking: (id: string) => void;
  deleteBooking: (id: string) => void;
  getUserBookings: (userId: string) => Booking[];

  requestCancellation: (id: string, reason: string) => void;
  approveCancellation: (id: string) => void;
  declineCancellation: (id: string, reason: string) => void;
  rejectCancellation: (id: string, reason?: string) => void;
  markRefundReady: (id: string) => void;
  markRefundClaimed: (id: string) => void;

  markContractSigned: (id: string) => void;
  issueReceipt: (id: string) => void;

  verifyCashPayment: (id: string, paymentType?: "downpayment" | "full") => void;
  settleRemainingBalance: (id: string, method?: "cash" | "bank") => void;
  verifyPayment: (id: string) => void;
  rejectPayment: (id: string) => void;
  toggleMaintenanceDate: (date: string, venueId: string) => void;
  submitPayment: (
    id: string,
    paymentData: {
      type: "full" | "downpayment" | "slot_reservation";
      method: "bank" | "cash";
      proof?: string;
      bankReferenceNumber?: string;
      amount?: number;
    },
  ) => void;

  verifyOfficeReservationPayment: (id: string) => void;
  addOfficeCheckPayment: (
    bookingId: string,
    paymentData: Omit<
      OfficeCheckPayment,
      "id" | "createdAt" | "updatedAt" | "paymentType"
    >,
  ) => void;
  updateOfficeCheckPayment: (
    bookingId: string,
    paymentId: string,
    paymentData: Partial<Omit<OfficeCheckPayment, "id" | "createdAt">>,
  ) => void;
  deleteOfficeCheckPayment: (bookingId: string, paymentId: string) => void;

  addOfficeRentalRequest: (
    rentalData: Omit<
      OfficeRental,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "advanceMonths"
      | "depositMonths"
      | "advanceAmount"
      | "depositAmount"
      | "totalInitialPayment"
      | "contractStatus"
      | "contractSigned"
      | "advanceDepositPaid"
      | "paymentMethodInitial"
      | "monthlyPaymentMethod"
      | "chequeSubmissionMethod"
      | "requiredChequeCount"
      | "submittedChequeCount"
      | "chequesSubmitted"
      | "chequeStatus"
      | "leaseStatus"
    >,
  ) => Promise<string>;
  getUserOfficeRentals: (userId: string) => OfficeRental[];
  approveOfficeRentalForContractSigning: (id: string) => void;
  declineOfficeRental: (id: string, reason: string) => void;
  markOfficeContractSigned: (id: string) => void;
  markOfficeAdvanceDepositPaid: (id: string) => void;
  updateOfficeChequeSubmission: (
    id: string,
    submittedChequeCount: number,
    notes?: string,
    receivedByAdmin?: string,
  ) => void;
  activateOfficeLease: (id: string) => void;
  cancelOfficeRental: (id: string) => void;
  completeOfficeRental: (id: string) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const BOOKINGS_STORAGE_KEY = "oneestela_global_bookings_v2";
const MAINTENANCE_STORAGE_KEY = "oneestela_global_maintenance_v2";
const OFFICE_RENTALS_STORAGE_KEY = "oneestela_office_rentals_v1";
const RECEIPTS_STORAGE_KEY = "oneestela_e_receipts_v1";
const DEFAULT_TOTAL_PRICE = 15000;
const REFUND_ELIGIBLE_DAYS = 14;
const CANCELLATION_CLOSED_DAYS = 7;

function safelyParseArray<T>(value: string | null): T[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSafePrice(value: unknown) {
  if (typeof value === "number") return value;

  const cleanedValue = String(value || DEFAULT_TOTAL_PRICE).replace(
    /[^\d.]/g,
    "",
  );
  return Number(cleanedValue) || DEFAULT_TOTAL_PRICE;
}

function parseLocalDate(dateValue?: string) {
  if (!dateValue) return null;

  const normalized = String(dateValue).trim();
  const directDate = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00`)
    : new Date(normalized);

  if (Number.isNaN(directDate.getTime())) return null;

  directDate.setHours(0, 0, 0, 0);
  return directDate;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function calculateDaysBeforeEvent(eventDate?: string) {
  const selected = parseLocalDate(eventDate);
  if (!selected) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = selected.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isCancellationAllowed(eventDate?: string) {
  return calculateDaysBeforeEvent(eventDate) > CANCELLATION_CLOSED_DAYS;
}

export function isRefundEligible(eventDate?: string) {
  return calculateDaysBeforeEvent(eventDate) >= REFUND_ELIGIBLE_DAYS;
}

export function getCancellationMessage(eventDate?: string) {
  const daysBefore = calculateDaysBeforeEvent(eventDate);

  if (daysBefore <= CANCELLATION_CLOSED_DAYS) {
    return "Cancellation is no longer available because your event is within 7 days.";
  }

  if (daysBefore >= REFUND_ELIGIBLE_DAYS) {
    return "Your booking is eligible for cash refund. Refund can be claimed at One Estela Place office after 1 week.";
  }

  return "Cancellation is available, but this booking is not eligible for refund.";
}

export function getRefundStatusLabel(status?: RefundStatus) {
  if (!status) return "No Refund Status";
  return status;
}


function getDisplayBookingStatus(booking: Partial<Booking>): BookingStatusLabel {
  if (booking.status === "completed") return "Completed"
  if (booking.status === "cancelled") return "Cancelled"
  if (booking.status === "cancellation_requested") return "Cancellation Under Review"
  if (booking.status === "reservation_secured") return "Slot Secured"
  if (booking.status === "confirmed") return isOfficeBooking(booking as Booking) ? "Slot Secured" : "Confirmed"
  return "Pending Verification"
}

function isBookingSlotSecured(booking: Partial<Booking>) {
  return Boolean(
    booking.isSlotSecured ||
      booking.verifiedByAdmin ||
      booking.status === "confirmed" ||
      booking.status === "completed" ||
      booking.status === "reservation_secured" ||
      booking.paymentStatus === "paid" ||
      booking.paymentStatus === "verified" ||
      booking.paymentStatus === "partial" ||
      booking.paymentStatus === "slot_verified",
  )
}

function getRefundEligibilityNote(eventDate?: string) {
  const daysBefore = calculateDaysBeforeEvent(eventDate)
  if (daysBefore >= REFUND_ELIGIBLE_DAYS) return "May be eligible for refund"
  if (daysBefore <= CANCELLATION_CLOSED_DAYS) return "Non-refundable based on policy"
  return "Admin review required based on cancellation policy"
}


function getBookingEventDate(booking: Booking) {
  return booking.date;
}

function getDownpaymentAmount(booking: Booking) {
  return getSafePrice(booking.totalPrice) * 0.5;
}

function getCurrentAmountPaid(booking: Booking) {
  if (typeof booking.amountPaid === "number") return booking.amountPaid;

  if (booking.paymentType === "downpayment")
    return getDownpaymentAmount(booking);

  if (
    booking.paymentStatus === "paid" ||
    booking.paymentStatus === "verified"
  ) {
    return getSafePrice(booking.totalPrice);
  }

  return 0;
}

function hasRemainingBalance(booking: Booking) {
  const total = getSafePrice(booking.totalPrice);
  const paid = getCurrentAmountPaid(booking);

  return (
    booking.status === "confirmed" &&
    booking.paymentType === "downpayment" &&
    paid < total &&
    booking.paymentStatus !== "paid" &&
    booking.paymentStatus !== "verified" &&
    booking.remainingBalancePaid !== true
  );
}

function makeAdminLog(
  booking: { adminLogs?: AdminLog[] },
  action: string,
  message: string,
) {
  return [
    ...(booking.adminLogs || []),
    {
      action,
      message,
      createdAt: new Date().toISOString(),
    },
  ];
}

function isOfficeBooking(booking: Partial<Booking>) {
  return (
    booking.isOfficeRental === true ||
    booking.bookingCategory === "office" ||
    String(booking.venue || "")
      .toLowerCase()
      .includes("office")
  );
}

function getOfficeReservationFee(booking: Partial<Booking>) {
  return getSafePrice(
    booking.officeReservationFee || booking.totalPrice || DEFAULT_TOTAL_PRICE,
  );
}

function createOfficePaymentId() {
  return createLocalId("CHECK");
}

function getRequiredChequeCount(term: OfficeRentalTerm) {
  if (term === "6_months") return 6;
  if (term === "1_year") return 12;
  return 24;
}

function getRentalTermLabel(term: OfficeRentalTerm) {
  if (term === "6_months") return "6 months";
  if (term === "1_year") return "1 year";
  return "2 years";
}


function readStoredReceipts() {
  if (typeof window === "undefined") return [] as BookingReceipt[];

  return safelyParseArray<BookingReceipt>(
    localStorage.getItem(RECEIPTS_STORAGE_KEY),
  );
}

function saveStoredReceipt(receipt: BookingReceipt) {
  if (typeof window === "undefined") return;

  const currentReceipts = readStoredReceipts();
  const nextReceipts = [
    receipt,
    ...currentReceipts.filter((item) => item.bookingId !== receipt.bookingId),
  ];

  localStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(nextReceipts));
  window.dispatchEvent(new Event("oneestela_receipts_updated"));
}

function getStoredReceiptByBookingId(bookingId: string) {
  return readStoredReceipts().find((receipt) => receipt.bookingId === bookingId);
}

function formatOfficeContractTerm(term?: OfficeRentalTerm) {
  if (term === "6_months") return "6 Months";
  if (term === "1_year") return "1 Year";
  if (term === "2_years") return "2 Years";
  return undefined;
}

function addMonthsToDate(dateValue?: string, months = 0) {
  const start = parseLocalDate(dateValue);
  if (!start || months <= 0) return dateValue || "Not set";

  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  end.setDate(end.getDate() - 1);

  return end.toISOString().slice(0, 10);
}

function getOfficeTermMonths(term?: OfficeRentalTerm) {
  if (term === "6_months") return 6;
  if (term === "1_year") return 12;
  if (term === "2_years") return 24;
  return 0;
}

function getReceiptPaymentMethodLabel(method?: Booking["paymentMethod"]) {
  if (method === "cash") return "Pay at Office / Cash";
  if (method === "bank") return "Bank Transfer";
  return "Not specified";
}

function getReceiptPaymentPurpose(booking: Booking) {
  if (isOfficeBooking(booking)) {
    return "Slot Reservation Only - not full payment, not monthly rental payment, and not cheque payment.";
  }

  if (booking.paymentType === "downpayment") return "Event Venue Down Payment";
  if (booking.paymentType === "full") return "Event Venue Full Payment";
  return "Event Venue Payment";
}

function getReceiptAmount(booking: Booking) {
  if (isOfficeBooking(booking)) return getOfficeReservationFee(booking);
  return getCurrentAmountPaid(booking) || getSafePrice(booking.totalPrice);
}

function buildAutoReceipt(booking: Booking, generatedAt = new Date().toISOString()) {
  const existingReceipt = booking.receipt || getStoredReceiptByBookingId(booking.id);
  const officeBooking = isOfficeBooking(booking);
  const officeTerm = officeBooking ? booking.officeRentalTerm || "6_months" : undefined;
  const contractTerm = officeBooking ? formatOfficeContractTerm(officeTerm) : undefined;
  const receiptNumber =
    existingReceipt?.receiptNumber ||
    `ER-${new Date(generatedAt).getFullYear()}-${String(Date.now()).slice(-6)}`;

  const receipt: BookingReceipt = {
    receiptNumber,
    bookingId: booking.id,
    fullName: booking.userInfo?.name || "Client",
    bookingDate: booking.createdAt || generatedAt,
    startDate: booking.date || "Not set",
    endDate: officeBooking
      ? addMonthsToDate(booking.date, getOfficeTermMonths(officeTerm))
      : booking.date || "Not set",
    rentalType: officeBooking ? "Office Space Rental" : "Event Venue Booking",
    bookingType: officeBooking ? "Office Space Rental" : booking.eventType || "Event Venue Booking",
    contractTerm,
    paymentPurpose: getReceiptPaymentPurpose(booking),
    paymentMethod: getReceiptPaymentMethodLabel(booking.paymentMethod),
    amountPaid: getReceiptAmount(booking),
    paymentAmount: getReceiptAmount(booking),
    paymentStatus: officeBooking ? "Reservation Secured" : booking.paymentStatus || "paid",
    dateGenerated: existingReceipt?.dateGenerated || generatedAt,
    dateIssued: existingReceipt?.dateIssued || generatedAt,
  };

  return receipt;
}

function attachAutoReceipt(booking: Booking) {
  const generatedAt = new Date().toISOString();
  const receipt = buildAutoReceipt(booking, generatedAt);

  saveStoredReceipt(receipt);

  return {
    ...booking,
    receiptIssued: true,
    receiptNumber: receipt.receiptNumber,
    receiptIssuedAt: receipt.dateGenerated,
    receipt,
    adminLogs: booking.receiptIssued
      ? booking.adminLogs
      : makeAdminLog(
          booking,
          "AUTO_GENERATE_E_RECEIPT",
          `System automatically generated e-receipt ${receipt.receiptNumber} after admin payment verification.`,
        ),
  } as Booking;
}

function normalizeBookingForNewFields(booking: Booking): Booking {
  const officeBooking = isOfficeBooking(booking);
  const savedReceipt = booking.id ? getStoredReceiptByBookingId(booking.id) : undefined;

  return {
    ...booking,
    receipt: booking.receipt || savedReceipt,
    receiptIssued: booking.receiptIssued ?? Boolean(savedReceipt),
    receiptNumber: booking.receiptNumber || savedReceipt?.receiptNumber,
    receiptIssuedAt: booking.receiptIssuedAt || savedReceipt?.dateGenerated || savedReceipt?.dateIssued,
    contractSigningRequired: booking.contractSigningRequired ?? true,
    contractSigned: booking.contractSigned ?? false,
    contractStatus:
      booking.contractStatus || (booking.contractSigned ? "Signed" : "Pending"),
    refundEligible: booking.refundEligible ?? false,
    bookingCategory:
      booking.bookingCategory || (officeBooking ? "office" : "venue"),
    isOfficeRental: booking.isOfficeRental ?? officeBooking,
    officeRentalTerm:
      booking.officeRentalTerm || (officeBooking ? "6_months" : undefined),
    monthlyRent:
      booking.monthlyRent ||
      (officeBooking ? getSafePrice(booking.totalPrice) : undefined),
    officeReservationFee:
      booking.officeReservationFee ||
      (officeBooking ? getSafePrice(booking.totalPrice) : undefined),
    officeReservationStatus:
      booking.officeReservationStatus ||
      (officeBooking
        ? booking.status === "reservation_secured"
          ? "reservation_secured"
          : booking.status === "verifying" ||
              booking.paymentStatus === "for_review" ||
              booking.paymentStatus === "cash_pending"
            ? "pending_verification"
            : "unpaid"
        : undefined),
    officeContractSigningRequired:
      booking.officeContractSigningRequired ?? officeBooking,
    officePaymentInstructions:
      booking.officePaymentInstructions ||
      (officeBooking
        ? "After the reservation slot is secured, succeeding office rental payments are settled onsite via check and recorded by admin."
        : undefined),
    officePaymentTracker: booking.officePaymentTracker || [],
    bookingStatus: booking.bookingStatus || getDisplayBookingStatus(booking),
    isSlotSecured: booking.isSlotSecured ?? isBookingSlotSecured(booking),
    cancellationStatus: booking.cancellationStatus || "None",
    refundStatus: booking.refundStatus || "Not Applicable",
    refundEligibilityNote:
      booking.refundEligibilityNote ||
      (booking.cancellationRequested ? getRefundEligibilityNote(booking.date) : undefined),
    refundMode: booking.refundMode || booking.refundMethod,
    refundClaimNote: booking.refundClaimNote || booking.refundInstructions,
  };
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [officeRentals, setOfficeRentals] = useState<OfficeRental[]>([]);
  const [maintenanceDates, setMaintenanceDates] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadData = () => {
      const loadedBookings = safelyParseArray<Booking>(
        localStorage.getItem(BOOKINGS_STORAGE_KEY),
      ).map(normalizeBookingForNewFields);

      setBookings(loadedBookings);

      setOfficeRentals(
        safelyParseArray<OfficeRental>(
          localStorage.getItem(OFFICE_RENTALS_STORAGE_KEY),
        ),
      );

      setMaintenanceDates(
        safelyParseArray<string>(localStorage.getItem(MAINTENANCE_STORAGE_KEY)),
      );
    };

    loadData();

    window.addEventListener("storage", loadData);
    window.addEventListener("bookingsUpdated", loadData);
    window.addEventListener("oneestela_bookings_updated", loadData);
    window.addEventListener("oneestela_office_rentals_updated", loadData);

    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("bookingsUpdated", loadData);
      window.removeEventListener("oneestela_bookings_updated", loadData);
      window.removeEventListener("oneestela_office_rentals_updated", loadData);
    };
  }, []);

  const saveBookings = (newBookings: Booking[]) => {
    const normalizedBookings = newBookings.map(normalizeBookingForNewFields);
    setBookings(normalizedBookings);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        BOOKINGS_STORAGE_KEY,
        JSON.stringify(normalizedBookings),
      );
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("oneestela_bookings_updated"));
    }
  };

  const saveOfficeRentals = (newOfficeRentals: OfficeRental[]) => {
    setOfficeRentals(newOfficeRentals);

    if (typeof window !== "undefined") {
      localStorage.setItem(
        OFFICE_RENTALS_STORAGE_KEY,
        JSON.stringify(newOfficeRentals),
      );
      window.dispatchEvent(new Event("oneestela_office_rentals_updated"));
    }
  };

  const saveMaintenance = (newDates: string[]) => {
    setMaintenanceDates(newDates);

    if (typeof window !== "undefined") {
      localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(newDates));
      window.dispatchEvent(new Event("bookingsUpdated"));
      window.dispatchEvent(new Event("oneestela_bookings_updated"));
    }
  };

  const addBooking = async (bookingData: Omit<Booking, "id" | "createdAt">) => {
    const newId =
      "BK" +
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");

    const newBooking: Booking = {
      ...bookingData,
      id: newId,
      status: bookingData.status || "pending",
      bookingStatus: bookingData.bookingStatus || "Pending Verification",
      isSlotSecured: bookingData.isSlotSecured || false,
      cancellationRequested: bookingData.cancellationRequested || false,
      cancellationStatus: bookingData.cancellationStatus || "None",
      refundStatus: bookingData.refundStatus || "Not Applicable",
      paymentStatus: bookingData.paymentStatus || "unpaid",
      amountPaid: bookingData.amountPaid || 0,
      remainingBalance:
        bookingData.remainingBalance || getSafePrice(bookingData.totalPrice),
      remainingBalancePaid: bookingData.remainingBalancePaid || false,
      contractSigningRequired: true,
      contractSigned: bookingData.contractSigned || false,
      contractStatus: bookingData.contractSigned ? "Signed" : "Pending",
      receiptIssued: bookingData.receiptIssued || false,
      refundEligible: false,
      adminLogs: [
        ...(bookingData.adminLogs || []),
        {
          action: "CONTRACT_SIGNING_REQUIRED",
          message:
            "Please visit One Estela Place office after booking to sign the contract and finalize your reservation.",
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Booking;

    saveBookings([...bookings, newBooking]);
    return newId;
  };

  const updateBookingStatus = (id: string, status: BookingStatus) => {
    const targetBooking = bookings.find((booking) => booking.id === id);

    if (
      status === "completed" &&
      targetBooking &&
      hasRemainingBalance(targetBooking)
    ) {
      toast({
        title: "Remaining Balance Required",
        description: "This booking still has an unpaid remaining balance.",
        variant: "destructive",
      });
      return;
    }

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      if (isOfficeBooking(booking) && status === "reservation_secured") {
        const reservationFee = getOfficeReservationFee(booking);

        return attachAutoReceipt({
          ...booking,
          status: "reservation_secured" as BookingStatus,
          bookingStatus: "Slot Secured",
          isSlotSecured: true,
          paymentStatus: "slot_verified" as PaymentStatus,
          paymentType: "slot_reservation" as const,
          amountPaid: reservationFee,
          remainingBalance: 0,
          remainingBalancePaid: true,
          officeReservationStatus:
            "reservation_secured" as OfficeReservationStatus,
          officeContractSigningRequired: true,
          officePaymentInstructions:
            "Reservation slot is secured. Please visit One Estela Place to sign the contract. Succeeding office rental payments are settled onsite via check and recorded by admin.",
          verifiedByAdmin: true,
          verifiedAt: new Date().toISOString(),
          paymentVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          adminLogs: makeAdminLog(
            booking,
            "OFFICE_SLOT_SECURED",
            "Admin verified office reservation payment. Slot is now secured. Future payments will be tracked manually via onsite checks.",
          ),
        });
      }

      const shouldVerifyPayment =
        status === "confirmed" &&
        (booking.status === "verifying" ||
          booking.paymentStatus === "for_review");

      const total = getSafePrice(booking.totalPrice);
      const downpayment = getDownpaymentAmount(booking);
      const isDownpayment = booking.paymentType === "downpayment";

      const updatedBooking = {
        ...booking,
        status,
        bookingStatus: status === "confirmed" ? "Confirmed" : getDisplayBookingStatus({ ...booking, status }),
        isSlotSecured: shouldVerifyPayment || booking.isSlotSecured || status === "confirmed" || status === "reservation_secured",
        paymentStatus: shouldVerifyPayment
          ? isDownpayment
            ? ("partial" as PaymentStatus)
            : ("paid" as PaymentStatus)
          : booking.paymentStatus,
        amountPaid: shouldVerifyPayment
          ? isDownpayment
            ? downpayment
            : total
          : booking.amountPaid,
        remainingBalance: shouldVerifyPayment
          ? isDownpayment
            ? total - downpayment
            : 0
          : booking.remainingBalance,
        remainingBalancePaid: shouldVerifyPayment
          ? !isDownpayment
          : booking.remainingBalancePaid,
        verifiedByAdmin: shouldVerifyPayment ? true : booking.verifiedByAdmin,
        verifiedAt: shouldVerifyPayment
          ? new Date().toISOString()
          : booking.verifiedAt,
        adminLogs: shouldVerifyPayment
          ? makeAdminLog(
              booking,
              "VERIFY_PAYMENT",
              isDownpayment
                ? "Admin verified downpayment. Remaining balance is still unpaid."
                : "Admin verified full payment and confirmed booking.",
            )
          : booking.adminLogs,
        updatedAt: new Date().toISOString(),
      } as Booking;

      return shouldVerifyPayment ? attachAutoReceipt(updatedBooking) : updatedBooking;
    });

    saveBookings(updatedBookings);
  };

  const cancelBooking = (id: string) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      return {
        ...booking,
        status: "cancelled" as BookingStatus,
        bookingStatus: "Cancelled",
        cancellationStatus: "Approved" as const,
        cancellationReviewedAt: new Date().toISOString(),
        cancellationStatusLabel: "Cancellation Approved",
        paymentStatus:
          booking.paymentStatus === "for_review" ||
          booking.paymentStatus === "verified" ||
          booking.paymentStatus === "paid" ||
          booking.paymentStatus === "partial"
            ? booking.paymentStatus
            : "cancelled",
        updatedAt: new Date().toISOString(),
      };
    });

    saveBookings(updatedBookings);
  };

  const deleteBooking = (id: string) => {
    saveBookings(bookings.filter((booking) => booking.id !== id));
  };

  const getUserBookings = (userId: string) => {
    return bookings.filter((booking) => booking.userId === userId);
  };

  const requestCancellation = (id: string, reason: string) => {
    const targetBooking = bookings.find((booking) => booking.id === id);

    if (!targetBooking) return;

    if (!isBookingSlotSecured(targetBooking)) {
      toast({
        title: "Cancellation Not Available",
        description:
          "Cancellation and refund requests are only available after the slot has been secured and payment has been verified.",
        variant: "destructive",
      });
      return;
    }

    const eventDate = getBookingEventDate(targetBooking);
    const daysBefore = calculateDaysBeforeEvent(eventDate);
    const eligibilityNote = getRefundEligibilityNote(eventDate);
    const likelyEligible = daysBefore >= REFUND_ELIGIBLE_DAYS;

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      return {
        ...booking,
        previousStatus: booking.status,
        previousBookingStatus: booking.status,
        previousPaymentStatus: booking.paymentStatus || "unpaid",
        status: "cancellation_requested" as BookingStatus,
        bookingStatus: "Cancellation Under Review",
        cancellationRequested: true,
        cancellationRequestedAt: new Date().toISOString(),
        cancellationStatus: "Under Review" as const,
        cancellationStatusLabel: "Under Review",
        cancellationReason: reason,
        refundEligible: likelyEligible,
        refundMethod: likelyEligible ? "Cash" : undefined,
        refundMode: likelyEligible ? "Cash" : undefined,
        refundStatus: "Pending Review" as RefundStatus,
        refundEligibilityNote: eligibilityNote,
        refundClaimNote: likelyEligible
          ? "If approved by admin, refund may be claimed onsite in cash within the allowed processing period."
          : "No refund will be processed if admin confirms the request is non-refundable based on policy.",
        daysBeforeEventAtCancellation: daysBefore,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "REQUEST_CANCELLATION",
          `Client requested cancellation. Refund eligibility note: ${eligibilityNote}. Days before event: ${daysBefore}.`,
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const approveCancellation = (id: string) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      const eventDate = getBookingEventDate(booking);
      const daysBefore = booking.daysBeforeEventAtCancellation ?? calculateDaysBeforeEvent(eventDate);
      const eligible = daysBefore >= REFUND_ELIGIBLE_DAYS;
      const approvedAt = new Date();
      const readyDate = addDays(approvedAt, 7).toISOString();

      return {
        ...booking,
        status: "cancelled" as BookingStatus,
        bookingStatus: "Cancelled",
        cancellationRequested: false,
        cancellationStatus: "Approved" as const,
        cancellationStatusLabel: "Approved",
        cancellationReviewedAt: approvedAt.toISOString(),
        refundEligible: eligible,
        refundMethod: eligible ? ("Cash" as const) : undefined,
        refundMode: eligible ? ("Cash" as const) : undefined,
        refundStatus: eligible ? ("Refund Eligible" as RefundStatus) : ("Non-Refundable" as RefundStatus),
        refundReadyDate: eligible ? readyDate : undefined,
        refundEligibilityNote: eligible
          ? "May be eligible for refund"
          : "Non-refundable based on policy",
        refundClaimNote: eligible
          ? "Refund may be claimed onsite in cash within the allowed processing period."
          : "No refund will be processed based on the venue cancellation policy.",
        refundInstructions: eligible
          ? "Refund may be claimed onsite in cash within the allowed processing period."
          : "No refund will be processed based on the venue cancellation policy.",
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "APPROVE_CANCELLATION",
          eligible
            ? "Admin approved cancellation. Refund is eligible and can be claimed onsite in cash."
            : "Admin approved cancellation. Booking is non-refundable based on policy.",
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const declineCancellation = (id: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Decline Reason Required",
        description:
          "Please provide a reason before declining the cancellation request.",
        variant: "destructive",
      });
      return;
    }

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      const restoredBookingStatus =
        booking.previousBookingStatus || booking.previousStatus || "confirmed";

      const restoredPaymentStatus =
        booking.previousPaymentStatus || booking.paymentStatus || "paid";

      const restoredBooking = {
        ...booking,
        status: restoredBookingStatus,
        bookingStatus: getDisplayBookingStatus({ ...booking, status: restoredBookingStatus }),
        paymentStatus: restoredPaymentStatus,
        isSlotSecured: isBookingSlotSecured({ ...booking, status: restoredBookingStatus, paymentStatus: restoredPaymentStatus }),
        cancellationRequested: false,
        cancellationStatus: "Declined" as const,
        cancellationStatusLabel: "Declined",
        cancellationReviewedAt: new Date().toISOString(),
        cancellationDeclinedAt: new Date().toISOString(),
        cancellationCooldownUntil: addDays(new Date(), 0).getTime() ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : undefined,
        cancellationDeclineReason: reason.trim(),
        refundStatus: "Not Applicable" as RefundStatus,
        refundEligibilityNote: undefined,
        refundClaimNote: undefined,
        previousStatus: undefined,
        previousBookingStatus: undefined,
        previousPaymentStatus: undefined,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "DECLINE_CANCELLATION_REQUEST",
          `Cancellation request declined. Reason: ${reason.trim()}`,
        ),
      } as Booking;

      return restoredBooking;
    });

    saveBookings(updatedBookings);
  };

  const rejectCancellation = (id: string, reason?: string) => {
    declineCancellation(id, reason || "");
  };

  const markRefundReady = (id: string) => {
    const targetBooking = bookings.find((booking) => booking.id === id);

    if (!targetBooking || targetBooking.refundStatus !== "Refund Pending") {
      toast({
        title: "Refund Not Pending",
        description:
          "Only pending refunds can be marked as ready for claiming.",
        variant: "destructive",
      });
      return;
    }

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      return {
        ...booking,
        refundStatus: "Refund Ready for Claiming" as RefundStatus,
        refundReadyDate: booking.refundReadyDate || new Date().toISOString(),
        refundInstructions:
          "Your cash refund is ready. Please claim it at the One Estela Place office.",
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "MARK_REFUND_READY",
          "Admin marked cash refund as ready for claiming.",
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const markRefundClaimed = (id: string) => {
    const targetBooking = bookings.find((booking) => booking.id === id);

    if (
      !targetBooking ||
      targetBooking.refundStatus !== "Refund Ready for Claiming"
    ) {
      toast({
        title: "Refund Not Ready",
        description:
          "Refund can only be marked as claimed when it is ready for claiming.",
        variant: "destructive",
      });
      return;
    }

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      return {
        ...booking,
        refundStatus: "Refund Claimed" as RefundStatus,
        refundClaimedDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "MARK_REFUND_CLAIMED",
          "Admin marked cash refund as claimed at the office.",
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const markContractSigned = (id: string) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      return {
        ...booking,
        contractSigningRequired: true,
        contractSigned: true,
        contractSignedDate: new Date().toISOString(),
        contractStatus: "Signed" as ContractStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "MARK_CONTRACT_SIGNED",
          "Admin marked contract as signed at One Estela Place office.",
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const issueReceipt = (id: string) => {
    const targetBooking = bookings.find((booking) => booking.id === id);

    if (!targetBooking) return;

    const hasPayment =
      targetBooking.paymentStatus === "paid" ||
      targetBooking.paymentStatus === "verified" ||
      targetBooking.paymentStatus === "partial" ||
      targetBooking.paymentStatus === "slot_verified" ||
      getCurrentAmountPaid(targetBooking) > 0 ||
      isOfficeBooking(targetBooking);

    if (!hasPayment) {
      toast({
        title: "No Verified Payment Found",
        description: "The system can only generate an e-receipt after admin payment verification.",
        variant: "destructive",
      });
      return;
    }

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;
      return attachAutoReceipt(booking);
    });

    saveBookings(updatedBookings);
  };

  const verifyCashPayment = (
    id: string,
    paymentType: "downpayment" | "full" = "full",
  ) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      if (isOfficeBooking(booking)) {
        const reservationFee = getOfficeReservationFee(booking);

        return attachAutoReceipt({
          ...booking,
          status: "reservation_secured" as BookingStatus,
          bookingStatus: "Slot Secured",
          isSlotSecured: true,
          paymentStatus: "slot_verified" as PaymentStatus,
          paymentType: "slot_reservation" as const,
          paymentMethod: "cash" as const,
          amountPaid: reservationFee,
          remainingBalance: 0,
          remainingBalancePaid: true,
          officeReservationStatus:
            "reservation_secured" as OfficeReservationStatus,
          officeContractSigningRequired: true,
          verifiedByAdmin: true,
          verifiedAt: new Date().toISOString(),
          paymentVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          adminLogs: makeAdminLog(
            booking,
            "VERIFY_OFFICE_SLOT_CASH_PAYMENT",
            "Admin verified office slot reservation payment paid at the office. Future payments are onsite check payments tracked by admin.",
          ),
        });
      }

      const total = getSafePrice(booking.totalPrice);
      const downpayment = getDownpaymentAmount(booking);
      const isDownpayment = paymentType === "downpayment";
      const paidAmount = isDownpayment ? downpayment : total;
      const remainingBalance = Math.max(total - paidAmount, 0);

      return attachAutoReceipt({
        ...booking,
        status: "confirmed" as BookingStatus,
        bookingStatus: "Confirmed",
        isSlotSecured: true,
        paymentStatus: isDownpayment
          ? ("partial" as PaymentStatus)
          : ("paid" as PaymentStatus),
        paymentType,
        paymentMethod: "cash" as const,
        amountPaid: paidAmount,
        remainingBalance,
        remainingBalancePaid: !isDownpayment,
        verifiedByAdmin: true,
        verifiedAt: new Date().toISOString(),
        contractSigningRequired: true,
        contractSigned: booking.contractSigned || false,
        contractStatus: booking.contractSigned ? "Signed" : "Pending",
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          isDownpayment ? "VERIFY_CASH_DOWNPAYMENT" : "VERIFY_CASH_PAYMENT",
          isDownpayment
            ? `Admin manually verified cash downpayment of ₱${downpayment.toLocaleString()}. Remaining balance is ₱${remainingBalance.toLocaleString()}. Contract signing is still required.`
            : "Admin manually verified full cash payment. Contract signing is still required.",
        ),
      });
    });

    saveBookings(updatedBookings);
  };

  const settleRemainingBalance = (
    id: string,
    method: "cash" | "bank" = "cash",
  ) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      const total = getSafePrice(booking.totalPrice);
      const previousPaid = getCurrentAmountPaid(booking);
      const balance = Math.max(total - previousPaid, 0);

      return attachAutoReceipt({
        ...booking,
        status: "confirmed" as BookingStatus,
        bookingStatus: "Confirmed",
        isSlotSecured: true,
        paymentStatus: "paid" as PaymentStatus,
        paymentType: "full" as const,
        paymentMethod: method,
        amountPaid: total,
        remainingBalance: 0,
        remainingBalancePaid: true,
        verifiedByAdmin: true,
        verifiedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "SETTLE_REMAINING_BALANCE",
          `Admin marked remaining balance of ₱${balance.toLocaleString()} as paid.`,
        ),
      });
    });

    saveBookings(updatedBookings);
  };

  const verifyPayment = (id: string) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      if (isOfficeBooking(booking)) {
        const reservationFee = getOfficeReservationFee(booking);

        return attachAutoReceipt({
          ...booking,
          status: "reservation_secured" as BookingStatus,
          bookingStatus: "Slot Secured",
          isSlotSecured: true,
          paymentStatus: "slot_verified" as PaymentStatus,
          paymentType: "slot_reservation" as const,
          amountPaid: reservationFee,
          remainingBalance: 0,
          remainingBalancePaid: true,
          officeReservationStatus:
            "reservation_secured" as OfficeReservationStatus,
          officeContractSigningRequired: true,
          verifiedByAdmin: true,
          verifiedAt: new Date().toISOString(),
          paymentVerifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          adminLogs: makeAdminLog(
            booking,
            "VERIFY_OFFICE_SLOT_PAYMENT",
            "Admin verified office slot reservation payment. Reservation is secured. Future payments are onsite check payments tracked by admin.",
          ),
        });
      }

      const total = getSafePrice(booking.totalPrice);
      const downpayment = getDownpaymentAmount(booking);
      const isDownpayment = booking.paymentType === "downpayment";
      const paidAmount = isDownpayment ? downpayment : total;
      const remainingBalance = Math.max(total - paidAmount, 0);

      return attachAutoReceipt({
        ...booking,
        status: "confirmed" as BookingStatus,
        bookingStatus: "Confirmed",
        isSlotSecured: true,
        paymentStatus: isDownpayment
          ? ("partial" as PaymentStatus)
          : ("paid" as PaymentStatus),
        amountPaid: paidAmount,
        remainingBalance,
        remainingBalancePaid: !isDownpayment,
        verifiedByAdmin: true,
        verifiedAt: new Date().toISOString(),
        contractSigningRequired: true,
        contractSigned: booking.contractSigned || false,
        contractStatus: booking.contractSigned ? "Signed" : "Pending",
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "VERIFY_PAYMENT",
          isDownpayment
            ? "Admin verified downpayment. Remaining balance is still unpaid. Contract signing is still required."
            : "Admin verified full payment and confirmed booking. Contract signing is still required.",
        ),
      });
    });

    saveBookings(updatedBookings);
  };

  const rejectPayment = (id: string) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      return {
        ...booking,
        status: "pending" as BookingStatus,
        bookingStatus: "Pending Verification",
        isSlotSecured: false,
        paymentStatus: "rejected" as PaymentStatus,
        paymentRejectedReason: booking.paymentRejectedReason || "Payment rejected by admin.",
        paymentRejectionReason: booking.paymentRejectionReason || booking.paymentRejectedReason || "Payment rejected by admin.",
        amountPaid: 0,
        remainingBalance: getSafePrice(booking.totalPrice),
        remainingBalancePaid: false,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "REJECT_PAYMENT",
          "Admin rejected payment proof. Booking returned to Pencil Booking.",
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const toggleMaintenanceDate = (date: string, venueId: string) => {
    const key = `${venueId}|${date}`;

    if (maintenanceDates.includes(key)) {
      saveMaintenance(maintenanceDates.filter((item) => item !== key));
      toast({
        title: "Maintenance Removed",
        description: `Venue is now available on ${date}.`,
      });
      return;
    }

    saveMaintenance([...maintenanceDates, key]);
    toast({
      title: "Maintenance Set",
      description: `Venue is now blocked on ${date}.`,
      className: "bg-slate-900 text-white",
    });
  };

  const submitPayment = (
    id: string,
    paymentData: {
      type: "full" | "downpayment" | "slot_reservation";
      method: "bank" | "cash";
      proof?: string;
      bankReferenceNumber?: string;
      amount?: number;
    },
  ) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== id) return booking;

      const total = getSafePrice(booking.totalPrice);
      const currentPaid = getCurrentAmountPaid(booking);
      const isCash = paymentData.method === "cash";

      if (isOfficeBooking(booking)) {
        const reservationFee = getOfficeReservationFee(booking);

        return {
          ...booking,
          status: "verifying" as BookingStatus,
          bookingStatus: "Pending Verification",
          isSlotSecured: false,
          paymentStatus: isCash
            ? ("cash_pending" as PaymentStatus)
            : ("for_review" as PaymentStatus),
          paymentType: "slot_reservation" as const,
          paymentMethod: paymentData.method,
          paymentProof: paymentData.proof,
          bankReferenceNumber: paymentData.method === "bank" ? paymentData.bankReferenceNumber?.trim() : undefined,
          paymentAmount: Number(paymentData.amount || reservationFee),
          paymentSubmittedAt: new Date().toISOString(),
          amountPaid: 0,
          remainingBalance: 0,
          remainingBalancePaid: false,
          officeReservationFee: reservationFee,
          officeReservationStatus:
            "pending_verification" as OfficeReservationStatus,
          officeContractSigningRequired: true,
          officePaymentInstructions:
            "This payment secures your office reservation slot only. After admin verification, succeeding rental payments are settled onsite via check and recorded by admin.",
          verifiedByAdmin: false,
          updatedAt: new Date().toISOString(),
          adminLogs: makeAdminLog(
            booking,
            "OFFICE_SLOT_PAYMENT_SUBMITTED",
            isCash
              ? "Client selected cash payment at office for office slot reservation."
              : "Client submitted proof for office slot reservation payment.",
          ),
        };
      }

      const isSettlingBalance =
        booking.status === "confirmed" &&
        booking.paymentType === "downpayment" &&
        currentPaid < total;

      if (isSettlingBalance) {
        return {
          ...booking,
          status: isCash
            ? ("confirmed" as BookingStatus)
            : ("verifying" as BookingStatus),
          bookingStatus: "Pending Verification",
          isSlotSecured: false,
          paymentStatus: isCash
            ? ("cash_pending" as PaymentStatus)
            : ("for_review" as PaymentStatus),
          paymentMethod: paymentData.method,
          paymentProof: paymentData.proof,
          bankReferenceNumber: paymentData.method === "bank" ? paymentData.bankReferenceNumber?.trim() : booking.bankReferenceNumber,
          paymentAmount: Number(paymentData.amount || Math.max(total - currentPaid, 0)),
          paymentSubmittedAt: new Date().toISOString(),
          remainingBalance: Math.max(total - currentPaid, 0),
          remainingBalancePaid: false,
          verifiedByAdmin: false,
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        ...booking,
        status: isCash
          ? ("pending" as BookingStatus)
          : ("verifying" as BookingStatus),
        bookingStatus: "Pending Verification",
        isSlotSecured: false,
        paymentStatus: isCash
          ? ("cash_pending" as PaymentStatus)
          : ("for_review" as PaymentStatus),
        paymentType: paymentData.type,
        paymentMethod: paymentData.method,
        paymentProof: paymentData.proof,
        bankReferenceNumber: paymentData.method === "bank" ? paymentData.bankReferenceNumber?.trim() : undefined,
        paymentAmount: Number(paymentData.amount || total),
        paymentSubmittedAt: new Date().toISOString(),
        amountPaid: 0,
        remainingBalance: total,
        remainingBalancePaid: false,
        verifiedByAdmin: false,
        updatedAt: new Date().toISOString(),
      };
    });

    saveBookings(updatedBookings);
  };

  const addOfficeRentalRequest = async (
    rentalData: Omit<
      OfficeRental,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "advanceMonths"
      | "depositMonths"
      | "advanceAmount"
      | "depositAmount"
      | "totalInitialPayment"
      | "contractStatus"
      | "contractSigned"
      | "advanceDepositPaid"
      | "paymentMethodInitial"
      | "monthlyPaymentMethod"
      | "chequeSubmissionMethod"
      | "requiredChequeCount"
      | "submittedChequeCount"
      | "chequesSubmitted"
      | "chequeStatus"
      | "leaseStatus"
    >,
  ) => {
    const requiredChequeCount = getRequiredChequeCount(rentalData.rentalTerm);
    const monthlyRent = getSafePrice(rentalData.monthlyRent);
    const advanceAmount = monthlyRent;
    const depositAmount = monthlyRent * 2;

    const newOfficeRental: OfficeRental = {
      ...rentalData,
      id: createLocalId("OFFICE"),
      monthlyRent,
      advanceMonths: 1,
      depositMonths: 2,
      advanceAmount,
      depositAmount,
      totalInitialPayment: advanceAmount + depositAmount,
      contractStatus: "Pending",
      contractSigned: false,
      advanceDepositPaid: false,
      paymentMethodInitial: "Cash",
      monthlyPaymentMethod: "Cheque",
      chequeSubmissionMethod: "Face-to-face only",
      requiredChequeCount,
      submittedChequeCount: 0,
      chequesSubmitted: false,
      chequeStatus: "Pending",
      leaseStatus: "Pending Review",
      adminLogs: [
        {
          action: "OFFICE_RENTAL_REQUEST_CREATED",
          message: `Office rental request submitted for ${getRentalTermLabel(
            rentalData.rentalTerm,
          )}. Cheque payments are face-to-face only.`,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveOfficeRentals([...officeRentals, newOfficeRental]);
    return newOfficeRental.id;
  };

  const getUserOfficeRentals = (userId: string) => {
    return officeRentals.filter((rental) => rental.userId === userId);
  };

  const approveOfficeRentalForContractSigning = (id: string) => {
    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      return {
        ...rental,
        leaseStatus: "Approved for Contract Signing" as OfficeLeaseStatus,
        contractStatus: "Pending" as ContractStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "APPROVED_FOR_CONTRACT_SIGNING",
          "Admin approved office rental request for face-to-face contract signing.",
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const declineOfficeRental = (id: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Decline Reason Required",
        description:
          "Please provide a reason before declining this office rental request.",
        variant: "destructive",
      });
      return;
    }

    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      return {
        ...rental,
        leaseStatus: "Declined" as OfficeLeaseStatus,
        declineReason: reason.trim(),
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "OFFICE_RENTAL_DECLINED",
          `Office rental request declined. Reason: ${reason.trim()}`,
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const markOfficeContractSigned = (id: string) => {
    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      return {
        ...rental,
        contractSigned: true,
        contractSignedDate: new Date().toISOString(),
        contractStatus: "Signed" as ContractStatus,
        leaseStatus: "Contract Signed" as OfficeLeaseStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "OFFICE_CONTRACT_SIGNED",
          "Admin marked office rental contract as signed at the office.",
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const markOfficeAdvanceDepositPaid = (id: string) => {
    const target = officeRentals.find((rental) => rental.id === id);

    if (!target?.contractSigned) {
      toast({
        title: "Contract Not Signed",
        description:
          "Contract must be signed before marking advance/deposit as paid.",
        variant: "destructive",
      });
      return;
    }

    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      return {
        ...rental,
        advanceDepositPaid: true,
        advanceDepositPaidDate: new Date().toISOString(),
        leaseStatus: "Advance/Deposit Paid" as OfficeLeaseStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "ADVANCE_DEPOSIT_PAID",
          "Admin confirmed 1 month advance and 2 months deposit paid in cash at the office.",
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const updateOfficeChequeSubmission = (
    id: string,
    submittedChequeCount: number,
    notes?: string,
    receivedByAdmin?: string,
  ) => {
    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      const safeCount = Math.max(
        0,
        Math.min(Number(submittedChequeCount || 0), rental.requiredChequeCount),
      );

      const isComplete = safeCount >= rental.requiredChequeCount;

      return {
        ...rental,
        submittedChequeCount: safeCount,
        chequesSubmitted: isComplete,
        chequeSubmittedDate: isComplete
          ? new Date().toISOString()
          : rental.chequeSubmittedDate,
        chequeReceivedByAdmin: receivedByAdmin || rental.chequeReceivedByAdmin,
        chequeNotes: notes ?? rental.chequeNotes,
        chequeStatus: isComplete
          ? "Complete"
          : safeCount > 0
            ? "Partial"
            : "Pending",
        leaseStatus: isComplete
          ? ("Cheques Submitted" as OfficeLeaseStatus)
          : rental.leaseStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "PHYSICAL_CHEQUES_UPDATED",
          `Admin updated physical cheque submission count to ${safeCount}/${rental.requiredChequeCount}.`,
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const activateOfficeLease = (id: string) => {
    const target = officeRentals.find((rental) => rental.id === id);

    if (!target) return;

    if (!target.contractSigned) {
      toast({
        title: "Cannot Activate Lease",
        description: "Contract must be signed first.",
        variant: "destructive",
      });
      return;
    }

    if (!target.advanceDepositPaid) {
      toast({
        title: "Cannot Activate Lease",
        description: "Advance and deposit payment must be confirmed first.",
        variant: "destructive",
      });
      return;
    }

    if (
      !target.chequesSubmitted ||
      target.submittedChequeCount < target.requiredChequeCount
    ) {
      toast({
        title: "Cannot Activate Lease",
        description:
          "Required physical cheques must be submitted face-to-face before activating the lease.",
        variant: "destructive",
      });
      return;
    }

    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      return {
        ...rental,
        leaseStatus: "Active Lease" as OfficeLeaseStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "OFFICE_LEASE_ACTIVATED",
          "Admin activated office lease after contract signing, cash advance/deposit payment, and physical cheque submission.",
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const cancelOfficeRental = (id: string) => {
    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      return {
        ...rental,
        leaseStatus: "Cancelled" as OfficeLeaseStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "OFFICE_RENTAL_CANCELLED",
          "Office rental request was cancelled.",
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const completeOfficeRental = (id: string) => {
    const updatedRentals = officeRentals.map((rental) => {
      if (rental.id !== id) return rental;

      return {
        ...rental,
        leaseStatus: "Completed" as OfficeLeaseStatus,
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          rental,
          "OFFICE_RENTAL_COMPLETED",
          "Office rental lease was marked as completed.",
        ),
      };
    });

    saveOfficeRentals(updatedRentals);
  };

  const verifyOfficeReservationPayment = (id: string) => {
    updateBookingStatus(id, "reservation_secured" as BookingStatus);
  };

  const addOfficeCheckPayment = (
    bookingId: string,
    paymentData: Omit<
      OfficeCheckPayment,
      "id" | "createdAt" | "updatedAt" | "paymentType"
    >,
  ) => {
    const now = new Date().toISOString();

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== bookingId) return booking;

      const tracker = booking.officePaymentTracker || [];
      const newPayment: OfficeCheckPayment = {
        ...paymentData,
        id: createOfficePaymentId(),
        paymentType: "Check",
        amountPaid: Number(paymentData.amountPaid || 0),
        createdAt: now,
        updatedAt: now,
      };

      return {
        ...booking,
        officePaymentTracker: [...tracker, newPayment],
        updatedAt: now,
        adminLogs: makeAdminLog(
          booking,
          "ADD_OFFICE_CHECK_PAYMENT",
          `Admin added check payment record for ${paymentData.billingPeriod}.`,
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const updateOfficeCheckPayment = (
    bookingId: string,
    paymentId: string,
    paymentData: Partial<Omit<OfficeCheckPayment, "id" | "createdAt">>,
  ) => {
    const now = new Date().toISOString();

    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== bookingId) return booking;

      return {
        ...booking,
        officePaymentTracker: (booking.officePaymentTracker || []).map(
          (payment) =>
            payment.id === paymentId
              ? {
                  ...payment,
                  ...paymentData,
                  amountPaid:
                    typeof paymentData.amountPaid === "number"
                      ? paymentData.amountPaid
                      : payment.amountPaid,
                  paymentType: "Check" as const,
                  updatedAt: now,
                }
              : payment,
        ),
        updatedAt: now,
        adminLogs: makeAdminLog(
          booking,
          "UPDATE_OFFICE_CHECK_PAYMENT",
          "Admin updated an office check payment record.",
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  const deleteOfficeCheckPayment = (bookingId: string, paymentId: string) => {
    const updatedBookings = bookings.map((booking) => {
      if (booking.id !== bookingId) return booking;

      return {
        ...booking,
        officePaymentTracker: (booking.officePaymentTracker || []).filter(
          (payment) => payment.id !== paymentId,
        ),
        updatedAt: new Date().toISOString(),
        adminLogs: makeAdminLog(
          booking,
          "DELETE_OFFICE_CHECK_PAYMENT",
          "Admin removed an office check payment record.",
        ),
      };
    });

    saveBookings(updatedBookings);
  };

  return (
    <BookingContext.Provider
      value={{
        bookings,
        officeRentals,
        maintenanceDates,
        addBooking,
        updateBookingStatus,
        cancelBooking,
        deleteBooking,
        getUserBookings,
        requestCancellation,
        approveCancellation,
        declineCancellation,
        rejectCancellation,
        markRefundReady,
        markRefundClaimed,
        markContractSigned,
        issueReceipt,
        verifyCashPayment,
        settleRemainingBalance,
        verifyPayment,
        rejectPayment,
        toggleMaintenanceDate,
        submitPayment,
        verifyOfficeReservationPayment,
        addOfficeCheckPayment,
        updateOfficeCheckPayment,
        deleteOfficeCheckPayment,
        addOfficeRentalRequest,
        getUserOfficeRentals,
        approveOfficeRentalForContractSigning,
        declineOfficeRental,
        markOfficeContractSigned,
        markOfficeAdvanceDepositPaid,
        updateOfficeChequeSubmission,
        activateOfficeLease,
        cancelOfficeRental,
        completeOfficeRental,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const context = useContext(BookingContext);

  if (context === undefined) {
    throw new Error("useBookings must be used within a BookingProvider");
  }

  return context;
}
