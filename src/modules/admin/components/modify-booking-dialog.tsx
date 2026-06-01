"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/modules/shared/components/ui/dialog"
import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/modules/shared/components/ui/select"
import { Textarea } from "@/src/modules/shared/components/ui/textarea"
import { Calendar } from "@/src/modules/shared/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/modules/shared/components/ui/tabs"
import { useToast } from "@/src/modules/shared/hooks/use-toast"

interface ModifyBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: any
  onSave: (updatedBooking: any) => void
}

export function ModifyBookingDialog({ open, onOpenChange, booking, onSave }: ModifyBookingDialogProps) {
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(booking ? new Date(booking.date) : undefined)
  const [bookingData, setBookingData] = useState({
    eventName: booking?.eventName || "",
    guestCount: booking?.guestCount?.toString() || "",
    startTime: booking?.startTime || "",
    endTime: booking?.endTime || "",
    specialRequests: booking?.specialRequests || "",
  })

  const availableTimes = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
  ]

  const handleSaveChanges = () => {
    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select an event date",
        variant: "destructive",
      })
      return
    }

    const updatedBooking = {
      ...booking,
      eventName: bookingData.eventName,
      guestCount: Number.parseInt(bookingData.guestCount),
      date: selectedDate.toISOString().split("T")[0],
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      specialRequests: bookingData.specialRequests,
      modifiedAt: new Date().toISOString(),
    }

    onSave(updatedBooking)
  }

  // Check if the booking date is within 10 days (for rescheduling policy)
  const isWithin10Days = booking
    ? (new Date(booking.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 10
    : false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modify Booking</DialogTitle>
          <DialogDescription>
            Update the details of your booking. Changes are subject to availability and venue policies.
          </DialogDescription>
        </DialogHeader>

        {isWithin10Days && (
          <div className="rounded-md bg-amber-50 p-4 mb-4">
            <p className="text-amber-800 font-medium">
              Note: Your event is within 10 days. Changes may incur additional fees and are subject to approval.
            </p>
          </div>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="datetime">Date & Time</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Event Name</Label>
                <Input
                  id="eventName"
                  placeholder="Enter event name"
                  value={bookingData.eventName}
                  onChange={(e) => setBookingData({ ...bookingData, eventName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guestCount">Expected Guests</Label>
                <Input
                  id="guestCount"
                  type="number"
                  placeholder="Number of guests"
                  value={bookingData.guestCount}
                  onChange={(e) => setBookingData({ ...bookingData, guestCount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  placeholder="Any special requirements, decorations, catering preferences, etc."
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="datetime" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label className="text-base font-medium">Select Date</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Select
                    value={bookingData.startTime}
                    onValueChange={(value) => setBookingData({ ...bookingData, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Select
                    value={bookingData.endTime}
                    onValueChange={(value) => setBookingData({ ...bookingData, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimes.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedDate && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Selected Date</h4>
                    <p className="text-sm text-gray-600">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
