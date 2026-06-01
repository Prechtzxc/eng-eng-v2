"use client"
import React, { createContext, useContext, useState } from "react"

export type StaffAccount = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  role: "admin" | "staff" | "manager";
  status: "active" | "inactive";
  lastActive: string;
}

const mockStaffData = {
  staff: [
    { 
      id: "1", 
      firstName: "System", 
      lastName: "Admin", 
      email: "admin@oneestela.com", 
      position: "Administrator",
      role: "admin", 
      status: "active", 
      lastActive: "Just now" 
    },
    { 
      id: "2", 
      firstName: "Front", 
      lastName: "Desk", 
      email: "frontdesk@oneestela.com", 
      position: "Front Desk Officer",
      role: "staff", 
      status: "active", 
      lastActive: "2 hours ago" 
    }
  ]
}

const StaffContext = createContext<any>(mockStaffData)

export const StaffProvider = ({ children }: { children: React.ReactNode }) => {
  const [staff, setStaff] = useState(mockStaffData.staff)

  return (
    <StaffContext.Provider value={{ staff, setStaff }}>
      {children}
    </StaffContext.Provider>
  )
}

export const useStaff = () => useContext(StaffContext)