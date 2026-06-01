"use client"

import { useMemo } from "react"
import { PublicLayout } from "@/src/modules/client/components/public-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/modules/shared/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/src/modules/shared/components/ui/accordion"
import {
  Calendar,
  Camera,
  ImageIcon,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import { ReserveButton } from "@/src/modules/client/components/reserve-button"
import { TourButton } from "@/src/modules/client/components/tour-button"
import { useCMS } from "@/src/modules/admin/contexts/cms-context"

function getImageSource(value?: string) {
  return value && value.trim() ? value : "/placeholder.jpg"
}

function formatDate(date?: string) {
  if (!date) return "Event date"

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

export default function HomePage() {
  const { cmsData } = useCMS()

  const homepage = cmsData?.homepage || {
    heroTitle: "Welcome to One Estela Place",
    heroSubtitle: "The perfect venue for your special events and celebrations.",
    heroImage: "/images/venue-interior.jpg",
  }

  const faqs =
    cmsData?.faqs?.length > 0
      ? cmsData.faqs
      : [
          {
            question: "How long is the standard venue rental?",
            answer:
              "The standard venue rental is 6 hours. Setup, program, and cleanup should fit within the approved booking schedule.",
          },
          {
            question: "What is included in the venue rental?",
            answer:
              "One Estela Place focuses on venue space rental only. Clients may arrange their own decorations, catering, suppliers, and event services.",
          },
          {
            question: "Do you provide catering services?",
            answer:
              "No. Catering is not included. Clients may bring or coordinate with their preferred caterer based on venue guidelines.",
          },
          {
            question: "Can I visit the venue before booking?",
            answer:
              "Yes. Clients may schedule an ocular visit before finalizing their reservation.",
          },
          {
            question: "How does booking confirmation work?",
            answer:
              "A booking request will be reviewed first. Once approved and payment requirements are verified, the booking may be marked as confirmed.",
          },
        ]

  const pastClientBookings = useMemo(() => {
    const events = Array.isArray(cmsData?.pastEvents) ? cmsData.pastEvents : []

    return events
      .filter((event: any) => event?.isFeatured !== false)
      .filter((event: any) => event?.hasClientConsent === true)
      .sort((a: any, b: any) => {
        return (
          new Date(b.eventDate || b.createdAt || 0).getTime() -
          new Date(a.eventDate || a.createdAt || 0).getTime()
        )
      })
      .slice(0, 6)
  }, [cmsData?.pastEvents])

  return (
    <PublicLayout>
      <section
        id="home"
        className="relative flex min-h-[620px] items-center bg-slate-950 text-white"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('${getImageSource(homepage.heroImage)}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-orange-950/50" />

        <div className="container relative z-10 mx-auto px-4 py-24 text-center">
          <div className="mx-auto mb-5 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-100 backdrop-blur">
            Event Venue · San Pedro, Laguna
          </div>

          <h1 className="mx-auto mb-6 max-w-4xl whitespace-pre-line text-4xl font-black leading-tight text-white drop-shadow-lg md:text-6xl">
            {homepage.heroTitle || "Welcome to One Estela Place"}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base font-semibold leading-8 text-white/90 drop-shadow-md md:text-xl">
            {homepage.heroSubtitle ||
              "The perfect venue for your special events and celebrations."}
          </p>

          <div className="mx-auto flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <ReserveButton
              className="h-12 w-full justify-center rounded-full border-0 bg-white px-7 text-sm font-black text-orange-600 shadow-lg transition hover:bg-orange-50 sm:w-auto"
              size="lg"
            >
              Book Your Event
            </ReserveButton>

            <TourButton
              className="h-12 w-full justify-center rounded-full border-0 bg-orange-600 px-7 text-sm font-black text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-700 sm:w-auto"
              size="lg"
            >
              Take a Tour
            </TourButton>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-600">
              Why Choose Us
            </p>
            <h2 className="text-3xl font-black text-slate-950 md:text-4xl">
              Why Choose One Estela Place?
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-slate-200 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <MapPin className="mx-auto h-11 w-11 text-orange-600" />
                <CardTitle>Accessible Location</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Located in San Pedro, Laguna for convenient venue access.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <Users className="mx-auto h-11 w-11 text-orange-600" />
                <CardTitle>Event Ready Space</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Suitable for birthdays, weddings, seminars, corporate events,
                  and private gatherings.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <Calendar className="mx-auto h-11 w-11 text-orange-600" />
                <CardTitle>Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simple booking request flow with admin review and confirmation.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader>
                <Star className="mx-auto h-11 w-11 text-orange-600" />
                <CardTitle>Elegant Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  A clean and comfortable space where clients can bring their own
                  preferred setup.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="about" className="bg-slate-50 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-600">
                Our Story
              </p>

              <h2 className="mb-4 text-4xl font-black text-slate-950">
                One Estela Place Event Venue
              </h2>

              <div className="mb-8 h-1.5 w-20 rounded-full bg-orange-600" />

              <div className="space-y-6 text-lg leading-relaxed text-slate-600">
                <p>
                  One Estela Place is an event venue in San Pedro, Laguna,
                  established in 2018. It was created to provide a clean,
                  comfortable, and elegant space for special occasions and
                  gatherings.
                </p>

                <p>
                  The venue focuses on space rental, giving clients the freedom
                  to arrange their own decorations, suppliers, catering, and
                  event setup based on their preferred style.
                </p>
              </div>
            </div>

            <div className="relative h-[420px] overflow-hidden rounded-[2rem] shadow-2xl md:h-[550px]">
              <img
                src="/images/venue-chandelier.png"
                alt="Elegant chandelier at One Estela Place venue"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.jpg"
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-orange-600">
                <Sparkles className="h-4 w-4" />
                Past Client Bookings
              </p>

              <h2 className="text-4xl font-black tracking-tight text-slate-950">
                Real Events Hosted at One Estela Place
              </h2>

              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
                Actual client celebrations and gatherings held at our event
                venue, uploaded by the admin with client permission.
              </p>
            </div>

            <div className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-orange-700">
              Client Event Photos
            </div>
          </div>

          {pastClientBookings.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {pastClientBookings.map((event: any) => (
                <article
                  key={event.id}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-100">
                    <img
                      src={getImageSource(event.image)}
                      alt={event.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      onError={(imageEvent) => {
                        imageEvent.currentTarget.src = "/placeholder.jpg"
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-orange-700 shadow">
                      {event.venueName || "One Estela Place"}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      {formatDate(event.eventDate)}
                    </div>

                    <h3 className="text-xl font-black leading-tight text-slate-950">
                      {event.title}
                    </h3>

                    {event.clientName && (
                      <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-orange-600">
                        Client: {event.clientName}
                      </p>
                    )}

                    <p className="mt-3 line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                      {event.description ||
                        "A completed client event hosted at One Estela Place."}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <ImageIcon className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="text-xl font-black text-slate-700">
                No client event photos uploaded yet
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Admin can upload real past client booking photos in CMS Settings
                after getting client permission.
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="faqs" className="border-t border-slate-100 bg-slate-50 py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-600">
              Help Center
            </p>

            <h2 className="mb-4 text-4xl font-black text-slate-950">
              Frequently Asked Questions
            </h2>

            <p className="text-lg text-slate-600">
              Find answers to common questions about booking at One Estela Place.
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq: any, index: number) => (
              <AccordionItem
                key={faq.id || index}
                value={`faq-${index}`}
                className="rounded-2xl border border-slate-200 bg-white px-6 shadow-sm transition-shadow hover:shadow"
              >
                <AccordionTrigger className="py-5 text-left font-bold text-slate-900 hover:text-orange-700 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>

                <AccordionContent className="pb-5 leading-relaxed text-slate-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <Camera className="mx-auto mb-5 h-12 w-12 text-orange-500" />

          <h2 className="text-3xl font-black md:text-4xl">
            Ready to plan your next event?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
            Explore the venue through our virtual tour or send a booking request
            to start your reservation.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ReserveButton
              className="h-12 rounded-full bg-orange-600 px-7 text-sm font-black text-white hover:bg-orange-700"
              size="lg"
            >
              Book Your Event
            </ReserveButton>

            <TourButton
              className="h-12 rounded-full border border-white/20 bg-white px-7 text-sm font-black text-slate-950 hover:bg-orange-50"
              size="lg"
            >
              Take a Tour
            </TourButton>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}