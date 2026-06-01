"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useToast } from "@/src/modules/shared/hooks/use-toast"

export type PastEvent = {
  id: string
  title: string
  clientName?: string
  description: string
  eventDate: string
  venueName: string
  image: string
  isFeatured?: boolean
  hasClientConsent?: boolean
  createdAt: string
  updatedAt?: string
}

export interface CMSData {
  homepage: {
    heroTitle: string
    heroSubtitle: string
    heroImage: string
  }
  footer: {
    email: string
    phone: string
    address: string
    facebook: string
  }
  venues: any[]
  offices: any[]
  faqs: any[]
  pastEvents: PastEvent[]
}

type CMSContextType = {
  cmsData: CMSData
  updateHomepage: (data: Partial<CMSData["homepage"]>) => void
  updateFooter: (data: Partial<CMSData["footer"]>) => void

  updateVenue: (id: string, data: any) => void
  updateOffice: (id: string, data: any) => void
  addVenue: (data: any) => void
  deleteVenue: (id: string) => void
  addOffice: (data: any) => void
  deleteOffice: (id: string) => void

  addPastEvent: (data: Omit<PastEvent, "id" | "createdAt" | "updatedAt">) => void
  updatePastEvent: (id: string, data: Partial<PastEvent>) => void
  deletePastEvent: (id: string) => void

  saveCMSData: (newData: CMSData) => void
}

const CMS_STORAGE_KEY = "oneestela_cms_data"
const CMS_UPDATED_EVENT = "oneestela_cms_updated"

const DEFAULT_FAQS = [
  {
    id: "faq-1",
    question: "How long is the standard venue rental?",
    answer:
      "The standard venue rental is 6 hours. Setup, program, and cleanup should fit within the approved booking schedule.",
  },
  {
    id: "faq-2",
    question: "What is included in the venue rental?",
    answer:
      "One Estela Place focuses on venue space rental only. Clients may arrange their own decorations, catering, suppliers, and event services.",
  },
  {
    id: "faq-3",
    question: "Do you provide catering services?",
    answer:
      "No. Catering is not included. Clients may bring or coordinate with their preferred caterer based on venue guidelines.",
  },
  {
    id: "faq-4",
    question: "Can I visit the venue before booking?",
    answer:
      "Yes. Clients may schedule an ocular visit before finalizing their reservation.",
  },
  {
    id: "faq-5",
    question: "How does booking confirmation work?",
    answer:
      "A booking request will be reviewed first. Once approved and payment requirements are verified, the booking may be marked as confirmed.",
  },
]

const defaultCMSData: CMSData = {
  homepage: {
    heroTitle: "Welcome to \nOne Estela Place",
    heroSubtitle:
      "The perfect venue for your special events, corporate gatherings, and everyday workspace needs.",
    heroImage: "/images/venue-interior.jpg",
  },
  footer: {
    email: "inquiries@oneestelaplace.com",
    phone: "+63 917 123 4567",
    address: "Carmona, Calabarzon, Philippines",
    facebook: "https://facebook.com/oneestelaplace",
  },
  venues: [
    {
      id: "v1",
      name: "The Milestone Event",
      capacity: "80–100 pax",
      price: 15000,
      type: "venue",
      image: "/images/venue-chandelier.png",
      panoImage: "https://pannellum.org/images/alma.jpg",
      description: "Premium space for grand celebrations and corporate events.",
    },
    {
      id: "v2",
      name: "The Moment Event",
      capacity: "30–50 pax",
      price: 10000,
      type: "venue",
      image: "/images/venue-interior.jpg",
      panoImage: "https://pannellum.org/images/jura.jpg",
      description: "Intimate setting perfect for memorable milestones.",
    },
    {
      id: "v3",
      name: "Conference Room",
      capacity: "4–10 pax",
      price: 3000,
      type: "venue",
      image: "/images/venue-interior.jpg",
      panoImage: "https://pannellum.org/images/bma-1.jpg",
      description: "Professional environment equipped for critical decisions.",
    },
    {
      id: "v4",
      name: "Business Room",
      capacity: "10–15 pax",
      price: 5000,
      type: "venue",
      image: "/images/venue-interior.jpg",
      panoImage: "https://pannellum.org/images/cerro-toco-0.jpg",
      description: "Spacious meeting area ideal for collaborations.",
    },
  ],
  offices: [
    {
      id: "office-a",
      name: "Office A",
      capacity: "1-4 pax per room",
      price: 15000,
      type: "office",
      image: "/images/venue-interior.jpg",
      panoImage: "https://pannellum.org/images/alma.jpg",
      description: "Premium office wing with 8 individual private rooms.",
    },
    {
      id: "office-b",
      name: "Office B",
      capacity: "1-4 pax per room",
      price: 15000,
      type: "office",
      image: "/images/venue-interior.jpg",
      panoImage: "https://pannellum.org/images/jura.jpg",
      description: "Executive office wing with 8 individual private rooms.",
    },
  ],
  faqs: DEFAULT_FAQS,
  pastEvents: [],
}

