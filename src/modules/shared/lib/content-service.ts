'use client'

export interface HomepageContent {
  heroTitle: string
  heroDescription: string
  heroImage: string
  aboutTitle: string
  aboutDescription: string
  ctaText: string
  ctaButtonText: string
  features: Array<{
    id: string
    title: string
    description: string
  }>
}

export interface Venue {
  id: string
  name: string
  description: string
  capacity: number
  images: string[]
  features: string[]
  price: number
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface OfficeRoom {
  id: string
  floor: 'ground' | 'second'
  name: string
  description: string
  capacity: number
  images: string[]
  features: string[]
  available: boolean
  createdAt: string
  updatedAt: string
}

export interface ContentDatabase {
  homepage: HomepageContent
  venues: Venue[]
  officeRooms: OfficeRoom[]
  lastUpdated: string
}

const STORAGE_KEY = 'oneestela_cms_data'

const defaultContent: ContentDatabase = {
  homepage: {
    heroTitle: 'Welcome to One Estela Place',
    heroDescription: 'The perfect venue for your special events and celebrations',
    heroImage: '/images/venue-interior.jpg',
    aboutTitle: 'About One Estela Place',
    aboutDescription: 'One Estela Place is a premier event venue that has been hosting memorable celebrations for over a decade. Our stunning architecture and versatile spaces provide the perfect backdrop for weddings, corporate events, and special occasions.',
    ctaText: 'Ready to host your event?',
    ctaButtonText: 'Book Your Event',
    features: [
      {
        id: '1',
        title: 'State-of-the-art Facilities',
        description: 'Modern amenities and equipment for every event need'
      },
      {
        id: '2',
        title: 'Professional Catering',
        description: 'Dedicated events team to ensure every detail is perfect'
      },
      {
        id: '3',
        title: 'Flexible Spaces',
        description: 'Customizable venue layouts for any event type'
      }
    ]
  },
  venues: [
    {
      id: 'venue-1',
      name: 'Grand Ballroom',
      description: 'Elegant ballroom perfect for large celebrations and corporate events',
      capacity: 500,
      images: ['/images/venue-interior.jpg', '/images/venue-chandelier.png'],
      features: ['Air Conditioning', 'Sound System', 'Dance Floor', 'Catering Available'],
      price: 5000,
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'venue-2',
      name: 'Intimate Lounge',
      description: 'Cozy lounge space ideal for intimate gatherings and cocktail parties',
      capacity: 100,
      images: ['/images/cta-background.png'],
      features: ['Bar Setup', 'Lounge Seating', 'Private Entrance'],
      price: 1500,
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  officeRooms: [
    {
      id: 'office-gf-1',
      floor: 'ground',
      name: 'Executive Suite',
      description: 'Premium office space on the ground floor with natural lighting',
      capacity: 20,
      images: ['/images/venue-interior.jpg'],
      features: ['Large Windows', 'Meeting Table', 'Projector'],
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'office-sf-1',
      floor: 'second',
      name: 'Creative Studio',
      description: 'Open-plan office on the second floor perfect for collaborative teams',
      capacity: 30,
      images: ['/images/venue-interior.jpg'],
      features: ['Open Layout', 'Whiteboard Walls', 'Break Area'],
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  lastUpdated: new Date().toISOString()
}

// Initialize storage if empty
function initializeStorage() {
  if (typeof window !== 'undefined') {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContent))
    }
  }
}

export const contentService = {
  // Homepage operations
  getHomepageContent: (): HomepageContent => {
    initializeStorage()
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    return data.homepage
  },

  updateHomepageContent: (updates: Partial<HomepageContent>) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    data.homepage = { ...data.homepage, ...updates }
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'homepage' } }))
  },

  // Venue operations
  getVenues: (): Venue[] => {
    initializeStorage()
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    return data.venues
  },

  getVenueById: (id: string): Venue | undefined => {
    const venues = contentService.getVenues()
    return venues.find(v => v.id === id)
  },

  addVenue: (venue: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    const newVenue: Venue = {
      ...venue,
      id: `venue-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    data.venues.push(newVenue)
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'venues' } }))
    return newVenue
  },

  updateVenue: (id: string, updates: Partial<Venue>) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    const index = data.venues.findIndex((v: Venue) => v.id === id)
    if (index !== -1) {
      data.venues[index] = {
        ...data.venues[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      data.lastUpdated = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'venues', id } }))
    }
  },

  deleteVenue: (id: string) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    data.venues = data.venues.filter((v: Venue) => v.id !== id)
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'venues' } }))
  },

  // Office room operations
  getOfficeRooms: (): OfficeRoom[] => {
    initializeStorage()
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    return data.officeRooms
  },

  getOfficeRoomsByFloor: (floor: 'ground' | 'second'): OfficeRoom[] => {
    const rooms = contentService.getOfficeRooms()
    return rooms.filter(r => r.floor === floor)
  },

  getOfficeRoomById: (id: string): OfficeRoom | undefined => {
    const rooms = contentService.getOfficeRooms()
    return rooms.find(r => r.id === id)
  },

  addOfficeRoom: (room: Omit<OfficeRoom, 'id' | 'createdAt' | 'updatedAt'>) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    const newRoom: OfficeRoom = {
      ...room,
      id: `office-${room.floor}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    data.officeRooms.push(newRoom)
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'officeRooms' } }))
    return newRoom
  },

  updateOfficeRoom: (id: string, updates: Partial<OfficeRoom>) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    const index = data.officeRooms.findIndex((r: OfficeRoom) => r.id === id)
    if (index !== -1) {
      data.officeRooms[index] = {
        ...data.officeRooms[index],
        ...updates,
        updatedAt: new Date().toISOString()
      }
      data.lastUpdated = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'officeRooms', id } }))
    }
  },

  deleteOfficeRoom: (id: string) => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
    data.officeRooms = data.officeRooms.filter((r: OfficeRoom) => r.id !== id)
    data.lastUpdated = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'officeRooms' } }))
  },

  // Get all data
  getAllContent: (): ContentDatabase => {
    initializeStorage()
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(defaultContent))
  },

  // Clear all data (for testing)
  resetContent: () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultContent))
    window.dispatchEvent(new CustomEvent('cms-content-updated', { detail: { type: 'all' } }))
  }
}
