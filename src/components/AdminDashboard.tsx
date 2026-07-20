'use client'
import logo from "../../public/logo.png"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'
import {
  Users, CheckCircle, Clock, XCircle, Car,
  FileText, LayoutDashboard, ChevronRight,
  LogOut, Menu, Shield, TrendingUp, ExternalLink,
  DollarSign, Activity, UserCheck, CreditCard
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useDispatch } from 'react-redux'
import { setUserData } from '@/redux/userSlice'
import { useRouter } from 'next/navigation'
import AdminPricingReviewModal from './AdminPricingReviewModal'

type Tab = 'overview' | 'partners' | 'kyc' | 'vehicles' | 'rides'

type PartnerReview = {
  _id: string
  name: string
  email: string
  vehicleType?: string | null
}

type RideBooking = {
  _id: string
  userName: string
  userEmail: string
  partnerName: string
  partnerEmail: string
  vehicleType: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalFare: number
  platformFee: number
  partnerEarning: number
  distanceKm: number
  createdAt: string
}

type DashboardData = {
  totalPartners: number
  totalApprovedPartners: number
  totalPendingPartners: number
  totalRejectedPartners: number
  pendingPartnerReviews: PartnerReview[]
  kycReviews: PartnerReview[]
  pricingReviews: PartnerReview[]
  pendingVehiclesCount: number
  totalRides: number
  completedRides: number
  cancelledRides: number
  activeRides: number
  totalCustomers: number
  adminEarnings: number
  totalPartnerPayouts: number
  totalRevenue: number
  recentBookings: RideBooking[]
}

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'rides', label: 'Rides', icon: Activity },
  { id: 'partners', label: 'Partners', icon: Users },
  { id: 'kyc', label: 'KYC', icon: Shield },
  { id: 'vehicles', label: 'Vehicles', icon: Car },
]