const CMSContext = createContext<CMSContextType>({
  cmsData: defaultCMSData,
  updateHomepage: () => {},
  updateFooter: () => {},

  updateVenue: () => {},
  updateOffice: () => {},
  addVenue: () => {},
  deleteVenue: () => {},
  addOffice: () => {},
  deleteOffice: () => {},

  addPastEvent: () => {},
  updatePastEvent: () => {},
  deletePastEvent: () => {},

  saveCMSData: () => {},
})

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizePastEvent(event: any): PastEvent {
  return {
    id: event?.id || createLocalId("past-client-booking"),
    title: event?.title || "",
    clientName: event?.clientName || "",
    description: event?.description || "",
    eventDate: event?.eventDate || "",
    venueName: event?.venueName || "One Estela Place",
    image: event?.image || "/placeholder.jpg",
    isFeatured: event?.isFeatured ?? true,
    hasClientConsent: event?.hasClientConsent === true,
    createdAt: event?.createdAt || new Date().toISOString(),
    updatedAt: event?.updatedAt,
  }
}

function normalizeCMSData(parsed: Partial<CMSData> | null): CMSData {
  if (!parsed) return defaultCMSData

  const parsedFaqs = Array.isArray(parsed.faqs) ? parsed.faqs : []

  const mergedFaqs =
    parsedFaqs.length >= DEFAULT_FAQS.length
      ? parsedFaqs
      : [
          ...parsedFaqs,
          ...DEFAULT_FAQS.filter(
            (defaultFaq) =>
              !parsedFaqs.some(
                (faq: any) =>
                  faq.id === defaultFaq.id ||
                  faq.question?.trim()?.toLowerCase() ===
                    defaultFaq.question.trim().toLowerCase()
              )
          ),
        ]

  return {
    ...defaultCMSData,
    ...parsed,
    homepage: {
      ...defaultCMSData.homepage,
      ...(parsed.homepage || {}),
    },
    footer: {
      ...defaultCMSData.footer,
      ...(parsed.footer || {}),
    },
    venues: Array.isArray(parsed.venues) ? parsed.venues : defaultCMSData.venues,
    offices: Array.isArray(parsed.offices) ? parsed.offices : defaultCMSData.offices,
    faqs: mergedFaqs,
    pastEvents: Array.isArray(parsed.pastEvents)
      ? parsed.pastEvents.map(normalizePastEvent)
      : defaultCMSData.pastEvents,
  }
}

