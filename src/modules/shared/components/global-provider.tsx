"use client"

import type React from "react"
import { AuthProvider } from "@/src/modules/shared/auth/auth-context"
import { ChatProvider } from "@/src/modules/shared/contexts/chat-context"
import { BookingProvider } from "@/src/modules/client/contexts/booking-context"
import { Toaster } from "@/src/modules/shared/components/ui/toaster"

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {/* Tinanggal muna natin yung mga wala pang files tulad ng MessageProvider at PaymentProofProvider */}
      <ChatProvider>
        <BookingProvider>
          {children}
          <Toaster />
        </BookingProvider>
      </ChatProvider>
    </AuthProvider>
  )
}