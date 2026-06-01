"use client"

import React, { useEffect, useState, useMemo, useRef } from "react"
import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { useRouter } from "next/navigation"
import { useBookings, Booking } from "@/src/modules/client/contexts/booking-context"
import { 
  Building2, Tent, Calendar, Clock, MapPin, Users, AlertCircle, Plus, Receipt, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ArrowLeft, X, DoorOpen, PartyPopper, PlayCircle, PauseCircle, Navigation, Loader2, Star, MessageSquare, Briefcase, FileText
} from "lucide-react"
import { Button } from "@/src/modules/shared/components/ui/button"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/src/modules/shared/components/ui/dialog"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/modules/shared/components/ui/select"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Textarea } from "@/src/modules/shared/components/ui/textarea"
import { Checkbox } from "@/src/modules/shared/components/ui/checkbox"

declare global { interface Window { pannellum: any; } }

// --- PREMIUM FALLBACK 360 IMAGE ---
const PANO_IMG = 'https://pannellum.org/images/alma.jpg'; 

const VENUES = [
  { id: 'v1', name: 'The Milestone Event', capacity: '80–100 pax', price: 15000, type: 'venue', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80', panoImage: PANO_IMG, description: 'Premium space for grand celebrations and corporate events.' },
  { id: 'v2', name: 'The Moment Event', capacity: '30–50 pax', price: 10000, type: 'venue', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80', panoImage: 'https://pannellum.org/images/jura.jpg', description: 'Intimate setting perfect for memorable milestones.' },
  { id: 'v3', name: 'Conference Room', capacity: '4–10 pax', price: 3000, type: 'venue', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', panoImage: 'https://pannellum.org/images/bma-1.jpg', description: 'Professional environment equipped for critical decisions.' },
  { id: 'v4', name: 'Business Room', capacity: '10–15 pax', price: 5000, type: 'venue', image: 'https://images.unsplash.com/photo-1517502884422-41eaadeff171?w=800&q=80', panoImage: 'https://pannellum.org/images/cerro-toco-0.jpg', description: 'Spacious meeting area ideal for collaborations.' }
]

const OFFICE_BUILDINGS = [
  { id: 'office-a', name: 'Office A', capacity: '1-4 pax per room', price: 15000, type: 'office', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80', panoImage: PANO_IMG, description: 'Premium office wing with 8 individual private rooms.' },
  { id: 'office-b', name: 'Office B', capacity: '1-4 pax per room', price: 15000, type: 'office', image: 'https://images.unsplash.com/photo-1541746972996-4e0b0f93e586?w=800&q=80', panoImage: PANO_IMG, description: 'Executive office wing with 8 individual private rooms.' }
]

type StoredVenueReview = {
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

function safeParseVenueReviews(value: string | null): StoredVenueReview[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeReviewValue(value?: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function loadVenueReviews() {
  if (typeof window === "undefined") return []
  return safeParseVenueReviews(window.localStorage.getItem(REVIEW_STORAGE_KEY))
}

function getReviewsForVenue(reviews: StoredVenueReview[], venueName: string) {
  const selectedVenue = normalizeReviewValue(venueName)

  if (!selectedVenue) return []

  return reviews.filter((review) => {
    const reviewVenue = normalizeReviewValue(review.venue)
    const reviewEventName = normalizeReviewValue(review.eventName)

    return (
      reviewVenue === selectedVenue ||
      reviewVenue.includes(selectedVenue) ||
      selectedVenue.includes(reviewVenue) ||
      reviewEventName === selectedVenue ||
      reviewEventName.includes(selectedVenue) ||
      selectedVenue.includes(reviewEventName)
    )
  })
}

function formatReviewDate(date: string) {
  const parsed = new Date(date)

  if (Number.isNaN(parsed.getTime())) return date

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function useVenueReviews(venueName: string) {
  const [reviews, setReviews] = useState<StoredVenueReview[]>([])

  useEffect(() => {
    const refreshReviews = () => {
      setReviews(loadVenueReviews())
    }

    refreshReviews()

    window.addEventListener(REVIEW_EVENT_NAME, refreshReviews)
    window.addEventListener("storage", refreshReviews)

    return () => {
      window.removeEventListener(REVIEW_EVENT_NAME, refreshReviews)
      window.removeEventListener("storage", refreshReviews)
    }
  }, [])

  const venueReviews = useMemo(() => {
    return getReviewsForVenue(reviews, venueName)
  }, [reviews, venueName])

  const averageRating = useMemo(() => {
    if (venueReviews.length === 0) return 0

    return (
      venueReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      venueReviews.length
    )
  }, [venueReviews])

  return { venueReviews, averageRating }
}

function VenueRatingBadge({ venueName }: { venueName: string }) {
  const { venueReviews, averageRating } = useVenueReviews(venueName)

  return (
    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
      <Star className="w-3.5 h-3.5 fill-[#ea580c] text-[#ea580c]" />
      <span className="text-slate-900 text-[10px] font-black tracking-widest">
        {venueReviews.length > 0 ? averageRating.toFixed(1) : "0.0"}
      </span>
      <span className="text-slate-400 text-[9px] font-black tracking-widest">
        ({venueReviews.length})
      </span>
    </div>
  )
}

function VenueReviewsDialog({
  venueName,
  children,
}: {
  venueName: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const { venueReviews, averageRating } = useVenueReviews(venueName)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="w-[95vw] overflow-hidden rounded-2xl border-slate-200 p-0 shadow-xl sm:max-w-lg [&>button]:hidden">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <DialogTitle className="text-xl font-black text-slate-950">
              Venue Reviews
            </DialogTitle>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Reviews for <span className="text-[#ea580c]">{venueName}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="mb-5 flex items-center justify-between rounded-2xl bg-orange-50 p-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ea580c]">
                Average Rating
              </p>

              <p className="mt-1 text-2xl font-black text-orange-700">
                {venueReviews.length > 0 ? averageRating.toFixed(1) : "0.0"}
              </p>

              <p className="mt-1 text-xs font-bold text-orange-500">
                {venueReviews.length} review{venueReviews.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`h-5 w-5 ${
                    value <= Math.round(averageRating)
                      ? "fill-[#ea580c] text-[#ea580c]"
                      : "text-orange-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {venueReviews.length > 0 ? (
            <div className="space-y-3">
              {venueReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-slate-950">
                        {review.customerName || "Customer"}
                      </p>

                      <p className="text-xs font-semibold text-slate-400">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-0.5">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          className={`h-4 w-4 ${
                            value <= Number(review.rating || 0)
                              ? "fill-[#ea580c] text-[#ea580c]"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm font-medium leading-6 text-slate-600">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <MessageSquare className="mx-auto mb-3 h-9 w-9 text-slate-300" />

              <p className="font-black text-slate-600">No reviews yet</p>

              <p className="mt-1 text-sm font-semibold text-slate-400">
                Reviews from completed bookings will appear here.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function BookingConfirmationDialog({
  open,
  payload,
  isOffice,
  isSubmitting,
  onEdit,
  onConfirm,
}: {
  open: boolean
  payload: any | null
  isOffice: boolean
  isSubmitting: boolean
  onEdit: () => void
  onConfirm: () => void
}) {
  if (!payload) return null

  const contractTermLabel = String(payload.contractTerm || payload.rentalTerm || "")
    .replace("6_months", "6 Months")
    .replace("1_year", "1 Year")
    .replace("2_years", "2 Years")

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onEdit()}>
      <DialogContent className="w-[95vw] max-w-lg rounded-[1.5rem] border-slate-200 bg-white p-0 shadow-2xl [&>button]:hidden">
        <div className="border-b border-slate-100 p-5">
          <DialogTitle className="text-2xl font-black text-slate-950">
            Confirm Booking Details
          </DialogTitle>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            Please double-check the selected details before submitting your booking request.
          </p>
        </div>

        <div className="space-y-3 p-5">
          <ConfirmBookingLine label="Full Name" value={payload.userInfo?.name || "Client"} />
          <ConfirmBookingLine label={isOffice ? "Rental Type" : "Event Type"} value={isOffice ? "Office Space Rental" : payload.eventType} />
          <ConfirmBookingLine label="Selected Space" value={payload.venue} />
          <ConfirmBookingLine label="Booking Date" value={payload.date} />
          {isOffice ? (
            <ConfirmBookingLine label="Contract Term" value={contractTermLabel || "N/A"} />
          ) : (
            <ConfirmBookingLine label="Reservation Time" value={payload.time || `${payload.startTime} - ${payload.endTime}`} />
          )}
          <ConfirmBookingLine
            label={isOffice ? "Reservation Amount" : "Total Amount"}
            value={`₱${Number(payload.totalPrice || 0).toLocaleString("en-PH")}`}
          />
          <ConfirmBookingLine
            label="Payment Method"
            value={isOffice ? "Select on payment page - slot reservation only" : "Select on payment page"}
          />
        </div>

        <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            onClick={onEdit}
            disabled={isSubmitting}
            className="h-11 rounded-xl border-slate-200 font-black text-slate-700"
          >
            Go Back / Edit Details
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="h-11 rounded-xl bg-orange-600 font-black text-white hover:bg-orange-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmBookingLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className="max-w-[58%] break-words text-right text-sm font-black text-slate-950">{value || "N/A"}</p>
    </div>
  )
}

function TermsList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li
          key={index}
          className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700"
        >
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ea580c]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}


type StepType = 'category' | 'list' | 'room' | 'schedule' | 'details' | 'success'

interface ReserveDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ReserveDialog({ children, open: controlledOpen, onOpenChange: setControlledOpen }: ReserveDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = setControlledOpen || setInternalOpen

  const { bookings, maintenanceDates, addBooking } = useBookings()
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [step, setStep] = useState<StepType>('category') 
  const [category, setCategory] = useState<'venue' | 'office' | null>(null)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null) 
  
  const minBookableDate = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() + 1);
    return d;
  }, []);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null)

  const [eventName, setEventName] = useState("")
  const [eventType, setEventType] = useState("") 
  const [customEventType, setCustomEventType] = useState("") 
  const [guests, setGuests] = useState<number | "">("")
  const [notes, setNotes] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBookingConfirmOpen, setIsBookingConfirmOpen] = useState(false)
  const [pendingBookingPayload, setPendingBookingPayload] = useState<any | null>(null)
  
  const [isTermsOpen, setIsTermsOpen] = useState(false)

  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [libLoaded, setLibLoaded] = useState(false)
  const [isViewerReady, setIsViewerReady] = useState(false)
  const viewerRef = useRef<any>(null)

  const maxPax = useMemo(() => {
    if (!selectedItem?.capacity) return 100;
    const matches = selectedItem.capacity.match(/\d+/g);
    return matches ? Math.max(...matches.map(Number)) : 100;
  }, [selectedItem]);

  const isOffice = category === 'office';


  const isMaintenanceBlockedForSelectedSpace = (dateKey: string) => {
    if (!dateKey || !maintenanceDates?.length || !selectedItem) return false

    const venueId = String(selectedItem?.id || "").trim()
    const venueName = String(selectedItem?.name || "").trim()
    const selectedRoomName =
      selectedRoom && venueName ? `${venueName} - Room ${selectedRoom}` : ""
    const selectedRoomShortName =
      selectedRoom && venueName ? `${venueName} - Rm ${selectedRoom}` : ""

    const acceptedKeys = new Set(
      [
        dateKey,
        venueId ? `${venueId}|${dateKey}` : "",
        venueName ? `${venueName}|${dateKey}` : "",
        selectedRoomName ? `${selectedRoomName}|${dateKey}` : "",
        selectedRoomShortName ? `${selectedRoomShortName}|${dateKey}` : "",
      ].filter(Boolean),
    )

    return maintenanceDates.some((storedValue) => {
      const stored = String(storedValue || "").trim()
      if (!stored) return false
      if (acceptedKeys.has(stored)) return true

      const [storedVenueKey, storedDateKey] = stored.split("|")
      if (storedDateKey !== dateKey) return false

      return [venueId, venueName, selectedRoomName, selectedRoomShortName]
        .filter(Boolean)
        .some((key) => key === storedVenueKey)
    })
  }

  useEffect(() => {
    if (!isOpen) return;

    if (window.pannellum) {
      setLibLoaded(true);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-pannellum-script="true"]');
    const existingLink = document.querySelector<HTMLLinkElement>('link[data-pannellum-style="true"]');

    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
      link.dataset.pannellumStyle = "true";
      document.head.appendChild(link);
    }

    if (existingScript) {
      if (window.pannellum) setLibLoaded(true);
      else existingScript.addEventListener("load", () => setLibLoaded(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.async = true;
    script.dataset.pannellumScript = "true";
    script.onload = () => setLibLoaded(true);
    script.onerror = () => {
      setLibLoaded(false);
      console.error("Failed to load Pannellum library.");
    };
    document.body.appendChild(script);
  }, [isOpen]);

  const resetState = () => {
    setStep('category'); setCategory(null); setSelectedItem(null); setSelectedRoom(null);
    setSelectedDate(null); setSelectedDuration(null);
    setEventName(""); setEventType(""); setCustomEventType(""); setGuests(""); setNotes(""); setAgreed(false);
    setPendingBookingPayload(null); setIsBookingConfirmOpen(false); setIsSubmitting(false);
    
    const d = new Date();
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    
    if (viewerRef.current) { viewerRef.current.destroy(); viewerRef.current = null; }
  }

  const handleClose = () => { setIsOpen(false); setTimeout(resetState, 300); }
  
  const handleBack = () => {
    if (step === 'list') setStep('category')
    else if (step === 'room') setStep('list')
    else if (step === 'schedule') {
        if (viewerRef.current) { viewerRef.current.destroy(); viewerRef.current = null; }
        setStep(category === 'office' ? 'room' : 'list')
    }
    else if (step === 'details') setStep('schedule')
  }

  useEffect(() => {
    if (step !== 'schedule' || !selectedItem) {
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
      setIsViewerReady(false)
      return
    }

    if (!libLoaded || !window.pannellum) {
      setIsViewerReady(false)
      return
    }

    let readyFallbackTimer: number | null = null
    const initTimer = window.setTimeout(() => {
      const container = document.getElementById("booking-panorama-viewer")
      if (!container) return

      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }

      container.innerHTML = ""
      setIsViewerReady(false)

      const panoramaSource = selectedItem?.panoImage || PANO_IMG

      try {
        const viewer = window.pannellum.viewer('booking-panorama-viewer', {
          type: 'equirectangular',
          panorama: panoramaSource,
          autoLoad: true,
          autoRotate: isAutoRotating ? -2 : 0,
          showControls: false,
          showFullscreenCtrl: false,
          compass: false,
          hfov: 105,
          pitch: 0,
          yaw: 0,
        })

        viewerRef.current = viewer

        const markReady = () => {
          setIsViewerReady(true)

          const controls = container.querySelectorAll(
            '.pnlm-controls-container, .pnlm-fullscreen-toggle-button, .pnlm-zoom-controls, .pnlm-fullscreen-toggle-button'
          )
          controls.forEach((control) => {
            ;(control as HTMLElement).style.display = 'none'
          })

          applyAutoRotate(isAutoRotating)
        }

        if (viewer?.on) {
          viewer.on('load', markReady)
          viewer.on('error', () => setIsViewerReady(true))
        }

        readyFallbackTimer = window.setTimeout(markReady, 1200)
      } catch (e) {
        console.error("Pannellum Error", e)
        setIsViewerReady(true)
      }
    }, 150)

    return () => {
      window.clearTimeout(initTimer)
      if (readyFallbackTimer) window.clearTimeout(readyFallbackTimer)
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [step, selectedItem, libLoaded])

  const applyAutoRotate = (shouldRotate: boolean) => {
    const viewer = viewerRef.current
    if (!viewer) return

    try {
      if (shouldRotate) {
        if (viewer.startAutoRotate) {
          viewer.startAutoRotate(-2, 0)
        }
      } else if (viewer.stopAutoRotate) {
        viewer.stopAutoRotate()
      }
    } catch (error) {
      console.error("Failed to toggle panorama auto-pan", error)
    }
  }

  const toggleAutoRotate = () => {
    setIsAutoRotating((current) => {
      const nextState = !current
      applyAutoRotate(nextState)
      return nextState
    })
  }

  const executeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book.",
        variant: "destructive",
      })
      return
    }

    if (!selectedItem || !selectedDate || !selectedDuration) {
      toast({
        title: "Missing Booking Details",
        description: "Please complete the date and duration/time selection.",
        variant: "destructive",
      })
      return
    }

    if (!eventName.trim()) {
      toast({
        title: "Missing Name",
        description: isOffice
          ? "Please enter the company / tenant name."
          : "Please enter the event name.",
        variant: "destructive",
      })
      return
    }

    if (!eventType || (eventType === "others" && !customEventType.trim())) {
      toast({
        title: "Missing Type",
        description: isOffice
          ? "Please select or specify the nature of business."
          : "Please select or specify the event type.",
        variant: "destructive",
      })
      return
    }

    if (!isOffice && (!guests || Number(guests) < 1)) {
      toast({
        title: "Invalid Guest Count",
        description: "Please enter the expected number of guests.",
        variant: "destructive",
      })
      return
    }

    if (!agreed) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions first.",
        variant: "destructive",
      })
      return
    }

    const selected = new Date(selectedDate)
    selected.setHours(0, 0, 0, 0)

    if (selected < minBookableDate) {
      toast({
        title: "Date Not Allowed",
        description:
          "Bookings must be scheduled at least 1 month from today. Please select an available future date.",
        variant: "destructive",
      })
      return
    }

    if (isMaintenanceBlockedForSelectedSpace(selectedDate)) {
      toast({
        title: "Date Unavailable",
        description: "This selected date is blocked for maintenance.",
        variant: "destructive",
      })
      return
    }

    const rentalTermMap: Record<string, string> = {
      "6 Months": "6_months",
      "1 Year": "1_year",
      "2 Years": "2_years",
    }

    const isOfficeBooking = isOffice
    const rentalTerm = isOfficeBooking
      ? rentalTermMap[selectedDuration] || "6_months"
      : undefined

    const payload = {
      userId: user.id,
      venueId: selectedItem.id,
      venue: selectedRoom
        ? `${selectedItem.name} - Room ${selectedRoom}`
        : selectedItem.name,
      eventName: eventName.trim() || "Space Rental",
      eventType: eventType === "others" ? customEventType.trim() : eventType,
      guestCount: isOfficeBooking ? 1 : Number(guests || 1),
      date: selectedDate,
      time: selectedDuration,
      startTime: isOfficeBooking
        ? ""
        : selectedDuration.includes("-")
          ? selectedDuration.split("-")[0].trim()
          : selectedDuration,
      endTime: isOfficeBooking
        ? ""
        : selectedDuration.includes("-")
          ? selectedDuration.split("-")[1].trim()
          : selectedDuration,
      status: "pending" as any,
      bookingStatus: "Pending Verification" as any,
      isSlotSecured: false,
      paymentStatus: "unpaid" as any,
      paymentType: isOfficeBooking ? ("slot_reservation" as any) : undefined,
      paymentMethod: undefined,
      amountPaid: 0,
      remainingBalance: isOfficeBooking ? 0 : selectedItem.price,
      remainingBalancePaid: false,
      totalPrice: selectedItem.price,
      specialRequests: notes.trim(),
      userInfo: {
        name: user.name || "Client",
        email: user.email || "",
        phone: "0000000000",
      },
      bookingCategory: isOfficeBooking ? "office" : "venue",
      bookingType: isOfficeBooking ? "office" : "venue",
      isOfficeRental: isOfficeBooking,
      officeRentalTerm: rentalTerm,
      rentalTerm,
      contractTerm: rentalTerm,
      contractSigningRequired: true,
      contractSigned: false,
      contractStatus: "Pending" as any,
      requiresOnsiteContractSigning: isOfficeBooking,
      cancellationRequested: false,
      cancellationStatus: "None" as any,
      refundStatus: "Not Applicable" as any,
      officePaymentNote: isOfficeBooking
        ? "This system payment is for slot reservation only. Succeeding office rental payments are settled onsite via check after contract signing."
        : undefined,
      adminLogs: isOfficeBooking
        ? [
            {
              action: "OFFICE_SLOT_RESERVATION_CREATED",
              message:
                "Office rental request created. Client must secure the slot first, then visit onsite for contract signing. Monthly payments will be tracked manually by admin via check.",
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
    }

    setPendingBookingPayload(payload)
    setIsBookingConfirmOpen(true)
  }

  const confirmBookingSubmission = async () => {
    if (!pendingBookingPayload || isSubmitting) return

    try {
      setIsSubmitting(true)

      const newId = await addBooking(pendingBookingPayload as any)

      if (!newId) {
        throw new Error("No booking ID returned.")
      }

      const isOfficeBooking = Boolean(pendingBookingPayload.isOfficeRental)

      toast({
        title: "Booking Saved",
        description: isOfficeBooking
          ? "Proceed to slot reservation payment. Contract signing will be done onsite."
          : "Redirecting to payment page...",
        className: "bg-[#ea580c] text-white border-none",
      })

      setIsBookingConfirmOpen(false)
      setPendingBookingPayload(null)
      setIsOpen(false)

      window.setTimeout(() => {
        router.push(`/portal/payments?bookingId=${newId}`)
      }, 150)
    } catch (error) {
      console.error("Booking submit error:", error)

      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCategory = () => (
    <div className="flex-1 overflow-y-auto p-6 xl:p-8 flex flex-col justify-center bg-slate-50 min-h-0">
      <div className="max-w-4xl xl:max-w-2xl mx-auto w-full pb-[env(safe-area-inset-bottom)]">
        <div className="text-center mb-8 xl:mb-6">
          <h2 className="text-3xl xl:text-2xl font-black text-slate-900 tracking-tight">Select Category</h2>
          <p className="text-slate-500 mt-2 text-sm xl:text-xs">What type of space are you looking for?</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-4">
          <button aria-label="Book Event Venue" onClick={() => { setCategory('venue'); setStep('list') }} className="bg-white border border-slate-200 rounded-[1.5rem] xl:rounded-2xl p-6 xl:p-6 text-left hover:border-[#ea580c] hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-300 outline-none transition-all duration-300 group">
            <div className="w-14 h-14 xl:w-10 xl:h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4 xl:mb-4 text-[#ea580c] group-hover:scale-110 transition-transform"><Tent className="w-7 h-7 xl:w-5 xl:h-5" /></div>
            <h4 className="text-xl xl:text-lg font-black text-slate-900">Event Venues</h4>
            <p className="text-slate-500 mt-2 text-sm xl:text-xs leading-relaxed">Elegant spaces for weddings, birthdays, and corporate gatherings. Hourly rentals.</p>
          </button>
          <button aria-label="Book Office Space" onClick={() => { setCategory('office'); setStep('list') }} className="bg-white border border-slate-200 rounded-[1.5rem] xl:rounded-2xl p-6 xl:p-6 text-left hover:border-[#ea580c] hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-300 outline-none transition-all duration-300 group">
            <div className="w-14 h-14 xl:w-10 xl:h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4 xl:mb-4 text-[#ea580c] group-hover:scale-110 transition-transform"><Building2 className="w-7 h-7 xl:w-5 xl:h-5" /></div>
            <h4 className="text-xl xl:text-lg font-black text-slate-900">Office Spaces</h4>
            <p className="text-slate-500 mt-2 text-sm xl:text-xs leading-relaxed">Private fully-furnished rooms for your business and team operations. Contract rentals.</p>
          </button>
        </div>
      </div>
    </div>
  )

  const renderList = () => {
    const items = category === 'venue' ? VENUES : OFFICE_BUILDINGS
    return (
      <div className="flex-1 overflow-y-auto p-6 xl:p-8 bg-slate-50 min-h-0">
        <div className="max-w-4xl xl:max-w-4xl mx-auto w-full pb-[env(safe-area-inset-bottom)] mt-6 md:mt-0">
          <div className="mb-6 xl:mb-6 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl xl:text-xl font-black text-slate-900 tracking-tight">{category === 'venue' ? 'Our Venues' : 'Office Wings'}</h2>
            <p className="text-slate-500 mt-1.5 xl:mt-1 text-sm xl:text-xs">Select a space to view its availability and 360 preview.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-[1.5rem] xl:rounded-[1rem] overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 group flex flex-col">
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 min-h-0 cursor-pointer focus-within:ring-2 focus-within:ring-orange-300 outline-none" onClick={() => { setSelectedItem(item); setStep(category === 'office' ? 'room' : 'schedule') }}>
                  <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  
                  <VenueRatingBadge venueName={item.name} />

                  <div className="absolute bottom-4 left-5 right-5 xl:bottom-4 xl:left-5"><h4 className="font-black text-white text-xl lg:text-lg leading-tight mb-1">{item.name}</h4><p className="text-white/80 text-xs xl:text-[10px] line-clamp-1">{item.description}</p></div>
                </div>
                
                <div className="p-5 flex flex-col gap-4 bg-white shrink-0">
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">{category === 'venue' ? 'Starting at' : 'Per Month'}</p>
                          <p className="text-lg md:text-xl font-black text-[#ea580c]">₱{item.price.toLocaleString()}</p>
                      </div>
                      
                      <VenueReviewsDialog venueName={item.name}>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 underline underline-offset-4 transition-colors hover:text-[#ea580c]"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            View Reviews
                          </button>
                      </VenueReviewsDialog>
                  </div>
                  
                  <Button aria-label={`Select ${item.name}`} onClick={() => { setSelectedItem(item); setStep(category === 'office' ? 'room' : 'schedule') }} className="w-full rounded-full bg-slate-900 hover:bg-[#ea580c] text-white font-bold h-11 text-sm transition-colors shadow-sm">
                      Select {category === 'venue' ? 'Venue' : 'Office'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderRoomSelect = () => (
    <div className="flex-1 overflow-y-auto p-6 xl:p-8 flex flex-col justify-center bg-slate-50 min-h-0">
      <div className="max-w-3xl xl:max-w-3xl mx-auto w-full text-center pb-[env(safe-area-inset-bottom)]">
        <div className="w-16 h-16 xl:w-12 xl:h-12 bg-orange-50 text-[#ea580c] rounded-full flex items-center justify-center mx-auto mb-6 xl:mb-4"><DoorOpen className="w-8 h-8 xl:w-6 xl:h-6" /></div>
        <h2 className="text-2xl md:text-3xl xl:text-2xl font-black text-slate-900 tracking-tight mb-3 xl:mb-2">{selectedItem?.name} Rooms</h2>
        <p className="text-slate-500 mb-8 xl:mb-6 text-sm xl:text-xs max-w-xl mx-auto">Choose an available private room in this wing. All rooms share the same layout and premium amenities.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-4">
          {Array.from({ length: 8 }, (_, i) => i + 1).map((roomNum) => {
            const isBooked = roomNum === 2 || roomNum === 5;
            return (
              <button aria-label={`Select Room ${roomNum}`} key={roomNum} disabled={isBooked} onClick={() => { setSelectedRoom(roomNum); setStep('schedule') }}
                className={`p-6 xl:p-6 rounded-[1.5rem] xl:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 min-h-[120px] xl:min-h-[100px] focus-visible:ring-2 focus-visible:ring-orange-300 outline-none ${isBooked ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50 border-slate-200' : 'bg-white hover:border-[#ea580c] hover:shadow-md border-slate-100 shadow-sm'}`}>
                <div className="text-3xl xl:text-2xl font-black text-slate-900">0{roomNum}</div>
                <div className={`text-[10px] xl:text-[9px] font-bold uppercase tracking-widest ${isBooked ? 'text-rose-500' : 'text-emerald-500'}`}>{isBooked ? 'Booked' : 'Available'}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  const renderSchedule = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const emptySlots = Array.from({ length: firstDay }).map((_, i) => null);
    const days = Array.from({ length: daysInMonth }).map((_, i) => i + 1);

    const displayName = selectedRoom ? `${selectedItem?.name} - Rm ${selectedRoom}` : selectedItem?.name

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
    ];

    const getParsedTime = (timeStr: string) => venueSlots.find(s => s.label === timeStr);

    const existingBookings = bookings.filter(b => 
        b.date === selectedDate && 
        b.venueId === selectedItem?.id && 
        (!selectedRoom || b.venue.includes(`Room ${selectedRoom}`)) &&
        b.status !== 'cancelled' && 
        b.status !== 'declined'
    );

    // ✨ FIX: 1 HOUR BUFFER LOGIC APPLIED ✨
    const availableVenueSlots = venueSlots.filter(slot => {
        return !existingBookings.some(b => {
            if (!b.time) return false;
            const bParsed = getParsedTime(b.time);
            if (!bParsed) return false; 
            return slot.start <= bParsed.end && slot.end >= bParsed.start;
        });
    });

    return (
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden bg-white min-h-0 w-full h-full">
        
        {/* HERO: 360 VIEWER */}
        <div className="w-full lg:w-[44%] 2xl:w-[45%] h-[34vh] sm:h-[40vh] lg:h-full bg-black shrink-0 relative shadow-md z-20 overflow-hidden">
          <div id="booking-panorama-viewer" className="h-full w-full touch-pan-x bg-black [&_.pnlm-controls-container]:hidden [&_.pnlm-fullscreen-toggle-button]:hidden [&_.pnlm-zoom-controls]:hidden"></div>
          {(!libLoaded || !isViewerReady) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 gap-3">
              <Loader2 className="w-6 h-6 text-[#ea580c] animate-spin" />
              <p className="text-white text-[10px] font-black tracking-widest uppercase">Loading 360° Panorama...</p>
            </div>
          )}
          
          <div className="hidden">
            {/* top buttons handled by modal controls */}
            <button aria-label="Go Back" onClick={handleBack} className="w-10 h-10 flex lg:hidden items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-colors border border-white/10 pointer-events-auto shadow-sm"><ArrowLeft className="w-4 h-4" /></button>
            <button aria-label="Close" onClick={handleClose} className="w-10 h-10 flex lg:hidden items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md hover:bg-white/40 transition-colors border border-white/10 pointer-events-auto shadow-sm"><X className="w-4 h-4" /></button>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/50 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-sm pointer-events-auto">
            <button
              type="button"
              aria-label={isAutoRotating ? "Pause panorama auto-pan" : "Play panorama auto-pan"}
              title={isAutoRotating ? "Pause panorama auto-pan" : "Play panorama auto-pan"}
              onClick={toggleAutoRotate}
              className={`min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full transition-colors ${isAutoRotating ? 'bg-[#ea580c] text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
               {isAutoRotating ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-white/20"></div>
            <div className="flex items-center px-2 text-white/90 text-[10px] font-bold uppercase tracking-widest gap-1.5">
               <Navigation className="w-3 h-3 animate-pulse" /> Pan around
            </div>
          </div>
        </div>

        {/* CONTENT: DETAILS SIDE */}
        <div className="flex-1 lg:w-[56%] 2xl:w-[55%] flex flex-col h-full relative min-w-0 bg-white overflow-hidden pt-5 lg:pt-6 xl:pt-7">
          
          <div className="flex-1 flex flex-col min-h-0 px-4 sm:px-6 lg:px-6 2xl:px-8 pb-3 xl:pb-2 overflow-y-auto xl:overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            <div className="shrink-0 mb-3 xl:mb-4 text-center lg:text-left mt-2 lg:mt-0">
                <h2 className="text-xl lg:text-2xl 2xl:text-[1.7rem] font-black text-slate-900 tracking-tight mb-0.5 leading-tight">{displayName}</h2>
                <p className="text-[#ea580c] font-black text-lg lg:text-xl leading-tight">₱{selectedItem?.price.toLocaleString()} <span className="text-slate-400 font-bold text-[9px] tracking-widest uppercase">/ {category === 'venue' ? 'Per 6 Hrs' : 'Per Month'}</span></p>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(270px,320px)_minmax(220px,1fr)] gap-3 2xl:gap-4 w-full pb-3 xl:pb-0 items-start">
                    
                    {/* Calendar Column */}
                    <div className="mx-auto w-full max-w-[360px] xl:max-w-none">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                            <h3 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-900">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[9px] text-white shadow-sm">1</span>
                                Select Date
                            </h3>
                            <span className="hidden rounded-full bg-orange-50 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-orange-600 sm:inline-flex">
                                contract term
                            </span>
                        </div>

                        <div className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-2.5 py-2">
                                <button
                                  type="button"
                                  aria-label="Previous month"
                                  onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </button>

                                <div className="text-center">
                                  <h5 className="text-[13px] font-black leading-none text-slate-950 md:text-sm">
                                    {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                  </h5>
                                  <p className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-slate-400">
                                    Choose an available day
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  aria-label="Next month"
                                  onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="p-2.5 xl:p-2.5">
                                <div className="mb-1.5 grid grid-cols-7 text-center">
                                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayLabel) => (
                                    <div
                                      key={dayLabel}
                                      className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-400"
                                    >
                                      {dayLabel}
                                    </div>
                                  ))}
                                </div>

                                <div className="grid grid-cols-7 justify-items-center gap-0.5">
                                    {emptySlots.map((_, i) => <div key={`empty-${i}`} className="h-7 w-7 2xl:h-8 2xl:w-8" />)}

                                    {days.map(day => {
                                        const iterDate = new Date(year, month, day);
                                        const iterDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const isSelected = selectedDate === iterDateStr;
                                        const isBeforeAllowedWindow = iterDate < minBookableDate;
                                        const isMaintenance = isMaintenanceBlockedForSelectedSpace(iterDateStr);

                                        let statusClass = "border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700";
                                        let isDisabled = false;
                                        let dayTitle = "Available";

                                        if (isBeforeAllowedWindow) {
                                            statusClass = "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300 opacity-60";
                                            isDisabled = true;
                                            dayTitle = "Unavailable: booking must be at least 1 month from today";
                                        } else if (isMaintenance) {
                                            statusClass = "cursor-not-allowed border-slate-900 bg-slate-900 text-slate-400";
                                            isDisabled = true;
                                            dayTitle = "Maintenance day";
                                        } else {
                                            const dayBookings = bookings.filter(b =>
                                                b.date === iterDateStr &&
                                                b.venueId === selectedItem?.id &&
                                                (!selectedRoom || b.venue.includes(`Room ${selectedRoom}`)) &&
                                                b.status !== 'cancelled' &&
                                                b.status !== 'declined'
                                            );

                                            const available = venueSlots.filter(slot => {
                                                return !dayBookings.some(b => {
                                                    if (!b.time) return false;
                                                    const bParsed = getParsedTime(b.time);
                                                    if (!bParsed) return false;
                                                    return slot.start <= bParsed.end && slot.end >= bParsed.start;
                                                });
                                            });

                                            if (available.length === 0) {
                                                statusClass = "cursor-not-allowed border-rose-100 bg-rose-50 text-rose-300";
                                                isDisabled = true;
                                                dayTitle = "Fully booked";
                                            } else if (available.length < venueSlots.length) {
                                                statusClass = "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100";
                                                dayTitle = "Few slots left";
                                            }
                                        }

                                        if (isSelected && !isDisabled) {
                                            statusClass = "border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-200 scale-105";
                                            dayTitle = "Selected date";
                                        }

                                        return (
                                          <button
                                            aria-label={`Select ${iterDateStr}`}
                                            title={dayTitle}
                                            key={day}
                                            disabled={isDisabled}
                                            onClick={() => {
                                              setSelectedDate(iterDateStr);
                                              setSelectedDuration(null);
                                            }}
                                            className={`flex h-7 w-7 2xl:h-8 2xl:w-8 items-center justify-center rounded-full border text-[10px] xl:text-[11px] font-black outline-none transition-all focus-visible:ring-2 focus-visible:ring-orange-300 ${statusClass}`}
                                          >
                                            {day}
                                          </button>
                                        )
                                    })}
                                </div>

                                <div className="mt-2 grid grid-cols-3 gap-1 border-t border-slate-100 pt-2">
                                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-rose-500">
                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-200" /> Full
                                  </div>
                                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-amber-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Few
                                  </div>
                                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-slate-500">
                                    <span className="h-1.5 w-1.5 rounded-full bg-slate-900" /> Maint.
                                  </div>
                                </div>

                                <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50 px-2.5 py-2">
                                  <p className="text-[8px] font-black uppercase tracking-[0.12em] text-orange-700">
                                    Earliest bookable date
                                  </p>
                                  <p className="mt-0.5 text-[10px] font-bold leading-3 text-orange-900">
                                    {minBookableDate.toLocaleDateString('en-PH', {
                                      month: 'long',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                    . Gray dates are not available for booking.
                                  </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Time Column */}
                    <div className="mx-auto w-full max-w-[360px] xl:max-w-none">
                        <h3 className="text-[10px] font-black text-slate-900 tracking-widest uppercase mb-2 flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px]">2</div> Select {category === 'venue' ? 'Time' : 'Duration'}
                        </h3>
                        {!selectedDate ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[1rem] h-[72px] xl:min-h-[250px] 2xl:min-h-[275px] flex items-center justify-center text-slate-400 font-bold text-[9px] uppercase tracking-wider p-2 text-center">Select a date first</div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in xl:rounded-[1rem] xl:border xl:border-slate-200 xl:bg-white xl:p-3 xl:shadow-sm">
                                {category === 'venue' ? (
                                    <div className="flex flex-col gap-2">
                                        <Select value={selectedDuration || ""} onValueChange={setSelectedDuration}>
                                            <SelectTrigger className="w-full h-10 md:h-11 rounded-lg bg-white border-2 border-slate-200 px-3 font-bold text-xs text-slate-700 focus-visible:ring-2 focus-visible:ring-[#ea580c] transition-all data-[state=open]:border-[#ea580c]">
                                                <SelectValue placeholder="Select Start Time" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[150px] md:max-h-[180px]">
                                                {availableVenueSlots.length > 0 ? (
                                                    availableVenueSlots.map(slot => (
                                                        <SelectItem key={slot.label} value={slot.label} className="font-bold text-xs text-slate-700 py-2 cursor-pointer focus:bg-orange-50 focus:text-[#ea580c]">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3 h-3 text-[#ea580c]" />
                                                                {slot.startTimeLabel}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-[9px] font-bold text-slate-400 bg-slate-50 m-1 rounded-md">
                                                        🚫 Fully Booked for this date
                                                    </div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        
                                        {selectedDuration && availableVenueSlots.some(s => s.label === selectedDuration) && (
                                            <div className="p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-start gap-2 animate-in fade-in">
                                                <CheckCircle2 className="w-4 h-4 text-[#ea580c] shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[8px] font-bold text-orange-900 uppercase tracking-widest leading-relaxed">
                                                        6-Hour Slot Confirmed
                                                    </p>
                                                    <p className="text-[10px] font-black text-[#ea580c]">
                                                        {selectedDuration}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    ['6 Months', '1 Year', '2 Years'].map((slot) => (
                                    <button key={slot} onClick={() => setSelectedDuration(slot)} className={`w-full flex items-center justify-between p-3 min-h-[44px] rounded-lg border-2 transition-all focus-visible:ring-2 focus-visible:ring-orange-200 outline-none ${selectedDuration === slot ? 'border-[#ea580c] bg-orange-50 shadow-sm ring-2 ring-orange-50' : 'border-slate-100 bg-white hover:border-[#ea580c]'}`}>
                                        <div className="flex items-center gap-2">
                                            <MapPin className={`w-4 h-4 ${selectedDuration === slot ? 'text-[#ea580c]' : 'text-slate-400'}`} />
                                            <span className={`font-bold text-xs ${selectedDuration === slot ? 'text-orange-900' : 'text-slate-700'}`}>{slot}</span>
                                        </div>
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedDuration === slot ? 'border-[#ea580c] bg-[#ea580c]' : 'border-slate-200'}`}>
                                            {selectedDuration === slot && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                    </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>

          <div className="shrink-0 pt-2 flex justify-center lg:justify-end mt-auto pb-3 px-4 sm:px-6 lg:px-6 2xl:px-8 bg-white border-t border-slate-100">
            <Button disabled={!selectedDate || !selectedDuration} onClick={() => setStep('details')} className="w-full max-w-sm lg:max-w-[385px] bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-full h-10 font-bold text-xs md:text-sm transition-transform active:scale-95 disabled:opacity-50">
               Proceed to Details
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderDetails = () => {
    const isFormValid = isOffice 
        ? (eventName && eventType && (eventType !== 'others' || customEventType) && agreed && !isSubmitting)
        : (eventName && eventType && (eventType !== 'others' || customEventType) && guests && agreed && !isSubmitting);

    return (
      <div className="flex-1 flex flex-col bg-white justify-center px-4 md:px-6 py-6 pt-16 md:pt-6 relative h-full">
        
        <div className="max-w-[400px] mx-auto w-full flex flex-col justify-center h-full pb-4">
          
          <div className="shrink-0 mb-5 text-center">
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Final Details</h2>
            <p className="text-slate-500 mt-1 text-[11px] md:text-xs">Complete your {isOffice ? 'tenant' : 'event'} information to finalize your request.</p>
          </div>

          <form onSubmit={executeSubmit} className="flex flex-col gap-4">
            <h3 className="shrink-0 text-xs font-black text-slate-900 mb-1 flex items-center gap-2">
              {isOffice ? <Briefcase className="w-4 h-4 text-[#ea580c]" /> : <PartyPopper className="w-4 h-4 text-[#ea580c]" />} 
              {isOffice ? 'Company / Tenant Information' : 'Event Information'}
            </h3>
            
            <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                    {isOffice ? 'Company / Tenant Name *' : 'Event Name *'}
                </label>
                <Input required value={eventName} onChange={e => setEventName(e.target.value)} placeholder={isOffice ? "e.g. Acme Corp / Juan Dela Cruz" : "e.g. 18th Birthday Party"} className="h-10 rounded-xl bg-slate-50 border-slate-200 px-3 text-xs focus-visible:ring-2 focus-visible:ring-[#ea580c]" />
            </div>

            {isOffice ? (
                <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                        Nature of Business *
                    </label>
                    <Select value={eventType} onValueChange={setEventType} required>
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 px-3 text-xs focus:ring-2 focus:ring-[#ea580c]"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[200px]">
                            <SelectItem value="tech">Tech / IT</SelectItem>
                            <SelectItem value="freelance">Freelance / Consultant</SelectItem>
                            <SelectItem value="agency">Creative Agency</SelectItem>
                            <SelectItem value="corporate">Corporate Branch</SelectItem>
                            <SelectItem value="others">Others</SelectItem>
                        </SelectContent>
                    </Select>
                    {eventType === 'others' && (
                        <div className="mt-2 animate-in slide-in-from-top-1">
                            <Input required value={customEventType} onChange={e => setCustomEventType(e.target.value)} placeholder="Please specify business nature..." className="h-10 rounded-xl bg-slate-50 border-slate-200 px-3 text-xs focus-visible:ring-2 focus-visible:ring-[#ea580c]" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                            Event Type *
                        </label>
                        <Select value={eventType} onValueChange={setEventType} required>
                            <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200 px-3 text-xs focus:ring-2 focus:ring-[#ea580c]"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 shadow-xl max-h-[200px]">
                                <SelectItem value="wedding">Wedding</SelectItem>
                                <SelectItem value="birthday">Birthday</SelectItem>
                                <SelectItem value="corporate">Corporate</SelectItem>
                                <SelectItem value="rental">Space Rental</SelectItem>
                                <SelectItem value="others">Others</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                            Expected Guests *
                        </label>
                        <Input 
                            required 
                            type="number" 
                            min={1}
                            max={maxPax}
                            value={guests} 
                            onChange={e => {
                            let val = parseInt(e.target.value);
                            if (val > maxPax) val = maxPax; 
                            if (val < 1) val = 1;
                            setGuests(val || "");
                            }} 
                            placeholder={`Up to ${maxPax} pax`} 
                            className="h-10 rounded-xl bg-slate-50 border-slate-200 px-3 text-xs focus-visible:ring-2 focus-visible:ring-[#ea580c]" 
                        />
                    </div>

                    {eventType === 'others' && (
                        <div className="col-span-2 mt-0.5 animate-in slide-in-from-top-1">
                            <Input required value={customEventType} onChange={e => setCustomEventType(e.target.value)} placeholder="Please specify event type..." className="h-10 rounded-xl bg-slate-50 border-slate-200 px-3 text-xs focus-visible:ring-2 focus-visible:ring-[#ea580c]" />
                        </div>
                    )}
                </div>
            )}

            <div className="shrink-0 pt-4 mt-2 border-t border-slate-100">
              <div className="flex items-start space-x-3 mb-5">
                <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c as boolean)} className="mt-0.5 w-4 h-4 rounded-md data-[state=checked]:bg-[#ea580c] data-[state=checked]:border-[#ea580c]" />
                <Label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed cursor-pointer">
                    I agree to the{" "}
                    <span 
                        onClick={(e) => { e.preventDefault(); setIsTermsOpen(true); }}
                        className="font-bold text-[#ea580c] hover:underline cursor-pointer"
                    >
                        Terms & Conditions
                    </span>.
                </Label>
              </div>

              <Button disabled={!isFormValid} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-full h-11 font-bold text-sm shadow-sm active:scale-95 transition-all disabled:opacity-50">
                 {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/> Processing...</> : "Submit Reservation Request"}
              </Button>
            </div>
          </form>
        </div>

        <Dialog open={isTermsOpen} onOpenChange={setIsTermsOpen}>
          <DialogContent className="w-[92vw] overflow-hidden rounded-[2rem] border-0 bg-white p-0 shadow-2xl sm:max-w-2xl [&>button]:hidden">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 md:px-8">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-900">
                  <FileText className="h-5 w-5 text-[#ea580c]" />
                  Terms & Conditions
                </DialogTitle>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Please read carefully before proceeding with your reservation.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-6 py-5 md:px-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {isOffice ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">
                      Office Space Rental Terms and Conditions
                    </h3>
                  </div>

                  <TermsList
                    items={[
                      "Reservation payments are strictly for securing office space slots only.",
                      "Remaining balances, post-dated checks, and contract agreements shall be settled onsite.",
                      "Office rentals require mandatory onsite contract signing before occupancy.",
                      "One month advance payment and two months deposit are required upon contract signing.",
                      "Payment for office rentals shall be settled through post-dated checks based on the agreed contract duration.",
                      "Reservation approval is subject to successful payment verification and admin confirmation.",
                      "Office tenants are responsible for maintaining cleanliness, order, and proper use of the rented office space.",
                      "Any damages caused within the rented office space shall be shouldered by the tenant.",
                      "Subleasing or unauthorized sharing of office spaces is strictly prohibited unless approved by management.",
                      "Management reserves the right to terminate office rental agreements for policy violations, non-payment, or misconduct.",
                      "Tenants must comply with all building rules, operational policies, and business regulations implemented by One Estela Place.",
                      "By proceeding with the reservation, the customer agrees to follow all office rental policies, payment terms, and contract requirements established by One Estela Place.",
                    ]}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-orange-700">
                      Event Venue Terms and Conditions
                    </h3>
                  </div>

                  <TermsList
                    items={[
                      "Reservation slots are only secured upon successful payment verification and admin approval.",
                      "Temporary reservations that remain unpaid within 24 hours may automatically expire.",
                      "Event reservations are limited to the selected schedule only.",
                      "Customers are responsible for arriving and vacating the venue within their reserved time period.",
                      "Cancellation requests made 14 days before the event date may be eligible for a refund.",
                      "Cancellations made within 7 days before the scheduled event date are non-refundable.",
                      "Remaining balances must be fully settled at least 7 days before the event date.",
                      "Refunds approved by the administrator may be claimed onsite after 7 days.",
                      "Customers are responsible for any damages, loss, or misconduct that may occur during the event.",
                      "The venue management reserves the right to decline or cancel reservations that violate venue policies and regulations.",
                      "Outside illegal activities, hazardous materials, and prohibited substances are strictly not allowed inside the venue premises.",
                      "By proceeding with the reservation, the customer agrees to follow all venue rules, regulations, and payment policies established by One Estela Place.",
                    ]}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-white px-6 py-4 md:px-8">
              <Button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="h-11 w-full rounded-full bg-slate-900 font-bold text-white shadow-sm transition hover:bg-[#ea580c] active:scale-95"
              >
                I Understand
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setTimeout(resetState, 300); }}>
      <DialogTrigger asChild>{children || <Button className="bg-[#ea580c] text-white">Book Now</Button>}</DialogTrigger>
      
      <DialogContent className="!flex !flex-col !gap-0 !p-0 !max-w-[100vw] sm:!max-w-[96vw] xl:!max-w-[1320px] 2xl:!max-w-[1400px] w-full h-[100dvh] md:h-[calc(100vh-32px)] md:max-h-[760px] overflow-hidden bg-white rounded-none sm:rounded-[2rem] border-0 focus:outline-none [&>button]:hidden shadow-2xl transition-all duration-300 ease-in-out">
        
        <DialogTitle className="hidden">Reservation Modal</DialogTitle>

        {step !== 'success' && (
            <>
                {step !== 'category' && (
                    <div className="absolute top-5 left-5 z-50">
                        <button aria-label="Go Back" onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200 shadow-sm"><ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /></button>
                    </div>
                )}
                <div className="absolute top-5 right-5 z-50">
                    <button aria-label="Close" onClick={handleClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors border border-slate-200 shadow-sm"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
            </>
        )}

        <div className="flex-1 relative overflow-x-hidden bg-white flex flex-col min-w-0 w-full">
          {step === 'category' && renderCategory()}
          {step === 'list' && renderList()}
          {step === 'room' && renderRoomSelect()}
          {step === 'schedule' && renderSchedule()}
          {step === 'details' && renderDetails()}
        </div>
      </DialogContent>
    </Dialog>

    <BookingConfirmationDialog
      open={isBookingConfirmOpen}
      payload={pendingBookingPayload}
      isOffice={isOffice}
      isSubmitting={isSubmitting}
      onEdit={() => setIsBookingConfirmOpen(false)}
      onConfirm={confirmBookingSubmission}
    />
    </>
  )
}