export const CMSProvider = ({ children }: { children: React.ReactNode }) => {
  const [cmsData, setCmsData] = useState<CMSData>(defaultCMSData)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window === "undefined") return

    const loadCMSData = () => {
      const stored = localStorage.getItem(CMS_STORAGE_KEY)

      if (!stored) {
        setCmsData(defaultCMSData)
        return
      }

      try {
        const parsed = JSON.parse(stored)
        setCmsData(normalizeCMSData(parsed))
      } catch (error) {
        console.error(error)
        setCmsData(defaultCMSData)
      }
    }

    loadCMSData()

    window.addEventListener("storage", loadCMSData)
    window.addEventListener(CMS_UPDATED_EVENT, loadCMSData)

    return () => {
      window.removeEventListener("storage", loadCMSData)
      window.removeEventListener(CMS_UPDATED_EVENT, loadCMSData)
    }
  }, [])

  const saveCMSData = (newData: CMSData) => {
    const normalizedData = normalizeCMSData(newData)

    setCmsData(normalizedData)

    if (typeof window !== "undefined") {
      localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(normalizedData))
      window.dispatchEvent(new Event(CMS_UPDATED_EVENT))
    }

    toast({
      title: "Content Saved",
      description: "Changes have been successfully published.",
      className: "bg-emerald-500 text-white border-none",
    })
  }

  const updateHomepage = (data: Partial<CMSData["homepage"]>) => {
    saveCMSData({
      ...cmsData,
      homepage: {
        ...cmsData.homepage,
        ...data,
      },
    })
  }

  const updateFooter = (data: Partial<CMSData["footer"]>) => {
    saveCMSData({
      ...cmsData,
      footer: {
        ...cmsData.footer,
        ...data,
      },
    })
  }

  const updateVenue = (id: string, data: any) => {
    const updatedVenues = cmsData.venues.map((venue) =>
      venue.id === id
        ? {
            ...venue,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        : venue
    )

    saveCMSData({
      ...cmsData,
      venues: updatedVenues,
    })
  }

  const updateOffice = (id: string, data: any) => {
    const updatedOffices = cmsData.offices.map((office) =>
      office.id === id
        ? {
            ...office,
            ...data,
            updatedAt: new Date().toISOString(),
          }
        : office
    )

    saveCMSData({
      ...cmsData,
      offices: updatedOffices,
    })
  }

  const addVenue = (data: any) => {
    const newVenue = {
      id: data.id || createLocalId("venue"),
      type: "venue",
      createdAt: new Date().toISOString(),
      ...data,
    }

    saveCMSData({
      ...cmsData,
      venues: [...cmsData.venues, newVenue],
    })
  }

  const deleteVenue = (id: string) => {
    saveCMSData({
      ...cmsData,
      venues: cmsData.venues.filter((venue) => venue.id !== id),
    })
  }

  const addOffice = (data: any) => {
    const newOffice = {
      id: data.id || createLocalId("office"),
      type: "office",
      createdAt: new Date().toISOString(),
      ...data,
    }

    saveCMSData({
      ...cmsData,
      offices: [...cmsData.offices, newOffice],
    })
  }

  const deleteOffice = (id: string) => {
    saveCMSData({
      ...cmsData,
      offices: cmsData.offices.filter((office) => office.id !== id),
    })
  }

  const addPastEvent = (
    data: Omit<PastEvent, "id" | "createdAt" | "updatedAt">
  ) => {
    const newPastEvent: PastEvent = {
      id: createLocalId("past-client-booking"),
      title: data.title,
      clientName: data.clientName || "",
      description: data.description,
      eventDate: data.eventDate,
      venueName: data.venueName,
      image: data.image,
      isFeatured: data.isFeatured ?? true,
      hasClientConsent: data.hasClientConsent === true,
      createdAt: new Date().toISOString(),
    }

    saveCMSData({
      ...cmsData,
      pastEvents: [newPastEvent, ...cmsData.pastEvents],
    })
  }

  const updatePastEvent = (id: string, data: Partial<PastEvent>) => {
    const updatedPastEvents = cmsData.pastEvents.map((event) =>
      event.id === id
        ? {
            ...event,
            ...data,
            hasClientConsent: data.hasClientConsent ?? event.hasClientConsent ?? false,
            updatedAt: new Date().toISOString(),
          }
        : event
    )

    saveCMSData({
      ...cmsData,
      pastEvents: updatedPastEvents,
    })
  }

  const deletePastEvent = (id: string) => {
    saveCMSData({
      ...cmsData,
      pastEvents: cmsData.pastEvents.filter((event) => event.id !== id),
    })
  }

  return (
    <CMSContext.Provider
      value={{
        cmsData,
        updateHomepage,
        updateFooter,

        updateVenue,
        updateOffice,
        addVenue,
        deleteVenue,
        addOffice,
        deleteOffice,

        addPastEvent,
        updatePastEvent,
        deletePastEvent,

        saveCMSData,
      }}
    >
      {children}
    </CMSContext.Provider>
  )
}

export const useCMS = () => useContext(CMSContext)