const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    sendMessage(input, "user") // Context will handle the auto-reply now!
    setInput("")
  }