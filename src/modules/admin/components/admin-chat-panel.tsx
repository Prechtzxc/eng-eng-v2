"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { useChat } from "@/src/modules/shared/contexts/chat-context"
import { Button } from "@/src/modules/shared/components/ui/button"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/src/modules/shared/components/ui/dialog"
import { Send, User, ShieldCheck, Clock, MessageSquare, Paperclip, FileImage } from "lucide-react"

export default function AdminChatPanel() {
  const { messages, sendMessage, markAsRead } = useChat()
  const [input, setInput] = useState("")
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [viewImage, setViewImage] = useState<string | null>(null)

  useEffect(() => {
    if (selectedClientId) {
      markAsRead(selectedClientId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId])

  const chatThreads = useMemo(() => {
    const groups: Record<string, { name: string, lastMessage: string, timestamp: number, hasUnread: boolean, hasUserMessage: boolean }> = {}
    
    messages.forEach(m => {
      let threadId = ""
      let threadName = ""

      if (m.sender === "user") {
        threadId = m.senderId
        threadName = m.senderName
      } else if (m.sender === "admin" || m.sender === "bot") {
        threadId = m.targetId || ""
      }

      if (!threadId || threadId === "admin" || threadId === "system") return;

      if (!groups[threadId]) {
        groups[threadId] = {
          name: threadName || "Client",
          lastMessage: m.imageUrl ? "[Sent an attachment]" : m.text,
          timestamp: m.timestamp.getTime(),
          hasUnread: m.sender === "user" && !m.isRead,
          hasUserMessage: m.sender === "user" 
        }
      } else {
        groups[threadId].lastMessage = m.imageUrl ? "[Sent an attachment]" : m.text
        groups[threadId].timestamp = m.timestamp.getTime()
        if (m.sender === "user" && !m.isRead) {
          groups[threadId].hasUnread = true
        }
        if (threadName) {
          groups[threadId].name = threadName 
        }
        if (m.sender === "user") {
          groups[threadId].hasUserMessage = true
        }
      }
    })
    
    return Object.entries(groups)
      .filter(([_, data]) => data.hasUserMessage)
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
  }, [messages])

  useEffect(() => {
    if (!selectedClientId && chatThreads.length > 0) {
      setSelectedClientId(chatThreads[0][0])
    } else if (chatThreads.length === 0) {
      setSelectedClientId(null)
    }
  }, [chatThreads, selectedClientId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, selectedClientId])

  const activeMessages = messages.filter(m => 
    m.senderId === selectedClientId || m.targetId === selectedClientId
  )

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedClientId) return
    sendMessage(input, "admin", selectedClientId) 
    setInput("")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedClientId) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target?.result as string
      sendMessage("Sent an attachment", "admin", selectedClientId, false, base64String)
    }
    reader.readAsDataURL(file)
    
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const selectedClientName = chatThreads.find(t => t[0] === selectedClientId)?.[1].name || "Client"

  return (
    <div className="flex h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      
      {/* LEFT SIDEBAR: Messenger Thread List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50 flex-shrink-0">
        <div className="p-5 border-b border-gray-200 bg-white">
          <h2 className="font-bold text-gray-900 text-lg">Conversations</h2>
          <div className="flex items-center text-xs text-emerald-600 mt-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse border border-white"></span>
            Live Sync Active
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-1" style={{ scrollbarWidth: 'thin' }}>
          {chatThreads.length > 0 ? (
            chatThreads.map(([clientId, data]) => {
              const isSelected = selectedClientId === clientId
              return (
                <div 
                  key={clientId}
                  onClick={() => setSelectedClientId(clientId)}
                  className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all relative overflow-hidden ${
                    isSelected ? 'bg-[#ea580c] text-white shadow-md' : 'bg-transparent hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 text-gray-900'
                  }`}
                >
                  {data.hasUnread && !isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-rose-500 rounded-r-md"></div>
                  )}

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm uppercase shadow-sm ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-orange-100 text-[#ea580c]'
                  }`}>
                    {data.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden flex-1 pl-1">
                    <p className={`text-sm truncate ${data.hasUnread && !isSelected ? 'font-extrabold text-black' : 'font-semibold'}`}>{data.name}</p>
                    <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-orange-100' : (data.hasUnread ? 'text-gray-900 font-bold' : 'text-gray-500')}`}>
                      {data.lastMessage}
                    </p>
                  </div>
                  {data.hasUnread && !isSelected && (
                    <div className="w-2.5 h-2.5 bg-rose-500 rounded-full flex-shrink-0 shadow-sm border border-white"></div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-6 text-center text-sm text-gray-500 mt-10">No active conversations.</div>
          )}
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedClientId ? (
          <>
            <div className="p-4 md:p-5 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm z-10">
               <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#ea580c] font-bold uppercase shadow-sm">
                  {selectedClientName.charAt(0)}
               </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{selectedClientName}</h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                  Client <span className="w-1 h-1 bg-gray-300 rounded-full"></span> Active
                </p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#fafaf9]" ref={scrollRef} style={{ scrollbarWidth: 'thin' }}>
              {activeMessages.map((msg) => {
                const isAdminOrBot = msg.sender === "admin" || msg.sender === "bot"
                
                return (
                  <div key={msg.id} className={`flex w-full ${isAdminOrBot ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`flex max-w-[85%] lg:max-w-[70%] gap-2 md:gap-3 items-end ${isAdminOrBot ? 'flex-row-reverse' : 'flex-row'}`}>
                      
                      <div className="shrink-0 hidden sm:block">
                        {isAdminOrBot ? (
                          <div className="w-8 h-8 bg-orange-100 text-[#ea580c] rounded-full flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {selectedClientName.charAt(0)}
                          </div>
                        )}
                      </div>

                      <div className={`flex flex-col ${isAdminOrBot ? 'items-end' : 'items-start'}`}>
                        <div className={`w-fit p-3 md:p-4 rounded-2xl shadow-sm break-words flex flex-col ${
                            isAdminOrBot 
                              ? "bg-[#ea580c] text-white rounded-br-sm" 
                              : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                          }`}
                        >
                          {msg.imageUrl && (
                            <div className="mb-2 relative rounded-xl overflow-hidden bg-black/5">
                               <img 
                                 src={msg.imageUrl} 
                                 alt="attachment" 
                                 className="max-w-full max-h-[300px] object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity" 
                                 onClick={() => setViewImage(msg.imageUrl || null)}
                               />
                            </div>
                          )}
                          <p className="text-[14px] md:text-[15px] leading-relaxed">{msg.text}</p>
                        </div>
                        <span className={`text-[10px] mt-1.5 flex items-center gap-1 font-medium ${isAdminOrBot ? "text-slate-400" : "text-gray-400"}`}>
                          <Clock className="w-3 h-3" />
                          {msg.sender === "bot" ? "Automated Support" : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="p-4 md:p-5 bg-white border-t border-gray-200">
              <form onSubmit={handleSend} className="flex gap-3 max-w-5xl mx-auto items-center relative">
                
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="text-slate-400 hover:text-[#ea580c] hover:bg-orange-50 rounded-full h-12 w-12 shrink-0 transition-colors"
                >
                   <Paperclip className="w-5 h-5" />
                </Button>

                <Input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  placeholder={`Reply to ${selectedClientName}...`} 
                  className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-[#ea580c] focus-visible:ring-2 rounded-full px-5 h-12 text-[15px]" 
                />
                
                <Button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-full h-12 px-6 shadow-md transition-transform active:scale-[0.95] disabled:opacity-50 shrink-0"
                >
                  <Send size={18} className="mr-2" />Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-[#fafaf9] animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-orange-100">
              <MessageSquare size={40} className="text-[#ea580c] opacity-80" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No Conversation Selected</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-[250px] text-center">
              Select a client from the sidebar to view their messages and reply.
            </p>
          </div>
        )}
      </div>

      {/* FULLSCREEN IMAGE VIEWER MODAL PARA KAY ADMIN */}
      <Dialog open={!!viewImage} onOpenChange={(open) => !open && setViewImage(null)}>
        {/* FIX: Ginaya yung modal size at style sa Client side */}
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-6 bg-white rounded-3xl border-none shadow-2xl z-[100]">
          <DialogHeader className="shrink-0 mb-4 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileImage className="w-5 h-5 text-[#ea580c]" /> Image Attachment
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 w-full h-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 relative group">
            {viewImage && (
              <img src={viewImage} alt="Fullscreen Attachment" className="w-full h-full object-contain drop-shadow-sm" />
            )}
          </div>
          <div className="shrink-0 mt-4 flex justify-end">
             <Button variant="outline" onClick={() => setViewImage(null)} className="rounded-xl font-bold px-8 h-12 border-slate-200 text-slate-700">Close Viewer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}