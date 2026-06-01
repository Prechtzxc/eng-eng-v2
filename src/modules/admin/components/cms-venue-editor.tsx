'use client'

import React from "react"
import { useState } from 'react'
import { useCMS } from '@admin/contexts/cms-context'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Upload, Plus, Trash2, X } from 'lucide-react'
import type { Venue, VenueContent } from '@shared/lib/content-service'

export function CMSVenueEditor() {
  const { venues, updateVenue, addVenue, deleteVenue } = useCMS()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  const [newVenue, setNewVenue] = useState<Partial<Venue>>({
    name: '',
    description: '',
    capacity: '',
    features: [],
    images: [],
  })

  const handleAddVenue = () => {
    if (newVenue.name && newVenue.description) {
      addVenue({
        name: newVenue.name,
        description: newVenue.description,
        capacity: newVenue.capacity || '100 guests',
        features: newVenue.features || [],
        images: newVenue.images || [],
      })
      setNewVenue({ name: '', description: '', capacity: '', features: [], images: [] })
      setShowNewForm(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, venueId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const venue = venues.find((v) => v.id === venueId)
    if (venue) {
      const newImage = { id: `img-${Date.now()}`, url, alt: file.name, uploadedAt: new Date().toISOString() }
      updateVenue(venueId, { images: [...(venue.images || []), newImage] })
    }
  }

  const handleRemoveImage = (venueId: string, imageId: string) => {
    const venue = venues.find((v) => v.id === venueId)
    if (venue) {
      updateVenue(venueId, { images: venue.images.filter((img) => img.id !== imageId) })
    }
  }

  return (
    <div className="space-y-6">
      <Button onClick={() => setShowNewForm(!showNewForm)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add New Venue
      </Button>

      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Venue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Venue Name" value={newVenue.name} onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })} />
            <Textarea placeholder="Venue Description" value={newVenue.description} onChange={(e) => setNewVenue({ ...newVenue, description: e.target.value })} />
            <Input placeholder="Capacity (e.g., '500 guests')" value={newVenue.capacity} onChange={(e) => setNewVenue({ ...newVenue, capacity: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={handleAddVenue} className="flex-1">
                Create Venue
              </Button>
              <Button onClick={() => setShowNewForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {venues.map((venue) => (
          <Card key={venue.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{venue.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{venue.capacity}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteVenue(venue.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingId === venue.id ? (
                <div className="space-y-3">
                  <Textarea placeholder="Description" value={venue.description} onChange={(e) => updateVenue(venue.id, { description: e.target.value })} />
                  <Input placeholder="Capacity" value={venue.capacity} onChange={(e) => updateVenue(venue.id, { capacity: e.target.value })} />
                  <Button size="sm" onClick={() => setEditingId(null)}>
                    Done Editing
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">{venue.description}</p>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(venue.id)} className="mt-2">
                    Edit Details
                  </Button>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Venue Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {venue.images.map((image) => (
                    <div key={image.id} className="relative group">
                      <div className="bg-gray-100 rounded-lg overflow-hidden h-32">
                        <img src={image.url || "/placeholder.svg"} alt={image.alt} className="w-full h-full object-cover" />
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveImage(venue.id, image.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <label>
                  <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent" asChild>
                    <span>
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </span>
                  </Button>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, venue.id)} hidden />
                </label>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <h4 className="font-medium text-sm">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {venue.features.map((feature, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
