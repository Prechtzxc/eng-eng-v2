import { Message } from "../contexts/chat-context"

let channel: BroadcastChannel | null = null;

export function connectToChatSocket(onMessageReceived: (msg: Message) => void) {
  if (typeof window === "undefined") return null;
  
  if (!channel) {
    channel = new BroadcastChannel("capstone_live_chat");
  }

  channel.onmessage = (event) => {
    onMessageReceived(event.data);
  };

  return channel;
}

export function sendSocketMessage(message: Message) {
  if (typeof window === "undefined") return;
  
  if (!channel) {
    channel = new BroadcastChannel("capstone_live_chat");
  }
  
  channel.postMessage(message); 
}