"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/src/modules/shared/components/ui/input"
import { Button } from "@/src/modules/shared/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/modules/shared/components/ui/select"
import {
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
} from "lucide-react"

type CustomerStatus = "Active" | "Inactive"

type CustomerAccount = {
  id: string | number
  name: string
  email: string
  phone: string
  status: CustomerStatus
  createdAt?: string
}

const FALLBACK_CUSTOMERS: CustomerAccount[] = [
  {
    id: 1,
    name: "James Wilson",
    email: "james.wilson@email.com",
    phone: "+63 917 123 4567",
    status: "Active",
  },
  {
    id: 2,
    name: "Emily Brown",
    email: "emily.brown@email.com",
    phone: "+63 918 234 5678",
    status: "Active",
  },
  {
    id: 3,
    name: "Robert Taylor",
    email: "robert.taylor@email.com",
    phone: "+63 919 345 6789",
    status: "Active",
  },
  {
    id: 4,
    name: "Lisa Anderson",
    email: "lisa.anderson@email.com",
    phone: "+63 920 456 7890",
    status: "Active",
  },
  {
    id: 5,
    name: "Michael Garcia",
    email: "michael.garcia@email.com",
    phone: "+63 921 567 8901",
    status: "Inactive",
  },
]

const USER_STORAGE_KEYS = [
  "oneestela_users_v1",
  "oneestela_customers_v1",
  "oneestela_registered_customers_v1",
  "oneestela_auth_users_v1",
]

function normalizeStatus(status?: string): CustomerStatus {
  return String(status || "").trim().toLowerCase() === "inactive" ? "Inactive" : "Active"
}

function getName(user: any) {
  const fullName =
    user?.name ||
    user?.fullName ||
    user?.customerName ||
    `${user?.firstName || ""} ${user?.lastName || ""}`

  return String(fullName || "Unnamed Customer").trim()
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const first = words[0]?.charAt(0) || ""
  const second = words.length > 1 ? words[words.length - 1]?.charAt(0) : ""

  return `${first}${second}`.toUpperCase() || "CU"
}

function formatDate(date?: string) {
  if (!date) return "No date"

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(parsed)
}

function getStatusBadgeClass(status: CustomerStatus) {
  return status === "Active"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-slate-200 bg-slate-100 text-slate-500"
}

function normalizeCustomer(user: any, index: number): CustomerAccount {
  const name = getName(user)

  return {
    id: user?.id || user?.uid || user?.customerId || user?.email || index + 1,
    name,
    email: String(user?.email || "No email provided"),
    phone: String(user?.phone || user?.contactNumber || user?.mobile || "No phone provided"),
    status: normalizeStatus(user?.status),
    createdAt: user?.createdAt || user?.dateCreated || user?.registeredAt,
  }
}

function removeDuplicateCustomers(customers: CustomerAccount[]) {
  const map = new Map<string, CustomerAccount>()

  customers.forEach((customer) => {
    const key = customer.email.toLowerCase()

    if (!map.has(key)) {
      map.set(key, customer)
    }
  })

  return Array.from(map.values())
}

function loadCustomersFromLocalStorage() {
  if (typeof window === "undefined") return FALLBACK_CUSTOMERS

  const customers: CustomerAccount[] = []

  USER_STORAGE_KEYS.forEach((key) => {
    const raw = window.localStorage.getItem(key)
    if (!raw) return

    try {
      const parsed = JSON.parse(raw)
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.users)
          ? parsed.users
          : Array.isArray(parsed?.customers)
            ? parsed.customers
            : []

      list.forEach((item: any, index: number) => {
        const role = String(item?.role || item?.userType || item?.type || "customer").toLowerCase()
        const isCustomer = !role || role.includes("customer") || role.includes("client") || role.includes("user")

        if (isCustomer) {
          customers.push(normalizeCustomer(item, index))
        }
      })
    } catch {
      // Ignore invalid LocalStorage item.
    }
  })

  return customers.length > 0 ? removeDuplicateCustomers(customers) : FALLBACK_CUSTOMERS
}

export default function UsersPage() {
  const [customers, setCustomers] = useState<CustomerAccount[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | CustomerStatus>("all")

  useEffect(() => {
    setCustomers(loadCustomersFromLocalStorage())
  }, [])

  const filteredCustomers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return customers
      .filter((customer) => {
        const matchesStatus = statusFilter === "all" || customer.status === statusFilter

        const searchableText = [
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.status,
          customer.createdAt,
        ]
          .join(" ")
          .toLowerCase()

        const matchesSearch = !keyword || searchableText.includes(keyword)

        return matchesStatus && matchesSearch
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "Active" ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [customers, searchTerm, statusFilter])

  return (
    <div className="mx-auto w-full max-w-[1450px] animate-in fade-in duration-500 p-5 md:p-8 xl:p-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-orange-600">
            ADMIN USERS
          </p>

          <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
            User Information
          </h1>

          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
            Read-only view of registered customer accounts and contact details.
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search user..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-11 rounded-full border-slate-200 bg-white pl-10 pr-4 text-sm font-bold shadow-sm sm:w-[300px]"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | CustomerStatus)}
        >
          <SelectTrigger className="h-11 rounded-full bg-white text-sm font-bold shadow-sm sm:w-[170px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>

          <SelectContent className="rounded-xl shadow-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {(searchTerm || statusFilter !== "all") && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
            }}
            className="h-11 rounded-full px-5 font-bold"
          >
            Clear
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight text-slate-950">
          Customer Directory
        </h2>
        <p className="text-sm font-semibold text-slate-500">
          Showing {filteredCustomers.length} of {customers.length} customer
          {customers.length === 1 ? "" : "s"}.
        </p>
      </div>

      {filteredCustomers.length > 0 ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="hidden border-b border-slate-200 bg-slate-50/80 px-6 py-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 lg:grid lg:grid-cols-[1.5fr_1.7fr_1.2fr_1fr_.8fr] lg:items-center lg:gap-4">
            <div>Customer Name</div>
            <div>Email Address</div>
            <div>Phone Number</div>
            <div>Registered</div>
            <div className="text-right">Status</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="grid gap-4 px-6 py-5 transition-colors hover:bg-orange-50/30 lg:grid-cols-[1.5fr_1.7fr_1.2fr_1fr_.8fr] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-black uppercase text-orange-700">
                      {getInitials(customer.name)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-lg font-black text-slate-950">
                        {customer.name}
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        Customer Account
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-600">
                  <Mail className="h-4 w-4 flex-shrink-0 text-orange-600" />
                  <span className="truncate">{customer.email}</span>
                </div>

                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-600">
                  <Phone className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{customer.phone}</span>
                </div>

                <div className="flex min-w-0 items-center gap-2 text-sm font-bold text-slate-700">
                  <UserRound className="h-4 w-4 flex-shrink-0 text-orange-600 lg:hidden" />
                  <span className="truncate">{formatDate(customer.createdAt)}</span>
                </div>

                <div className="lg:text-right">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusBadgeClass(
                      customer.status
                    )}`}
                  >
                    {customer.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-14 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
            <Users className="h-8 w-8" />
          </div>

          <h3 className="text-xl font-black text-slate-700">No users found</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {searchTerm || statusFilter !== "all"
              ? "Try clearing your filters or search keyword."
              : "Registered customers will appear here once available."}
          </p>
        </div>
      )}
    </div>
  )
}