"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Building2,
  Camera,
  ChevronLeft,
  Maximize2,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  Users,
  X,
} from "lucide-react"

import { Button } from "@/src/modules/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/src/modules/shared/components/ui/dialog"
import { useCMS } from "@/src/modules/admin/contexts/cms-context"

type SpaceType = "venues" | "offices"

type TourSpace = {
  id: string
  name: string
  description?: string
  capacity?: string
  price?: number | string
  image?: string
  panoImage?: string
}

type TourButtonProps = {
  children?: React.ReactNode
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
}

declare global {
  interface Window {
    pannellum?: any
  }
}

const PANNELLUM_CSS_ID = "pannellum-css"
const PANNELLUM_SCRIPT_ID = "pannellum-script"

function getImageSource(value?: string) {
  return value && value.trim() ? value : "/placeholder.jpg"
}

function normalizeSpaces(spaces?: any[]): TourSpace[] {
  if (!Array.isArray(spaces)) return []

  return spaces.map((space, index) => ({
    id: String(space.id || `${space.name || "space"}-${index}`),
    name: String(space.name || space.title || `Space ${index + 1}`),
    description: String(space.description || ""),
    capacity: String(space.capacity || ""),
    price: space.price || 0,
    image: String(space.image || ""),
    panoImage: String(space.panoImage || space.panorama || space.pano || ""),
  }))
}

function loadPannellum() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") return resolve()

    if (window.pannellum) {
      resolve()
      return
    }

    if (!document.getElementById(PANNELLUM_CSS_ID)) {
      const link = document.createElement("link")
      link.id = PANNELLUM_CSS_ID
      link.rel = "stylesheet"
      link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css"
      document.head.appendChild(link)
    }

    const existingScript = document.getElementById(PANNELLUM_SCRIPT_ID) as HTMLScriptElement | null

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Failed to load 360 viewer.")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = PANNELLUM_SCRIPT_ID
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
    script.async = true

    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load 360 viewer."))

    document.body.appendChild(script)
  })
}

