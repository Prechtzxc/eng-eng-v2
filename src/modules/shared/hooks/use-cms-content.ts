'use client'

import { useEffect, useState, useCallback } from 'react'
import { contentService, HomepageContent, Venue, OfficeRoom, ContentDatabase } from '@shared/lib/content-service'

export function useHomepageContent() {
  const [content, setContent] = useState<HomepageContent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    try {
      const data = contentService.getHomepageContent()
      setContent(data)
    } catch (error) {
      console.error('Error loading homepage content:', error)
    } finally {
      setIsLoading(false)
    }

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.type === 'homepage' || customEvent.detail?.type === 'all') {
        try {
          const data = contentService.getHomepageContent()
          setContent(data)
        } catch (error) {
          console.error('Error updating homepage content:', error)
        }
      }
    }

    window.addEventListener('cms-content-updated', handleUpdate)
    return () => window.removeEventListener('cms-content-updated', handleUpdate)
  }, [])

  const updateContent = useCallback((updates: Partial<HomepageContent>) => {
    contentService.updateHomepageContent(updates)
  }, [])

  return { content, isLoading, updateContent }
}

export function useVenues() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    try {
      const data = contentService.getVenues()
      setVenues(data)
    } catch (error) {
      console.error('Error loading venues:', error)
    } finally {
      setIsLoading(false)
    }

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.type === 'venues' || customEvent.detail?.type === 'all') {
        try {
          const data = contentService.getVenues()
          setVenues(data)
        } catch (error) {
          console.error('Error updating venues:', error)
        }
      }
    }

    window.addEventListener('cms-content-updated', handleUpdate)
    return () => window.removeEventListener('cms-content-updated', handleUpdate)
  }, [])

  return { venues, isLoading }
}

export function useOfficeRooms() {
  const [rooms, setRooms] = useState<OfficeRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    try {
      const data = contentService.getOfficeRooms()
      setRooms(data)
    } catch (error) {
      console.error('Error loading office rooms:', error)
    } finally {
      setIsLoading(false)
    }

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.type === 'officeRooms' || customEvent.detail?.type === 'all') {
        try {
          const data = contentService.getOfficeRooms()
          setRooms(data)
        } catch (error) {
          console.error('Error updating office rooms:', error)
        }
      }
    }

    window.addEventListener('cms-content-updated', handleUpdate)
    return () => window.removeEventListener('cms-content-updated', handleUpdate)
  }, [])

  return { rooms, isLoading }
}

export function useOfficeRoomsByFloor(floor: 'ground' | 'second') {
  const [rooms, setRooms] = useState<OfficeRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    try {
      const data = contentService.getOfficeRoomsByFloor(floor)
      setRooms(data)
    } catch (error) {
      console.error('Error loading office rooms:', error)
    } finally {
      setIsLoading(false)
    }

    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail?.type === 'officeRooms' || customEvent.detail?.type === 'all') {
        try {
          const data = contentService.getOfficeRoomsByFloor(floor)
          setRooms(data)
        } catch (error) {
          console.error('Error updating office rooms:', error)
        }
      }
    }

    window.addEventListener('cms-content-updated', handleUpdate)
    return () => window.removeEventListener('cms-content-updated', handleUpdate)
  }, [floor])

  return { rooms, isLoading }
}

export function useAllContent() {
  const [content, setContent] = useState<ContentDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    try {
      const data = contentService.getAllContent()
      setContent(data)
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setIsLoading(false)
    }

    const handleUpdate = () => {
      try {
        const data = contentService.getAllContent()
        setContent(data)
      } catch (error) {
        console.error('Error updating content:', error)
      }
    }

    window.addEventListener('cms-content-updated', handleUpdate)
    return () => window.removeEventListener('cms-content-updated', handleUpdate)
  }, [])

  return { content, isLoading }
}
