import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface ChatConversation {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  admin_id?: string
  last_message?: string
  last_message_time?: string
  created_at: string
  updated_at: string
  unread_count: number
  is_active: boolean
}

export interface ChatMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: "admin" | "customer"
  sender_name: string
  content: string
  created_at: string
  read_at?: string
}

export interface TypingIndicator {
  id: string
  conversation_id: string
  user_id: string
  user_name: string
  typing: boolean
  updated_at: string
}

// Conversation methods
export async function getConversations() {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("last_message_time", { ascending: false })

    if (error) throw error
    return data as ChatConversation[]
  } catch (error) {
    console.error("Error fetching conversations:", error)
    throw error
  }
}

export async function getConversationById(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("*")
      .eq("id", conversationId)
      .single()

    if (error) throw error
    return data as ChatConversation
  } catch (error) {
    console.error("Error fetching conversation:", error)
    throw error
  }
}

export async function createConversation(
  customerId: string,
  customerName: string,
  customerEmail: string
) {
  try {
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert([
        {
          customer_id: customerId,
          customer_name: customerName,
          customer_email: customerEmail,
          is_active: true,
          unread_count: 0,
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data as ChatConversation
  } catch (error) {
    console.error("Error creating conversation:", error)
    throw error
  }
}

// Message methods
export async function getMessages(conversationId: string) {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (error) throw error
    return data as ChatMessage[]
  } catch (error) {
    console.error("Error fetching messages:", error)
    throw error
  }
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderType: "admin" | "customer",
  senderName: string,
  content: string
) {
  try {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_id: senderId,
          sender_type: senderType,
          sender_name: senderName,
          content,
        },
      ])
      .select()
      .single()

    if (error) throw error

    // Update conversation last message
    await supabase
      .from("chat_conversations")
      .update({
        last_message: content,
        last_message_time: new Date().toISOString(),
      })
      .eq("id", conversationId)

    return data as ChatMessage
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const { error } = await supabase
      .from("chat_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId)

    if (error) throw error
  } catch (error) {
    console.error("Error marking message as read:", error)
    throw error
  }
}

// Typing indicator methods
export async function setTypingStatus(
  conversationId: string,
  userId: string,
  userName: string,
  typing: boolean
) {
  try {
    const { error } = await supabase.from("chat_typing_indicators").upsert([
      {
        conversation_id: conversationId,
        user_id: userId,
        user_name: userName,
        typing,
        updated_at: new Date().toISOString(),
      },
    ])

    if (error) throw error
  } catch (error) {
    console.error("Error setting typing status:", error)
    throw error
  }
}

// Realtime subscriptions
export function subscribeToMessages(
  conversationId: string,
  callback: (message: ChatMessage) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as ChatMessage)
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

export function subscribeToConversations(callback: (conversation: ChatConversation) => void) {
  const channel = supabase
    .channel("conversations")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_conversations",
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new as ChatConversation)
        }
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}

export function subscribeToTypingIndicators(
  conversationId: string,
  callback: (typingUsers: string[]) => void
) {
  const channel = supabase
    .channel(`typing:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "chat_typing_indicators",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        // Get all active typing indicators
        supabase
          .from("chat_typing_indicators")
          .select("user_name")
          .eq("conversation_id", conversationId)
          .eq("typing", true)
          .then(({ data }) => {
            if (data) {
              callback(data.map((row) => row.user_name))
            }
          })
      }
    )
    .subscribe()

  return () => {
    channel.unsubscribe()
  }
}
