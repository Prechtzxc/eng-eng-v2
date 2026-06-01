"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "../auth/auth-context"

const ChatContext = createContext<any>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<any[]>([])
  const [isChatLoaded, setIsChatLoaded] = useState(false)

  useEffect(() => {
    const savedMessages = localStorage.getItem("mock_chat_messages")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
    setIsChatLoaded(true)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "mock_chat_messages" && e.newValue) {
        setMessages(JSON.parse(e.newValue))
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const sendMessage = (text: string, senderRole: "admin" | "client", clientId: any, clientName: string, isBot: boolean = false, imageUrl?: string) => {
    if (!text.trim() && !imageUrl) return

    const newMessage = {
      id: Date.now() + Math.random(), 
      text,
      sender: senderRole,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      clientId: clientId,
      clientName: clientName, 
      isBot: isBot,
      imageUrl: imageUrl || null,
      isRead: senderRole === "admin", 
      // ✨ ETO YUNG BAGO: Kung admin nag-send, unread pa siya sa client! ✨
      isReadByClient: senderRole === "client" 
    }

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage]
      localStorage.setItem("mock_chat_messages", JSON.stringify(updatedMessages))
      return updatedMessages
    })
  }

  // Para kay Admin 'to
  const markAsRead = (clientId: any) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map(m => 
        (m.clientId === clientId && m.sender === "client") ? { ...m, isRead: true } : m
      )
      localStorage.setItem("mock_chat_messages", JSON.stringify(updatedMessages))
      return updatedMessages
    })
  }

  // ✨ PARA KAY CLIENT 'TO (Pag binuksan niya yung chat, mawawala red dot) ✨
  const markAsReadByClient = (clientId: any) => {
    setMessages((prevMessages) => {
      const updatedMessages = prevMessages.map(m => 
        (m.clientId === clientId && m.sender === "admin") ? { ...m, isReadByClient: true } : m
      )
      localStorage.setItem("mock_chat_messages", JSON.stringify(updatedMessages))
      return updatedMessages
    })
  }

  return (
    <ChatContext.Provider value={{ messages, sendMessage, markAsRead, markAsReadByClient, isChatLoaded }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within a ChatProvider")
  return context
}