export default function AdminDashboard() {
  const dispatch = useDispatch()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPricingPartner, setSelectedPricingPartner] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      if (!res.ok) return
      const json: DashboardData = await res.json()
      setData(json)
    } catch (err) {
      console.error('Admin dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = async () => {
    dispatch(setUserData(null))
    await signOut({ redirect: false })
  }

  const kpis = data ? [
    { label: 'Total Partners', value: data.totalPartners, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Approved', value: data.totalApprovedPartners, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: 'Pending Review', value: data.totalPendingPartners, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    { label: 'Rejected', value: data.totalRejectedPartners, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ] : []

  const pieData = data ? [
    { name: 'Approved', value: data.totalApprovedPartners || 0 },
    { name: 'Pending', value: data.totalPendingPartners || 0 },
    { name: 'Rejected', value: data.totalRejectedPartners || 0 },
  ] : []

  const COLORS = ['#22c55e', '#facc15', '#ef4444']

  return (
    <div className='flex h-screen bg-[#080808] text-white overflow-hidden'>

      {/* DESKTOP SIDEBAR */}
      <aside className='hidden md:flex flex-col w-60 border-r border-white/10 shrink-0'>
        <Sidebar tab={tab} setTab={setTab} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout}
          kycCount={data?.kycReviews?.length ?? 0}
          pendingCount={data?.pendingPartnerReviews?.length ?? 0}
          pricingCount={data?.pricingReviews?.length ?? 0}
        />
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className='fixed inset-0 bg-black/60 z-40 md:hidden'
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'tween', duration: 0.22 }}
              className='fixed left-0 top-0 h-full w-60 bg-[#0e0e0e] border-r border-white/10 z-50 md:hidden'
            >
              <Sidebar tab={tab} setTab={setTab} setSidebarOpen={setSidebarOpen} handleLogout={handleLogout}
                kycCount={data?.kycReviews?.length ?? 0}
                pendingCount={data?.pendingPartnerReviews?.length ?? 0}
                pricingCount={data?.pricingReviews?.length ?? 0}
                mobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* MAIN */}
      <div className='flex-1 flex flex-col overflow-hidden'>

        {/* TOP BAR */}
        <header className='flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0'>
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setSidebarOpen(true)}
              className='md:hidden text-gray-400 hover:text-white'
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className='text-base font-semibold capitalize'>
                {tab === 'overview' ? 'Dashboard Overview' : tab + ' Management'}
              </h1>
              <p className='text-xs text-gray-500'>NexRide Admin</p>
            </div>
          </div>

          <div className='flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5'>
            <div className='w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center'>
              A
            </div>
            <span className='text-xs text-gray-300 hidden sm:block'>Admin</span>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className='flex-1 overflow-y-auto p-5 space-y-6'>

          {loading ? (
            <div className='flex items-center justify-center h-64'>
              <div className='flex flex-col items-center gap-3'>
                <div className='w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                <p className='text-sm text-gray-500'>Loading dashboard...</p>
              </div>
            </div>
          ) : !data ? (
            <div className='flex items-center justify-center h-64'>
              <p className='text-sm text-gray-500'>Failed to load data.</p>
            </div>
          ) : (
            <>
              {/* ── OVERVIEW TAB ── */}
              {tab === 'overview' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='space-y-6'>

                  {/* KPI CARDS */}
                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                    {kpis.map((kpi, i) => {
                      const Icon = kpi.icon
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className={`p-5 rounded-2xl border ${kpi.border} ${kpi.bg}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg} mb-3`}>
                            <Icon size={18} className={kpi.color} />
                          </div>
                          <p className='text-2xl font-bold'>{kpi.value}</p>
                          <p className='text-xs text-gray-400 mt-1'>{kpi.label}</p>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* CHARTS */}
                  <div className='grid md:grid-cols-2 gap-5'>

                    {/* PIE */}
                    <div className='p-5 rounded-2xl border border-white/10 bg-white/[0.03]'>
                      <div className='flex items-center gap-2 mb-5'>
                        <TrendingUp size={15} className='text-gray-400' />
                        <h2 className='text-sm font-medium text-gray-300'>Partner Status Breakdown</h2>
                      </div>
                      <ResponsiveContainer width='100%' height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey='value'
                            cx='50%' cy='50%'
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                            itemStyle={{ color: '#ccc' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Legend */}
                      <div className='flex justify-center gap-5 mt-2'>
                        {pieData.map((d, i) => (
                          <div key={i} className='flex items-center gap-1.5'>
                            <div className='w-2.5 h-2.5 rounded-full' style={{ background: COLORS[i] }} />
                            <span className='text-xs text-gray-400'>{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BAR */}
                    <div className='p-5 rounded-2xl border border-white/10 bg-white/[0.03]'>
                      <div className='flex items-center gap-2 mb-5'>
                        <LayoutDashboard size={15} className='text-gray-400' />
                        <h2 className='text-sm font-medium text-gray-300'>Partner Flow</h2>
                      </div>
                      <ResponsiveContainer width='100%' height={220}>
                        <BarChart data={pieData} barSize={36}>
                          <CartesianGrid strokeDasharray='3 3' stroke='rgba(255,255,255,0.05)' />
                          <XAxis dataKey='name' stroke='#555' tick={{ fontSize: 11 }} />
                          <YAxis stroke='#555' tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }}
                            itemStyle={{ color: '#ccc' }}
                            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                          />
                          <Bar dataKey='value' radius={[6, 6, 0, 0]}>
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* PENDING REVIEWS PREVIEW */}
                  <div className='rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden'>
                    <div className='flex items-center justify-between px-5 py-4 border-b border-white/10'>
                      <h2 className='text-sm font-medium text-gray-300'>Pending Reviews</h2>
                      <button
                        onClick={() => setTab('partners')}
                        className='text-xs text-gray-500 hover:text-white transition flex items-center gap-1'
                      >
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <PartnerTable reviews={data.pendingPartnerReviews.slice(0, 5)} onReview={(id) => router.push(`/admin/reviews/partner/${id}`)} />
                  </div>

                  {/* Earnings & Rides Preview */}
                  <div className='rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden'>
                    <div className='flex items-center justify-between px-5 py-4 border-b border-white/10'>
                      <h2 className='text-sm font-medium text-gray-300'>Earnings & Rides</h2>
                      <button
                        onClick={() => setTab('rides')}
                        className='text-xs text-gray-500 hover:text-white transition flex items-center gap-1'
                      >
                        View all <ChevronRight size={12} />
                      </button>
                    </div>
                    <div className='grid grid-cols-3 divide-x divide-white/5'>
                      <div className='p-5 text-center'>
                        <p className='text-2xl font-bold text-emerald-400'>Rs {(data.adminEarnings || 0).toLocaleString()}</p>
                        <p className='text-[10px] text-gray-500 mt-1'>Admin Earnings (5%)</p>
                      </div>
                      <div className='p-5 text-center'>
                        <p className='text-2xl font-bold text-sky-400'>{data.totalRides || 0}</p>
                        <p className='text-[10px] text-gray-500 mt-1'>Total Rides</p>
                      </div>
                      <div className='p-5 text-center'>
                        <p className='text-2xl font-bold text-amber-400'>{data.totalCustomers || 0}</p>
                        <p className='text-[10px] text-gray-500 mt-1'>Customers</p>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* ── KYC TAB ── */}
              {tab === 'kyc' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='space-y-5'>
                  <div className='p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-2'>
                    <h2 className='text-lg font-semibold text-white'>Video KYC Verification</h2>
                    <p className='text-sm text-gray-400'>
                      Partners who have passed document review but are waiting to complete their face-to-face video KYC.
                    </p>
                  </div>

                  <div className='rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden'>
                    <div className='px-5 py-4 border-b border-white/10 flex items-center justify-between'>
                      <h2 className='text-sm font-medium text-gray-300'>
                        Pending Video KYC
                        <span className='ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full'>
                          {data.kycReviews?.length || 0}
                        </span>
                      </h2>
                    </div>
                    {data.kycReviews && data.kycReviews.length > 0 ? (
                      <div className='divide-y divide-white/5'>
                        {data.kycReviews.map((partner) => (
                          <div key={partner._id} className='flex items-center justify-between p-4 hover:bg-white/[0.02] transition'>
                            <div>
                              <p className='text-sm font-semibold'>{partner.name}</p>
                              <p className='text-xs text-gray-400'>{partner.email}</p>
                            </div>
                            <button
                              onClick={() => router.push(`/admin/kyc/${partner._id}`)}
                              className='px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition'
                            >
                              Start Video KYC
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='p-8 text-center text-sm text-gray-500'>
                        No partners in KYC queue
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── PARTNERS TAB ── */}
              {tab === 'partners' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='space-y-5'>
                  <div className='grid grid-cols-3 gap-4'>
                    {[
                      { label: 'Approved', value: data.totalApprovedPartners, color: 'text-emerald-400' },
                      { label: 'Pending', value: data.totalPendingPartners, color: 'text-yellow-400' },
                      { label: 'Rejected', value: data.totalRejectedPartners, color: 'text-red-400' },
                    ].map((s, i) => (
                      <div key={i} className='p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-center'>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className='text-xs text-gray-500 mt-1'>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className='rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden'>
                    <div className='px-5 py-4 border-b border-white/10'>
                      <h2 className='text-sm font-medium text-gray-300'>
                        All Pending Partner Reviews
                        <span className='ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full'>
                          {data.pendingPartnerReviews.length}
                        </span>
                      </h2>
                    </div>
                    <PartnerTable reviews={data.pendingPartnerReviews} onReview={(id) => router.push(`/admin/reviews/partner/${id}`)} />
                  </div>
                </motion.div>
              )}

              {/* ── VEHICLES TAB ── */}
              {tab === 'vehicles' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='space-y-5'>
                  <div className='p-5 rounded-2xl border border-white/10 bg-white/[0.03] space-y-2'>
                    <h2 className='text-lg font-semibold text-white'>Pricing Review</h2>
                    <p className='text-sm text-gray-400'>
                      Partners who have completed video KYC and submitted their pricing for admin review.
                    </p>
                  </div>

                  {/* PRICING REVIEW QUEUE */}
                  <div className='rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden'>
                    <div className='px-5 py-4 border-b border-white/10 flex items-center justify-between'>
                      <h2 className='text-sm font-medium text-gray-300'>
                        Pending Pricing Review
                        <span className='ml-2 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full'>
                          {data.pricingReviews?.length || 0}
                        </span>
                      </h2>
                    </div>
                    {data.pricingReviews && data.pricingReviews.length > 0 ? (
                      <div className='divide-y divide-white/5'>
                        {data.pricingReviews.map((partner) => (
                          <div key={partner._id} className='flex items-center justify-between p-4 hover:bg-white/[0.02] transition'>
                            <div>
                              <p className='text-sm font-semibold'>{partner.name}</p>
                              <p className='text-xs text-gray-400'>{partner.email}</p>
                              {partner.vehicleType && (
                                <span className='text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full capitalize mt-1 inline-block'>
                                  {partner.vehicleType}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedPricingPartner(partner._id)}
                              className='px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-lg transition'
                            >
                              Review Pricing
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='p-8 text-center text-sm text-gray-500'>
                        No partners pending pricing review
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ── RIDES TAB ── */}
              {tab === 'rides' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className='space-y-5'>

                  {/* Earnings & Stats KPIs */}
                  <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                    {[
                      { label: 'Admin Earnings (5%)', value: `Rs ${(data.adminEarnings || 0).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                      { label: 'Total Revenue', value: `Rs ${(data.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
                      { label: 'Partner Payouts', value: `Rs ${(data.totalPartnerPayouts || 0).toLocaleString()}`, icon: CreditCard, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                      { label: 'Total Customers', value: data.totalCustomers || 0, icon: UserCheck, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                    ].map((kpi, i) => {
                      const Icon = kpi.icon
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className={`p-5 rounded-2xl border ${kpi.border} ${kpi.bg}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg} mb-3`}>
                            <Icon size={18} className={kpi.color} />
                          </div>
                          <p className='text-xl font-bold'>{kpi.value}</p>
                          <p className='text-xs text-gray-400 mt-1'>{kpi.label}</p>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Ride Status KPIs */}
                  <div className='grid grid-cols-4 gap-3'>
                    {[
                      { label: 'Total Rides', value: data.totalRides, color: 'text-white' },
                      { label: 'Completed', value: data.completedRides, color: 'text-emerald-400' },
                      { label: 'Active', value: data.activeRides, color: 'text-sky-400' },
                      { label: 'Cancelled', value: data.cancelledRides, color: 'text-red-400' },
                    ].map((s, i) => (
                      <div key={i} className='p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-center'>
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className='text-[10px] text-gray-500 mt-1'>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Recent Bookings Table */}
                  <div className='rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden'>
                    <div className='px-5 py-4 border-b border-white/10'>
                      <h2 className='text-sm font-medium text-gray-300'>Recent Rides</h2>
                    </div>
                    {data.recentBookings && data.recentBookings.length > 0 ? (
                      <div className='overflow-x-auto'>
                        <table className='w-full text-xs'>
                          <thead>
                            <tr className='border-b border-white/10 text-gray-500'>
                              <th className='px-4 py-3 text-left font-semibold'>Customer</th>
                              <th className='px-4 py-3 text-left font-semibold'>Partner</th>
                              <th className='px-4 py-3 text-left font-semibold'>Vehicle</th>
                              <th className='px-4 py-3 text-left font-semibold'>Status</th>
                              <th className='px-4 py-3 text-right font-semibold'>Total</th>
                              <th className='px-4 py-3 text-right font-semibold'>Admin (5%)</th>
                              <th className='px-4 py-3 text-right font-semibold'>Partner</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-white/5'>
                            {data.recentBookings.map((ride) => (
                              <tr key={ride._id} className='hover:bg-white/[0.02] transition'>
                                <td className='px-4 py-3'>
                                  <p className='font-medium text-white'>{ride.userName}</p>
                                  <p className='text-[10px] text-gray-600'>{ride.userEmail}</p>
                                </td>
                                <td className='px-4 py-3'>
                                  <p className='font-medium text-white'>{ride.partnerName}</p>
                                  <p className='text-[10px] text-gray-600'>{ride.partnerEmail}</p>
                                </td>
                                <td className='px-4 py-3 capitalize text-gray-400'>{ride.vehicleType}</td>
                                <td className='px-4 py-3'>
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                    ride.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                                    ride.status === 'cancelled' || ride.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                    'bg-amber-500/20 text-amber-400'
                                  }`}>
                                    {ride.status}
                                  </span>
                                </td>
                                <td className='px-4 py-3 text-right font-semibold text-white'>Rs {ride.totalFare}</td>
                                <td className='px-4 py-3 text-right font-semibold text-emerald-400'>Rs {ride.platformFee}</td>
                                <td className='px-4 py-3 text-right font-semibold text-sky-400'>Rs {ride.partnerEarning}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className='p-8 text-center text-sm text-gray-500'>
                        No rides yet
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>

      <AdminPricingReviewModal
        isOpen={selectedPricingPartner !== null}
        onClose={() => setSelectedPricingPartner(null)}
        partnerId={selectedPricingPartner}
        onSuccess={fetchData}
      />
    </div>
  )
}

/* ── PARTNER TABLE ── */
function PartnerTable({ reviews, onReview }: { reviews: PartnerReview[]; onReview: (id: string) => void }) {
  if (reviews.length === 0) {
    return (
      <div className='px-5 py-10 text-center text-sm text-gray-500'>
        No pending reviews right now.
      </div>
    )
  }

  return (
    <div className='divide-y divide-white/5'>
      {reviews.map((p, i) => (
        <motion.div
          key={String(p._id)}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onReview(String(p._id))}
          className='flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.04]
          transition cursor-pointer group'
        >
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 rounded-full bg-white/10 text-white text-xs font-bold flex items-center justify-center shrink-0'>
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className='text-sm font-medium'>{p.name}</p>
              <p className='text-xs text-gray-500'>{p.email}</p>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            {p.vehicleType && (
              <span className='text-xs bg-white/10 text-gray-300 px-2.5 py-1 rounded-full capitalize'>
                {p.vehicleType}
              </span>
            )}
            <span className='text-xs bg-yellow-500/15 text-yellow-400 px-2.5 py-1 rounded-full'>
              Pending
            </span>
            <ExternalLink size={13} className='text-gray-600 group-hover:text-gray-300 transition' />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/* ── EMPTY STATE ── */
function EmptyState({ icon: Icon, title, message }: { icon: React.ElementType; title: string; message: string }) {
  return (
    <div className='flex flex-col items-center justify-center py-24 rounded-2xl border border-white/10 bg-white/[0.03]'>
      <div className='w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4'>
        <Icon size={24} className='text-gray-500' />
      </div>
      <p className='text-sm font-medium text-gray-300'>{title}</p>
      <p className='text-xs text-gray-600 mt-1'>{message}</p>
    </div>
  )
}

/* ── TYPE-SAFE SIDEBAR MODULE COMPONENT ── */
interface SidebarProps {
  tab: Tab
  setTab: (tab: Tab) => void
  setSidebarOpen: (open: boolean) => void
  handleLogout: () => void
  kycCount: number
  pendingCount: number
  pricingCount: number
  mobile?: boolean
}

function Sidebar({ tab, setTab, setSidebarOpen, handleLogout, kycCount, pendingCount, pricingCount, mobile = false }: SidebarProps) {

  // total pending across all actionable tabs — shown on Overview
  const totalPending = pendingCount + kycCount + pricingCount

  const badges: Partial<Record<Tab, { count: number; color: string; activeBg: string }>> = {
    overview: totalPending > 0
      ? { count: totalPending, color: 'bg-white/15 text-white', activeBg: 'bg-black/20 text-black' }
      : undefined as any,
    partners: pendingCount > 0
      ? { count: pendingCount, color: 'bg-yellow-500/20 text-yellow-400', activeBg: 'bg-black/20 text-black' }
      : undefined as any,
    kyc: kycCount > 0
      ? { count: kycCount, color: 'bg-blue-500/20 text-blue-400', activeBg: 'bg-black/20 text-black' }
      : undefined as any,
    vehicles: pricingCount > 0
      ? { count: pricingCount, color: 'bg-orange-500/20 text-orange-400', activeBg: 'bg-black/20 text-black' }
      : undefined as any,
  }

  return (
    <div className={`flex flex-col h-full ${mobile ? '' : 'w-60'}`}>
      {/* Logo */}
      <div className='flex items-center gap-3 px-5 py-5 border-b border-white/10'>
        <Image src={logo} alt='NexRide' width={56} height={56} />
        <div>
          <p className='text-sm font-bold text-white'>NexRide</p>
          <p className='text-[10px] text-gray-500 uppercase tracking-widest'>Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className='flex-1 px-3 py-4 space-y-1'>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          const badge = badges[item.id]

          return (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon size={16} />
              <span className='flex-1 text-left'>{item.label}</span>

              {/* notification badge */}
              {badge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1
                    ${active ? badge.activeBg : badge.color}`}
                >
                  {badge.count}
                </motion.span>
              )}

              {active && !badge && <ChevronRight size={14} className='ml-auto' />}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className='px-3 py-4 border-t border-white/10'>
        <button
          onClick={handleLogout}
          className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400
          hover:text-white hover:bg-white/5 transition-all'
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )
}