export function TourButton({ children, className, size = "lg" }: TourButtonProps) {
  const { cmsData } = useCMS()

  const venues = useMemo(() => normalizeSpaces(cmsData?.venues), [cmsData?.venues])
  const offices = useMemo(() => normalizeSpaces(cmsData?.offices), [cmsData?.offices])

  const [open, setOpen] = useState(false)
  const [activeType, setActiveType] = useState<SpaceType>("venues")
  const [selectedId, setSelectedId] = useState("")
  const [isViewerReady, setIsViewerReady] = useState(false)
  const [viewerError, setViewerError] = useState("")
  const [isAutoPanning, setIsAutoPanning] = useState(true)

  const viewerRef = useRef<any>(null)

  const activeSpaces = activeType === "venues" ? venues : offices

  const selectedSpace = useMemo(() => {
    return activeSpaces.find((space) => space.id === selectedId) || activeSpaces[0] || null
  }, [activeSpaces, selectedId])

  const applyAutoPan = (shouldPan: boolean) => {
    const viewer = viewerRef.current
    if (!viewer) return

    try {
      if (shouldPan) {
        viewer.startAutoRotate?.(-2, 0)
      } else {
        viewer.stopAutoRotate?.()
      }
    } catch (error) {
      console.error("Failed to toggle tour auto-pan", error)
    }
  }

  useEffect(() => {
    if (!open) return

    const firstSpace = activeSpaces[0]
    if (!selectedId && firstSpace) setSelectedId(firstSpace.id)
  }, [open, activeSpaces, selectedId])

  useEffect(() => {
    if (!open || !selectedSpace) return

    let cancelled = false
    const viewerContainerId = "one-estela-tour-panorama"
    const panoramaSource = selectedSpace.panoImage || selectedSpace.image

    setIsViewerReady(false)
    setViewerError("")

    if (viewerRef.current?.destroy) {
      viewerRef.current.destroy()
      viewerRef.current = null
    }

    if (!panoramaSource) {
      setViewerError("No 360 panorama image available.")
      setIsViewerReady(true)
      return
    }

    loadPannellum()
      .then(() => {
        if (cancelled || !window.pannellum) return

        const container = document.getElementById(viewerContainerId)
        if (!container) return

        container.innerHTML = ""

        viewerRef.current = window.pannellum.viewer(viewerContainerId, {
          type: "equirectangular",
          panorama: getImageSource(panoramaSource),
          autoLoad: true,
          showControls: false,
          showZoomCtrl: false,
          showFullscreenCtrl: false,
          keyboardZoom: true,
          mouseZoom: true,
          draggable: true,
          compass: false,
          hfov: 100,
          minHfov: 50,
          maxHfov: 120,
          autoRotate: isAutoPanning ? -2 : 0,
        })

        const markReady = () => {
          if (cancelled) return
          setIsViewerReady(true)
          applyAutoPan(isAutoPanning)
        }

        if (viewerRef.current?.on) {
          viewerRef.current.on("load", markReady)
          viewerRef.current.on("error", () => {
            if (!cancelled) setIsViewerReady(true)
          })
        }

        window.setTimeout(markReady, 700)
      })
      .catch(() => {
        if (!cancelled) {
          setViewerError("Unable to load 360 viewer.")
          setIsViewerReady(true)
        }
      })

    return () => {
      cancelled = true
      if (viewerRef.current?.destroy) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [open, selectedSpace])

  useEffect(() => {
    applyAutoPan(isAutoPanning)
  }, [isAutoPanning])

  const handleSwitchType = (type: SpaceType) => {
    setActiveType(type)
    const nextSpaces = type === "venues" ? venues : offices
    setSelectedId(nextSpaces[0]?.id || "")
  }

  const handleToggleAutoPan = () => {
    setIsAutoPanning((current) => !current)
  }

  const handleZoomIn = () => {
    if (!viewerRef.current) return
    const currentHfov = viewerRef.current.getHfov()
    viewerRef.current.setHfov(Math.max(50, currentHfov - 10))
  }

  const handleZoomOut = () => {
    if (!viewerRef.current) return
    const currentHfov = viewerRef.current.getHfov()
    viewerRef.current.setHfov(Math.min(120, currentHfov + 10))
  }

  const handleResetView = () => {
    if (!viewerRef.current) return
    viewerRef.current.setPitch(0)
    viewerRef.current.setYaw(0)
    viewerRef.current.setHfov(100)
    applyAutoPan(isAutoPanning)
  }

  const handleFullscreen = () => {
    const container = document.getElementById("one-estela-tour-panorama")
    if (!container?.requestFullscreen) return
    container.requestFullscreen()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className} size={size}>
          {children || (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Take a Tour
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="h-[92dvh] w-[calc(100vw-24px)] overflow-hidden rounded-[1.4rem] border-0 bg-black p-0 shadow-2xl sm:h-[88dvh] sm:rounded-[1.75rem] md:w-[calc(100vw-48px)] xl:!max-w-[1180px] [&>button]:hidden">
        <DialogTitle className="sr-only">360 Tour</DialogTitle>

        <div className="flex h-full min-w-0 flex-col overflow-hidden bg-black xl:grid xl:grid-cols-[0.95fr_1.05fr]">
          <div className="relative h-[38dvh] min-h-[240px] shrink-0 overflow-hidden bg-slate-950 sm:h-[44dvh] sm:min-h-[320px] xl:h-full xl:min-h-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute left-4 top-4 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-orange-50 hover:text-orange-600"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div
              id="one-estela-tour-panorama"
              className="h-full min-h-[240px] w-full sm:min-h-[320px] xl:min-h-full"
            />

            {(!isViewerReady || viewerError) && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-center">
                {!viewerError ? (
                  <>
                    <div className="mb-4 h-9 w-9 animate-spin rounded-full border-4 border-orange-600 border-t-transparent" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white">
                      Loading 360° View...
                    </p>
                  </>
                ) : (
                  <>
                    <Camera className="mb-3 h-10 w-10 text-orange-500" />
                    <p className="text-sm font-black text-white">{viewerError}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-300">
                      Upload a panorama image in CMS Settings.
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/70 p-2 text-white shadow-xl backdrop-blur">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-600 text-white"
                onClick={handleToggleAutoPan}
                title={isAutoPanning ? "Pause pan around" : "Play pan around"}
              >
                {isAutoPanning ? (
                  <PauseCircle className="h-4 w-4" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
              </button>

              <div className="mx-1 h-6 w-px bg-white/20" />

              <button
                type="button"
                onClick={handleZoomOut}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                -
              </button>

              <button
                type="button"
                onClick={handleResetView}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={handleZoomIn}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10"
              >
                +
              </button>

              <button
                type="button"
                onClick={handleFullscreen}
                className="hidden h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 sm:flex"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden bg-black px-5 py-5 text-white sm:px-7 sm:py-6 xl:h-full xl:px-9 xl:py-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                    {activeType === "venues" ? "Event Venue" : "Office Space"}
                  </span>

                  {selectedSpace?.capacity && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1 text-[10px] font-black text-white">
                      <Users className="h-3 w-3" />
                      {selectedSpace.capacity}
                    </span>
                  )}
                </div>

                <h2 className="max-w-full break-words text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl xl:text-5xl">
                  {selectedSpace?.name || "One Estela Place"}
                </h2>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-300 sm:text-base">
                  {selectedSpace?.description ||
                    "Explore our available spaces through a 360° panorama view."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-slate-950"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-5 flex w-fit rounded-full border border-white/10 bg-white/10 p-1">
              <button
                type="button"
                onClick={() => handleSwitchType("venues")}
                className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  activeType === "venues"
                    ? "bg-orange-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Venues
              </button>

              <button
                type="button"
                onClick={() => handleSwitchType("offices")}
                className={`rounded-full px-5 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                  activeType === "offices"
                    ? "bg-orange-600 text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Offices
              </button>
            </div>

            {activeSpaces.length > 0 ? (
              <div className="grid gap-3 pb-3 sm:grid-cols-2">
                {activeSpaces.map((space) => {
                  const isActive = selectedSpace?.id === space.id

                  return (
                    <button
                      key={space.id}
                      type="button"
                      onClick={() => setSelectedId(space.id)}
                      className={`group overflow-hidden rounded-2xl border text-left transition ${
                        isActive
                          ? "border-orange-600 bg-orange-600/10 shadow-lg shadow-orange-600/20"
                          : "border-white/10 bg-white/[0.03] hover:border-orange-500/70"
                      }`}
                    >
                      <div className="relative h-28 overflow-hidden bg-slate-900 sm:h-32">
                        <img
                          src={getImageSource(space.image || space.panoImage)}
                          alt={space.name}
                          className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105"
                          onError={(event) => {
                            event.currentTarget.src = "/placeholder.jpg"
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      </div>

                      <div className="p-4">
                        <p className="line-clamp-2 text-sm font-black leading-snug text-white">
                          {space.name}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-400">
                          <span>{space.capacity || "View space"}</span>

                          {activeType === "offices" && (
                            <Building2 className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
                <Camera className="mx-auto mb-3 h-10 w-10 text-slate-500" />
                <p className="font-black text-white">No spaces available</p>
                <p className="mt-1 text-sm font-semibold text-slate-400">
                  Add venues or offices in CMS Settings first.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TourButton
