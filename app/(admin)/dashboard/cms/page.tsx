"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react"
import {
  Building2,
  Calendar,
  Camera,
  Globe2,
  Home,
  ImageIcon,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Tent,
  Trash2,
  Upload,
  X,
} from "lucide-react"

import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Textarea } from "@/src/modules/shared/components/ui/textarea"
import { useToast } from "@/src/modules/shared/hooks/use-toast"
import { useCMS } from "@/src/modules/admin/contexts/cms-context"

type TabKey = "homepage" | "venues" | "offices" | "pastEvents"

type SpaceRecord = {
  id: string
  name?: string
  capacity?: string
  price?: number | string
  description?: string
  image?: string
  panoImage?: string
  type?: string
}

type PastEventForm = {
  title: string
  clientName: string
  description: string
  eventDate: string
  venueName: string
  image: string
  isFeatured: boolean
  hasClientConsent: boolean
}

const MAX_IMAGE_SIZE_MB = 2.5
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024

const EMPTY_SPACE: SpaceRecord = {
  id: "",
  name: "",
  capacity: "",
  price: "",
  description: "",
  image: "",
  panoImage: "",
}

const EMPTY_PAST_EVENT: PastEventForm = {
  title: "",
  clientName: "",
  description: "",
  eventDate: "",
  venueName: "",
  image: "",
  isFeatured: true,
  hasClientConsent: false,
}

const TABS: Array<{
  key: TabKey
  label: string
  description: string
  icon: ReactNode
}> = [
  {
    key: "homepage",
    label: "Homepage",
    description: "Hero and footer content",
    icon: <Home className="h-4 w-4" />,
  },
  {
    key: "venues",
    label: "Event Venues",
    description: "Event spaces",
    icon: <Tent className="h-4 w-4" />,
  },
  {
    key: "offices",
    label: "Office Spaces",
    description: "Office rental spaces",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    key: "pastEvents",
    label: "Past Client Bookings",
    description: "Real client event photos",
    icon: <Sparkles className="h-4 w-4" />,
  },
]

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ")
}

function toSafePrice(value: string | number | undefined) {
  const price = Number(value || 0)
  return Number.isFinite(price) ? price : 0
}

function formatMoney(value: string | number | undefined) {
  return `₱${toSafePrice(value).toLocaleString("en-PH")}`
}

function getImageSource(value?: string) {
  return value && value.trim() ? value : "/placeholder.jpg"
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
      {children}
    </Label>
  )
}

function ImageUploadRow({
  label,
  value,
  note,
  accent = "orange",
  onValueChange,
}: {
  label: string
  value?: string
  note?: string
  accent?: "orange" | "blue"
  onValueChange: (value: string) => void
}) {
  const { toast } = useToast()

  const accentClass =
    accent === "blue"
      ? "file:text-blue-600 focus-visible:ring-blue-500"
      : "file:text-orange-600 focus-visible:ring-orange-500"

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file only.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast({
        title: "Image Too Large",
        description: `Please upload an image smaller than ${MAX_IMAGE_SIZE_MB}MB.`,
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      onValueChange(String(reader.result || ""))
      event.target.value = ""
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <FieldLabel>{label}</FieldLabel>
        <ImageIcon className="h-4 w-4 text-slate-400" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-24 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white sm:w-36">
          <img
            src={getImageSource(value)}
            alt={`${label} preview`}
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = "/placeholder.jpg"
            }}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={`h-11 rounded-xl border-slate-200 bg-white text-sm font-semibold file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-black ${accentClass}`}
          />

          <Input
            value={value || ""}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder="Or paste image URL / data URL"
            className="h-10 rounded-xl border-slate-200 bg-white text-xs font-semibold"
          />

          {note && <p className="text-xs font-semibold text-slate-500">{note}</p>}
        </div>
      </div>
    </div>
  )
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          {description}
        </p>
      </div>

      {children}
    </section>
  )
}

