'use client'

import React from "react"
import { useState } from 'react'
import { useCMS } from '@admin/contexts/cms-context'
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card'
import { Button } from '@shared/components/ui/button'
import { Input } from '@shared/components/ui/input'
import { Textarea } from '@shared/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs'
import { Upload, Plus, Trash2, X } from 'lucide-react'
import type { OfficeRoom, OfficeRoomContent } from '@shared/lib/content-service'

export function CMSOfficeRoomEditor() {
  const { officeRoomsGround, officeRoomsSecond, updateOfficeRoom, addOfficeRoom, deleteOfficeRoom } = useCMS()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newFloor, setNewFloor] = useState<'ground' | 'second'>('ground')

  const [newRoom, setNewRoom] = useState<Partial<OfficeRoom>>({
    name: '',
    description: '',
    features: [],
    images: [],
  })

  const handleAddRoom = () => {
    if (newRoom.name && newRoom.description) {
      addOfficeRoom({
        floor: newFloor,
        name: newRoom.name,
        description: newRoom.description,
        features: newRoom.features || [],
        images: newRoom.images || [],
      })
      setNewRoom({ name: '', description: '', features: [], images: [] })
      setShowNewForm(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, roomId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const room = (officeRoomsGround || []).find((r: any) => r.id === roomId) || (officeRoomsSecond || []).find((r: any) => r.id === roomId)
    if (room) {
      const newImage = { id: `img-${Date.now()}`, url, alt: file.name, uploadedAt: new Date().toISOString() }
      updateOfficeRoom(roomId, { images: [...(room.images || []), newImage] })
    }
  }

  const handleRemoveImage = (roomId: string, imageId: string) => {
    const room = (officeRoomsGround || []).find((r: any) => r.id === roomId) || (officeRoomsSecond || []).find((r: any) => r.id === roomId)
    if (room) {
      updateOfficeRoom(roomId, { images: room.images.filter((img: any) => img.id !== imageId) })
    }
  }

  const RoomCard = ({ room }: { room: OfficeRoom }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{room.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{room.floor === 'ground' ? 'Ground Floor' : 'Second Floor'}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => deleteOfficeRoom(room.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingId === room.id ? (
          <div className="space-y-3">
            <Textarea placeholder="Description" value={room.description} onChange={(e) => updateOfficeRoom(room.id, { description: e.target.value })} />
            <Button size="sm" onClick={() => setEditingId(null)}>
              Done Editing
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">{room.description}</p>
            <Button size="sm" variant="outline" onClick={() => setEditingId(room.id)} className="mt-2">
              Edit Details
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium text-sm">Room Images</h4>
          <div className="grid grid-cols-2 gap-4">
            {(room.images || []).map((image) => (
              <div key={image.id} className="relative group">
                <div className="bg-gray-100 rounded-lg overflow-hidden h-32">
                  <img src={image.url || "/placeholder.svg"} alt={image.alt} className="w-full h-full object-cover" />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                  onClick={() => handleRemoveImage(room.id, image.id)}
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
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, room.id)} hidden />
          </label>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <h4 className="font-medium text-sm">Features</h4>
          <div className="flex flex-wrap gap-2">
            {(room.features || []).map((feature, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                {feature}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="ground" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="ground">Ground Floor</TabsTrigger>
        <TabsTrigger value="second">Second Floor</TabsTrigger>
      </TabsList>

      <TabsContent value="ground" className="space-y-4 mt-6">
        <Button onClick={() => { setShowNewForm(!showNewForm); setNewFloor('ground') }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Ground Floor Room
        </Button>

        {showNewForm && newFloor === 'ground' && (
          <Card>
            <CardHeader>
              <CardTitle>Add Ground Floor Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Room Name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} />
              <Textarea placeholder="Room Description" value={newRoom.description} onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={handleAddRoom} className="flex-1">
                  Add Room
                </Button>
                <Button onClick={() => setShowNewForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {(officeRoomsGround || []).map((room: any) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="second" className="space-y-4 mt-6">
        <Button onClick={() => { setShowNewForm(!showNewForm); setNewFloor('second') }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Second Floor Room
        </Button>

        {showNewForm && newFloor === 'second' && (
          <Card>
            <CardHeader>
              <CardTitle>Add Second Floor Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Room Name" value={newRoom.name} onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })} />
              <Textarea placeholder="Room Description" value={newRoom.description} onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={handleAddRoom} className="flex-1">
                  Add Room
                </Button>
                <Button onClick={() => setShowNewForm(false)} variant="outline">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* NILAGYAN KO NA NG SAFETY NET YUNG SECOND FLOOR MAP! */}
          {(officeRoomsSecond || []).map((room: any) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </TabsContent>
      {/* BINURA KO NA RIN YUNG NA-DUPLICATE NA SECOND FLOOR TABS! */}
    </Tabs>
  )
}