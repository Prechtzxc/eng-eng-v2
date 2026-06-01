"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/modules/shared/components/ui/dialog"
import { ScrollArea } from "@/src/modules/shared/components/ui/scroll-area"

interface TermsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TermsDialog({ open, onOpenChange }: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>One Estela Place - Event Venue Rental Agreement</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6 text-sm">
            <div className="text-center border-b pb-4">
              <p className="font-semibold">Effective Date: March 15, 2019</p>
              <p className="mt-2 text-gray-600">
                By proceeding with a booking at One Estela Place, you acknowledge that you have read, understood, and
                agreed to the following terms and regulations:
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">1. Booking Confirmation & Initial Payment</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>
                    A non-refundable initial payment of 30% of the total rental fee is required within 48 hours of
                    submitting a reservation request to confirm your booking.
                  </li>
                  <li>Failure to make this initial payment will result in automatic cancellation of the booking.</li>
                  <li>Remaining balance must be settled at least 7 days before the event date.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">2. Cancellation Policy</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>
                    Cancellations made 14 days or more before the event will not be charged any additional fees, but the
                    initial payment remains non-refundable.
                  </li>
                  <li>
                    Cancellations made less than 14 days before the event will result in a 50% charge of the total
                    rental fee.
                  </li>
                  <li>No-shows or same-day cancellations will be charged the full amount.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">3. Venue Usage Rules</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>
                    The venue is strictly for event space rental only. We do not provide catering, decoration, or event
                    management services.
                  </li>
                  <li>
                    Clients are responsible for bringing in and managing their own suppliers (e.g., caterers, stylists).
                  </li>
                  <li>
                    Event organizers must ensure all equipment, decor, and personal items are removed immediately after
                    the event.
                  </li>
                  <li>Any damages to the venue or its facilities will be charged to the client.</li>
                  <li>Smoking inside the venue is strictly prohibited.</li>
                  <li>Noise levels must be kept within reasonable limits and comply with local ordinances.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">4. Time and Overtime Policy</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>
                    Bookings are based on the agreed rental time. Early setup or overtime use must be pre-approved and
                    may incur additional charges.
                  </li>
                  <li>Going beyond the reserved time without notice will result in overtime fees charged per hour.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">5. Changes and Rescheduling</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>
                    One-time rescheduling is allowed if requested at least 10 days in advance, subject to availability.
                  </li>
                  <li>Additional rescheduling or changes within 10 days may incur processing fees.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">6. Force Majeure</h3>
                <p className="text-gray-700">
                  One Estela Place will not be liable for cancellations or changes caused by events beyond our control,
                  including natural disasters, government restrictions, or other force majeure events. In such cases, we
                  will offer a rescheduling option without penalty.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">7. Liability and Conduct</h3>
                <ul className="space-y-2 text-gray-700 list-disc list-inside">
                  <li>Clients and their guests are expected to behave in a respectful and responsible manner.</li>
                  <li>
                    One Estela Place is not liable for any injury, theft, or loss of personal property during the event.
                  </li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3 text-green-600">✅ Agreement Required</h3>
                <p className="text-gray-700 mb-2">
                  By checking the box during the reservation process, you confirm that you:
                </p>
                <ul className="space-y-1 text-gray-700 list-disc list-inside">
                  <li>Have read and agree to these terms</li>
                  <li>Understand the payment, cancellation, and usage policies</li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
