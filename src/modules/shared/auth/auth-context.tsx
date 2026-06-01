"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const AuthContext = createContext<any>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("mock_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  // ✨ ULTIMATE DEMO HACK: I-lista mo na dito yung mga gagamitin niyong email sa defense! ✨
  const demoUsers: Record<string, string> = {
    "rafkarloy52@gmail.com": "Raffy",       // Pag tinype 'to, "Raffy" agad ang pangalan!
    "charmee@gmail.com": "Charmee",         // Pwede mong palitan kung anong gusto niyo
    "christian@gmail.com": "Christian",
    "johndoe@gmail.com": "John Doe"
  }

  const login = (email: string) => {
    const cleanEmail = email.toLowerCase().trim()
    let fakeUser;

    if (cleanEmail.includes("admin")) {
      fakeUser = { 
        id: "admin-999", 
        name: "Admin User", 
        email: cleanEmail, 
        role: "admin" 
      }
    } else {
      // ✨ Tingnan kung nasa Demo Hack list natin yung email ✨
      // Kung nandun, yung assigned name ang gagamitin. Kung wala, puputulin na lang niya yung email.
      const matchedName = demoUsers[cleanEmail] || cleanEmail.split('@')[0]

      fakeUser = { 
        id: cleanEmail, 
        name: matchedName, 
        email: cleanEmail, 
        role: "client" 
      }
    }

    setUser(fakeUser)
    localStorage.setItem("mock_user", JSON.stringify(fakeUser))
    router.push(fakeUser.role === "admin" ? "/dashboard" : "/portal")
  }

  const signup = (name: string, email: string) => {
    const cleanEmail = email.toLowerCase().trim()
    const role = cleanEmail.includes("admin") ? "admin" : "client"
    
    const newUser = { 
      id: cleanEmail, 
      name: name, 
      email: cleanEmail, 
      role: role 
    }

    setUser(newUser)
    localStorage.setItem("mock_user", JSON.stringify(newUser))
    router.push(newUser.role === "admin" ? "/dashboard" : "/portal")
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("mock_user")
    router.push("/") 
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}