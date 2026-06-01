"use client"

import type React from "react"
// FIX: Idinagdag ang useEffect dito
import { useState, useEffect } from "react"
import { useAuth } from "@/src/modules/shared/auth/auth-context"
import { Button } from "@/src/modules/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/modules/shared/components/ui/dialog"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Label } from "@/src/modules/shared/components/ui/label"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

interface SignupDialogProps {
  className?: string
}

export function SignupDialog({ className }: SignupDialogProps) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("") 
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("") 
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [errorMsg, setErrorMsg] = useState("")
  
  const { signup, isLoading } = useAuth()

  // FIX: Listener para kapag pinindot sa Login form yung "Sign up", bubukas 'to
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener("openSignupDialog", handleOpen)
    return () => window.removeEventListener("openSignupDialog", handleOpen)
  }, [])

  // FIX: Function para lumipat sa Login
  const handleSwitchToLogin = () => {
    setOpen(false)
    setTimeout(() => {
      window.dispatchEvent(new Event("openLoginDialog"))
    }, 150) // Slight delay para smooth yung animation
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbersOnly = value.replace(/[^0-9]/g, '')
    if (numbersOnly.length <= 10) {
      setPhoneNumber(numbersOnly)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("") 

    if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
      setErrorMsg("Please fill in all required fields.")
      return
    }

    if (phoneNumber.length !== 10) {
       setErrorMsg("Phone number must be exactly 10 digits (e.g. 9123456789)")
       return
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match!")
      return
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.")
      return
    }

    const formattedPhone = `+63${phoneNumber}`

    const success = await signup(firstName, lastName, email, password, middleName, formattedPhone)

    if (success) {
      setOpen(false)
      window.location.replace("/portal") 
    } else {
      setErrorMsg("Email is already taken. Please use a different one.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val)
      if(!val) setErrorMsg("") 
    }}>
      <DialogTrigger asChild>
        <Button className={`bg-slate-900 text-white hover:bg-slate-800 rounded-md px-6 ${className}`}>
          Sign Up
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] p-8">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-2xl font-black text-slate-900">Create Account</DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Sign up to start booking events at One Estela Place
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium p-3 rounded-md flex items-center gap-2 animate-in zoom-in-95 mb-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-xs font-bold text-slate-600 uppercase tracking-wider">First Name *</Label>
              <Input id="firstName" placeholder="Juan" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11 rounded-md" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Middle Name</Label>
              <Input id="middleName" placeholder="Optional" value={middleName} onChange={(e) => setMiddleName(e.target.value)} className="h-11 rounded-md" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Last Name *</Label>
              <Input id="lastName" placeholder="Dela Cruz" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-11 rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Email Address *</Label>
              <Input id="signup-email" type="email" placeholder="juan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11 rounded-md" />
            </div>
            <div className="space-y-2">
               <Label htmlFor="phoneNumber" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Phone Number *</Label>
               <div className="relative flex items-center">
                 <span className="absolute left-3 text-slate-500 font-bold text-sm select-none pointer-events-none">+63</span>
                 <Input id="phoneNumber" type="text" inputMode="numeric" placeholder="912 345 6789" value={phoneNumber} onChange={handlePhoneChange} required className="h-11 rounded-md pl-11 font-mono text-sm tracking-widest" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="signup-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Create Password *</Label>
               <div className="relative">
                 <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="Min. 6 chars" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 rounded-md pr-10" />
                 <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600" onClick={() => setShowPassword(!showPassword)}>
                   {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                 </Button>
               </div>
             </div>

             <div className="space-y-2">
               <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Confirm Password *</Label>
               <div className="relative">
                 <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Re-type password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-11 rounded-md pr-10" />
                 <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-slate-400 hover:text-slate-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                   {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                 </Button>
               </div>
             </div>
          </div>

          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-md font-bold mt-2" disabled={isLoading}>
            {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating your account...</> : "Complete Sign Up"}
          </Button>

          {/* FIX: Eto na yung hinihingi mong text link! */}
          <div className="text-center text-sm text-slate-500 pt-2">
            Already have an account?{" "}
            <button 
              type="button" 
              onClick={handleSwitchToLogin} 
              className="font-bold text-slate-900 hover:underline hover:text-slate-700 transition-colors"
            >
              Login
            </button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}