function SpaceEditor({
  title,
  description,
  spaces,
  newSpace,
  setNewSpace,
  onAdd,
  onUpdate,
  onDelete,
  accent = "orange",
}: {
  title: string
  description: string
  spaces: SpaceRecord[]
  newSpace: SpaceRecord
  setNewSpace: (value: SpaceRecord) => void
  onAdd: () => void
  onUpdate: (id: string, data: SpaceRecord) => void
  onDelete: (id: string) => void
  accent?: "orange" | "blue"
}) {
  const [editingSpaces, setEditingSpaces] = useState<SpaceRecord[]>(spaces)

  useEffect(() => {
    setEditingSpaces(spaces)
  }, [spaces])

  const buttonClass =
    accent === "blue"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-orange-600 hover:bg-orange-700"

  const updateEditingSpace = (id: string, patch: Partial<SpaceRecord>) => {
    setEditingSpaces((current) =>
      current.map((space) => (space.id === id ? { ...space, ...patch } : space))
    )
  }

  return (
    <SectionShell title={title} description={description}>
      <div className="mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-orange-600" />
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-700">
            Add New
          </h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <FieldLabel>Name</FieldLabel>
            <Input
              value={newSpace.name || ""}
              onChange={(event) => setNewSpace({ ...newSpace, name: event.target.value })}
              placeholder="Space name"
              className="mt-2 h-11 rounded-xl border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <FieldLabel>Capacity</FieldLabel>
            <Input
              value={newSpace.capacity || ""}
              onChange={(event) =>
                setNewSpace({ ...newSpace, capacity: event.target.value })
              }
              placeholder="80–100 pax"
              className="mt-2 h-11 rounded-xl border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <FieldLabel>Price</FieldLabel>
            <Input
              type="number"
              value={newSpace.price || ""}
              onChange={(event) => setNewSpace({ ...newSpace, price: event.target.value })}
              placeholder="15000"
              className="mt-2 h-11 rounded-xl border-slate-200 bg-white font-semibold"
            />
          </div>

          <div>
            <FieldLabel>360 Panorama URL</FieldLabel>
            <Input
              value={newSpace.panoImage || ""}
              onChange={(event) =>
                setNewSpace({ ...newSpace, panoImage: event.target.value })
              }
              placeholder="Paste panorama image URL"
              className="mt-2 h-11 rounded-xl border-slate-200 bg-white font-semibold"
            />
          </div>

          <div className="lg:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={newSpace.description || ""}
              onChange={(event) =>
                setNewSpace({ ...newSpace, description: event.target.value })
              }
              placeholder="Short description"
              className="mt-2 min-h-[100px] resize-none rounded-xl border-slate-200 bg-white font-semibold"
            />
          </div>

          <div className="lg:col-span-2">
            <ImageUploadRow
              label="Main Image"
              value={newSpace.image}
              accent={accent}
              onValueChange={(image) => setNewSpace({ ...newSpace, image })}
              note="Used in landing page, booking, and tour preview."
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={onAdd}
          className={`mt-4 h-11 rounded-xl px-5 text-xs font-black text-white ${buttonClass}`}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Space
        </Button>
      </div>

      <div className="space-y-5">
        {editingSpaces.map((space) => (
          <div
            key={space.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {space.id}
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-950">
                  {space.name || "Untitled Space"}
                </h3>
                <p className="mt-1 text-sm font-bold text-orange-600">
                  {formatMoney(space.price)}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => onUpdate(space.id, space)}
                  className={`h-10 rounded-xl px-4 text-xs font-black text-white ${buttonClass}`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onDelete(space.id)}
                  className="h-10 rounded-xl border-rose-200 px-4 text-xs font-black text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                  src={getImageSource(space.image)}
                  alt={space.name || "Space image"}
                  className="h-56 w-full object-cover lg:h-full"
                  onError={(event) => {
                    event.currentTarget.src = "/placeholder.jpg"
                  }}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={space.name || ""}
                    onChange={(event) =>
                      updateEditingSpace(space.id, { name: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <FieldLabel>Capacity</FieldLabel>
                  <Input
                    value={space.capacity || ""}
                    onChange={(event) =>
                      updateEditingSpace(space.id, { capacity: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <FieldLabel>Price</FieldLabel>
                  <Input
                    type="number"
                    value={space.price || ""}
                    onChange={(event) =>
                      updateEditingSpace(space.id, { price: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <FieldLabel>360 Panorama URL</FieldLabel>
                  <Input
                    value={space.panoImage || ""}
                    onChange={(event) =>
                      updateEditingSpace(space.id, { panoImage: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div className="lg:col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={space.description || ""}
                    onChange={(event) =>
                      updateEditingSpace(space.id, { description: event.target.value })
                    }
                    className="mt-2 min-h-[100px] resize-none rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div className="lg:col-span-2">
                  <ImageUploadRow
                    label="Main Image"
                    value={space.image}
                    accent={accent}
                    onValueChange={(image) => updateEditingSpace(space.id, { image })}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {editingSpaces.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <Camera className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-black text-slate-700">No spaces yet</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Add your first record using the form above.
            </p>
          </div>
        )}
      </div>
    </SectionShell>
  )
}

export default function CMSPage() {
  const {
    cmsData,
    updateHomepage,
    updateFooter,
    updateVenue,
    updateOffice,
    addVenue,
    addOffice,
    deleteVenue,
    deleteOffice,
    addPastEvent,
    updatePastEvent,
    deletePastEvent,
  } = useCMS()

  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<TabKey>("homepage")
  const [homepageForm, setHomepageForm] = useState(cmsData.homepage)
  const [footerForm, setFooterForm] = useState(cmsData.footer)
  const [newVenue, setNewVenue] = useState<SpaceRecord>(EMPTY_SPACE)
  const [newOffice, setNewOffice] = useState<SpaceRecord>(EMPTY_SPACE)
  const [pastEventForm, setPastEventForm] = useState<PastEventForm>(EMPTY_PAST_EVENT)
  const [editingPastEventId, setEditingPastEventId] = useState<string | null>(null)

  const venueNames = useMemo(() => {
    return [...(cmsData.venues || []), ...(cmsData.offices || [])]
      .map((space: SpaceRecord) => space.name)
      .filter(Boolean) as string[]
  }, [cmsData.venues, cmsData.offices])

  const sortedPastEvents = useMemo(() => {
    return [...(cmsData.pastEvents || [])].sort((a, b) => {
      return new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime()
    })
  }, [cmsData.pastEvents])

  useEffect(() => {
    setHomepageForm(cmsData.homepage)
    setFooterForm(cmsData.footer)
  }, [cmsData.homepage, cmsData.footer])

  const handleSaveHomepage = () => {
    updateHomepage({
      heroTitle: homepageForm.heroTitle,
      heroSubtitle: homepageForm.heroSubtitle,
      heroImage: homepageForm.heroImage,
    })

    updateFooter({
      email: footerForm.email,
      phone: footerForm.phone,
      address: footerForm.address,
      facebook: footerForm.facebook,
    })
  }

  const handleAddVenue = () => {
    if (!cleanText(newVenue.name || "")) {
      toast({
        title: "Venue name required",
        description: "Please enter a venue name.",
        variant: "destructive",
      })
      return
    }

    addVenue({
      ...newVenue,
      id: createLocalId("venue"),
      name: cleanText(newVenue.name || ""),
      capacity: cleanText(newVenue.capacity || ""),
      price: toSafePrice(newVenue.price),
      description: newVenue.description || "",
      image: newVenue.image || "/placeholder.jpg",
      panoImage: newVenue.panoImage || "",
      type: "venue",
    })

    setNewVenue(EMPTY_SPACE)
  }

  const handleAddOffice = () => {
    if (!cleanText(newOffice.name || "")) {
      toast({
        title: "Office name required",
        description: "Please enter an office name.",
        variant: "destructive",
      })
      return
    }

    addOffice({
      ...newOffice,
      id: createLocalId("office"),
      name: cleanText(newOffice.name || ""),
      capacity: cleanText(newOffice.capacity || ""),
      price: toSafePrice(newOffice.price),
      description: newOffice.description || "",
      image: newOffice.image || "/placeholder.jpg",
      panoImage: newOffice.panoImage || "",
      type: "office",
    })

    setNewOffice(EMPTY_SPACE)
  }

  const resetPastEventForm = () => {
    setPastEventForm(EMPTY_PAST_EVENT)
    setEditingPastEventId(null)
  }

  const handleSavePastEvent = () => {
    if (!cleanText(pastEventForm.title)) {
      toast({
        title: "Event title required",
        description: "Please enter the client booking or event title.",
        variant: "destructive",
      })
      return
    }

    if (!pastEventForm.eventDate) {
      toast({
        title: "Event date required",
        description: "Please select the date of the past client booking.",
        variant: "destructive",
      })
      return
    }

    if (!pastEventForm.image.trim()) {
      toast({
        title: "Photo required",
        description: "Please upload a real past client event photo.",
        variant: "destructive",
      })
      return
    }

    if (pastEventForm.isFeatured && !pastEventForm.hasClientConsent) {
      toast({
        title: "Client permission required",
        description:
          "Please confirm that the client allowed this photo to be displayed on the landing page.",
        variant: "destructive",
      })
      return
    }

    const payload = {
      title: cleanText(pastEventForm.title),
      clientName: cleanText(pastEventForm.clientName),
      description: pastEventForm.description.trim(),
      eventDate: pastEventForm.eventDate,
      venueName: pastEventForm.venueName || "One Estela Place",
      image: pastEventForm.image || "/placeholder.jpg",
      isFeatured: pastEventForm.isFeatured,
      hasClientConsent: pastEventForm.hasClientConsent,
    }

    if (editingPastEventId) {
      updatePastEvent(editingPastEventId, payload)
      resetPastEventForm()
      return
    }

    addPastEvent(payload)
    resetPastEventForm()
  }

  const handleEditPastEvent = (event: any) => {
    setEditingPastEventId(event.id)
    setPastEventForm({
      title: event.title || "",
      clientName: event.clientName || "",
      description: event.description || "",
      eventDate: event.eventDate || "",
      venueName: event.venueName || "",
      image: event.image || "",
      isFeatured: event.isFeatured ?? true,
      hasClientConsent: event.hasClientConsent === true,
    })

    setActiveTab("pastEvents")
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] p-5 md:p-8 xl:p-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-orange-600">
            Admin Content Management
          </p>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            CMS Settings
          </h1>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Manage landing page content, spaces, 360 tour images, and real past client booking photos.
          </p>
        </div>

        <div className="inline-flex overflow-x-auto rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                activeTab === tab.key
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === "homepage" && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <SectionShell
            title="Homepage Content"
            description="Update hero text, hero image, and footer contact details."
          >
            <div className="grid gap-5">
              <div>
                <FieldLabel>Hero Title</FieldLabel>
                <Textarea
                  value={homepageForm.heroTitle || ""}
                  onChange={(event) =>
                    setHomepageForm({ ...homepageForm, heroTitle: event.target.value })
                  }
                  className="mt-2 min-h-[110px] resize-none rounded-xl border-slate-200 font-semibold"
                />
              </div>

              <div>
                <FieldLabel>Hero Subtitle</FieldLabel>
                <Textarea
                  value={homepageForm.heroSubtitle || ""}
                  onChange={(event) =>
                    setHomepageForm({ ...homepageForm, heroSubtitle: event.target.value })
                  }
                  className="mt-2 min-h-[110px] resize-none rounded-xl border-slate-200 font-semibold"
                />
              </div>

              <ImageUploadRow
                label="Hero Image"
                value={homepageForm.heroImage}
                onValueChange={(heroImage) =>
                  setHomepageForm({ ...homepageForm, heroImage })
                }
              />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    value={footerForm.email || ""}
                    onChange={(event) =>
                      setFooterForm({ ...footerForm, email: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <Input
                    value={footerForm.phone || ""}
                    onChange={(event) =>
                      setFooterForm({ ...footerForm, phone: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <FieldLabel>Facebook Link</FieldLabel>
                  <Input
                    value={footerForm.facebook || ""}
                    onChange={(event) =>
                      setFooterForm({ ...footerForm, facebook: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>

                <div>
                  <FieldLabel>Address</FieldLabel>
                  <Input
                    value={footerForm.address || ""}
                    onChange={(event) =>
                      setFooterForm({ ...footerForm, address: event.target.value })
                    }
                    className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleSaveHomepage}
                className="h-11 w-full rounded-xl bg-orange-600 text-xs font-black text-white hover:bg-orange-700 sm:w-fit sm:px-6"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Homepage
              </Button>
            </div>
          </SectionShell>

          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-950 text-white shadow-sm">
            <div className="h-72 overflow-hidden">
              <img
                src={getImageSource(homepageForm.heroImage)}
                alt="Homepage preview"
                className="h-full w-full object-cover opacity-70"
                onError={(event) => {
                  event.currentTarget.src = "/placeholder.jpg"
                }}
              />
            </div>

            <div className="p-6">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-orange-400">
                Landing Preview
              </p>

              <h2 className="whitespace-pre-line text-3xl font-black leading-tight">
                {homepageForm.heroTitle}
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                {homepageForm.heroSubtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "venues" && (
        <SpaceEditor
          title="Event Venues"
          description="Manage event spaces shown in booking, landing page, and 360 tour."
          spaces={cmsData.venues || []}
          newSpace={newVenue}
          setNewSpace={setNewVenue}
          onAdd={handleAddVenue}
          onUpdate={(id, data) =>
            updateVenue(id, {
              ...data,
              price: toSafePrice(data.price),
            })
          }
          onDelete={deleteVenue}
          accent="orange"
        />
      )}

      {activeTab === "offices" && (
        <SpaceEditor
          title="Office Spaces"
          description="Manage office rental spaces and their 360 tour images."
          spaces={cmsData.offices || []}
          newSpace={newOffice}
          setNewSpace={setNewOffice}
          onAdd={handleAddOffice}
          onUpdate={(id, data) =>
            updateOffice(id, {
              ...data,
              price: toSafePrice(data.price),
            })
          }
          onDelete={deleteOffice}
          accent="blue"
        />
      )}

      {activeTab === "pastEvents" && (
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <SectionShell
            title={editingPastEventId ? "Edit Past Client Booking" : "Add Past Client Booking"}
            description="Upload real event photos from past clients who used One Estela Place."
          >
            <div className="grid gap-4">
              <div>
                <FieldLabel>Client / Event Title</FieldLabel>
                <Input
                  value={pastEventForm.title}
                  onChange={(event) =>
                    setPastEventForm({ ...pastEventForm, title: event.target.value })
                  }
                  placeholder="Santos Birthday Celebration"
                  className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                />
              </div>

              <div>
                <FieldLabel>Client Name / Family Name Optional</FieldLabel>
                <Input
                  value={pastEventForm.clientName}
                  onChange={(event) =>
                    setPastEventForm({ ...pastEventForm, clientName: event.target.value })
                  }
                  placeholder="Santos Family"
                  className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                />
              </div>

              <div>
                <FieldLabel>Date of Event</FieldLabel>
                <Input
                  type="date"
                  value={pastEventForm.eventDate}
                  onChange={(event) =>
                    setPastEventForm({ ...pastEventForm, eventDate: event.target.value })
                  }
                  className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                />
              </div>

              <div>
                <FieldLabel>Venue Used</FieldLabel>
                <Input
                  list="venue-list"
                  value={pastEventForm.venueName}
                  onChange={(event) =>
                    setPastEventForm({ ...pastEventForm, venueName: event.target.value })
                  }
                  placeholder="Select or type venue"
                  className="mt-2 h-11 rounded-xl border-slate-200 font-semibold"
                />

                <datalist id="venue-list">
                  {venueNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={pastEventForm.description}
                  onChange={(event) =>
                    setPastEventForm({ ...pastEventForm, description: event.target.value })
                  }
                  placeholder="Short description of the actual client booking..."
                  className="mt-2 min-h-[120px] resize-none rounded-xl border-slate-200 font-semibold"
                />
              </div>

              <ImageUploadRow
                label="Past Client Booking Photo"
                value={pastEventForm.image}
                onValueChange={(image) =>
                  setPastEventForm({ ...pastEventForm, image })
                }
                note="Upload an actual event photo from a past client booking."
              />

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={pastEventForm.hasClientConsent}
                  onChange={(event) =>
                    setPastEventForm({
                      ...pastEventForm,
                      hasClientConsent: event.target.checked,
                    })
                  }
                  className="mt-1 h-4 w-4 accent-orange-600"
                />

                <span>
                  <span className="block text-sm font-black text-slate-800">
                    Client gave permission to display this photo
                  </span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
                    Required before showing the photo on the landing page.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={pastEventForm.isFeatured}
                  onChange={(event) =>
                    setPastEventForm({
                      ...pastEventForm,
                      isFeatured: event.target.checked,
                    })
                  }
                  className="h-4 w-4 accent-orange-600"
                />

                <span className="text-sm font-bold text-slate-700">
                  Show this past client booking on landing page
                </span>
              </label>

              <div className="flex gap-3">
                {editingPastEventId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetPastEventForm}
                    className="h-11 flex-1 rounded-xl border-slate-200 text-xs font-black"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleSavePastEvent}
                  className="h-11 flex-1 rounded-xl bg-orange-600 text-xs font-black text-white hover:bg-orange-700"
                >
                  {editingPastEventId ? (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Add Client Booking
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SectionShell>

          <SectionShell
            title="Past Client Booking List"
            description="Only records with client permission and display enabled will appear on the landing page."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {sortedPastEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={getImageSource(event.image)}
                      alt={event.title}
                      className="h-full w-full object-cover"
                      onError={(imageEvent) => {
                        imageEvent.currentTarget.src = "/placeholder.jpg"
                      }}
                    />

                    {event.isFeatured && event.hasClientConsent && (
                      <div className="absolute left-3 top-3 rounded-full bg-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow">
                        Live on Landing
                      </div>
                    )}

                    {event.isFeatured && !event.hasClientConsent && (
                      <div className="absolute left-3 top-3 rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white shadow">
                        Consent Needed
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-slate-950">
                          {event.title}
                        </h3>

                        {event.clientName && (
                          <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-orange-600">
                            {event.clientName}
                          </p>
                        )}

                        <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {event.eventDate || "No date"}
                        </p>

                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {event.venueName || "One Estela Place"}
                        </p>
                      </div>
                    </div>

                    <p className="line-clamp-3 text-sm font-medium leading-6 text-slate-600">
                      {event.description}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleEditPastEvent(event)}
                        className="h-10 flex-1 rounded-xl border-slate-200 text-xs font-black"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => deletePastEvent(event.id)}
                        className="h-10 flex-1 rounded-xl border-rose-200 text-xs font-black text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {sortedPastEvents.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                  <Globe2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-black text-slate-700">No past client bookings yet</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Add real event photos from past clients using the form.
                  </p>
                </div>
              )}
            </div>
          </SectionShell>
        </div>
      )}
    </div>
  )
}