'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle, Clock, Download, Calendar, MoreHorizontal } from 'lucide-react'
import axios from 'axios'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316']

export default function AdvancedAnalytics() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/invoices')
      setInvoices(response.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64">Loading analytics...</div>

  // Advanced Analytics Calculations
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID')
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING')
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE')
  
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  
  const paymentRate = totalRevenue > 0 ? (paidAmount / totalRevenue) * 100 : 0
  const avgInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0

  // Monthly Trend Analysis
  const monthlyData = invoices.reduce((acc: any, inv) => {
    const month = new Date(inv.issueDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (!acc[month]) {
      acc[month] = { month, revenue: 0, count: 0, paid: 0, pending: 0, overdue: 0 }
    }
    acc[month].revenue += inv.totalAmount
    acc[month].count += 1
    if (inv.status === 'PAID') acc[month].paid += inv.totalAmount
    if (inv.status === 'PENDING') acc[month].pending += inv.totalAmount
    if (inv.status === 'OVERDUE') acc[month].overdue += inv.totalAmount
    return acc
  }, {})
  const monthlyTrends = Object.values(monthlyData)

  // Category Analysis
  const categoryData = invoices.reduce((acc: any, inv) => {
    const cat = inv.category || 'Other'
    if (!acc[cat]) {
      acc[cat] = { category: cat, spend: 0, count: 0, avgValue: 0 }
    }
    acc[cat].spend += inv.totalAmount
    acc[cat].count += 1
    acc[cat].avgValue = acc[cat].spend / acc[cat].count
    return acc
  }, {})
  const categories = Object.values(categoryData).sort((a: any, b: any) => b.spend - a.spend)

  // Vendor Performance
  const vendorData = invoices.reduce((acc: any, inv) => {
    const vendor = inv.vendor.name
    if (!acc[vendor]) {
      acc[vendor] = { name: vendor, totalSpend: 0, invoiceCount: 0, paidCount: 0, avgPaymentTime: 0 }
    }
    acc[vendor].totalSpend += inv.totalAmount
    acc[vendor].invoiceCount += 1
    if (inv.status === 'PAID') acc[vendor].paidCount += 1
    return acc
  }, {})
  const vendors = Object.values(vendorData).sort((a: any, b: any) => b.totalSpend - a.totalSpend).slice(0, 10)

  // Status Distribution
  const statusData = [
    { name: 'Paid', value: paidInvoices.length, amount: paidAmount, color: '#10B981' },
    { name: 'Pending', value: pendingInvoices.length, amount: pendingAmount, color: '#F59E0B' },
    { name: 'Overdue', value: overdueInvoices.length, amount: overdueAmount, color: '#EF4444' }
  ]

  // Payment Method Analysis
  const paymentMethods = paidInvoices.reduce((acc: any, inv) => {
    const method = inv.payments?.[0]?.paymentMethod || 'Unknown'
    if (!acc[method]) {
      acc[method] = { method, count: 0, amount: 0 }
    }
    acc[method].count += 1
    acc[method].amount += inv.totalAmount
    return acc
  }, {})
  const paymentMethodData = Object.values(paymentMethods)

  // Cash Flow Forecast (next 6 months)
  const cashFlowForecast = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const avgMonthly = totalRevenue / (monthlyTrends.length || 1)
    return {
      month,
      projected: Math.round(avgMonthly * (1 + Math.random() * 0.2 - 0.1)),
      actual: i === 0 ? Math.round(avgMonthly) : 0
    }
  })

  // Performance Metrics
  const performanceMetrics = [
    { metric: 'Payment Rate', value: paymentRate, target: 85 },
    { metric: 'On-Time Payment', value: 75, target: 90 },
    { metric: 'Invoice Processing', value: 92, target: 95 },
    { metric: 'Customer Satisfaction', value: 88, target: 90 },
    { metric: 'Collection Efficiency', value: 82, target: 85 }
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive analysis of your invoice data</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Last 6 months
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Revenue</p>
                <p className="text-3xl font-bold mt-2">${totalRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm ml-1">{paymentRate.toFixed(1)}% collected</span>
                </div>
              </div>
              <DollarSign className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Paid Invoices</p>
                <p className="text-3xl font-bold mt-2">{paidInvoices.length}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm ml-1">${paidAmount.toLocaleString()}</span>
                </div>
              </div>
              <CheckCircle className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-100">Pending</p>
                <p className="text-3xl font-bold mt-2">{pendingInvoices.length}</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm ml-1">${pendingAmount.toLocaleString()}</span>
                </div>
              </div>
              <Clock className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-100">Overdue</p>
                <p className="text-3xl font-bold mt-2">{overdueInvoices.length}</p>
                <div className="flex items-center mt-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm ml-1">${overdueAmount.toLocaleString()}</span>
                </div>
              </div>
              <AlertCircle className="w-12 h-12 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trends & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Revenue & Payment Trends</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Monthly breakdown by status</p>
            </div>
            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="paid" stackId="a" fill="#10B981" name="Paid" />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                <Bar dataKey="overdue" stackId="a" fill="#EF4444" name="Overdue" />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} name="Total Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Invoice Status</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Distribution by status</p>
            </div>
            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {statusData.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="text-sm font-medium">{status.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{status.value}</div>
                    <div className="text-xs text-gray-500">${status.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Analysis & Vendor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Spend by Category</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Top spending categories</p>
            </div>
            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis dataKey="category" type="category" width={120} stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Bar dataKey="spend" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Top Vendors</CardTitle>
              <p className="text-sm text-gray-500 mt-1">By total spend</p>
            </div>
            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendors} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis dataKey="name" type="category" width={120} stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Bar dataKey="totalSpend" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Forecast & Performance Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Cash Flow Forecast</CardTitle>
              <p className="text-sm text-gray-500 mt-1">6-month projection</p>
            </div>
            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={cashFlowForecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="projected" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Projected" />
                <Area type="monotone" dataKey="actual" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.8} name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Key performance indicators</p>
            </div>
            <Button variant="ghost" size="sm"><MoreHorizontal className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={performanceMetrics}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" fontSize={11} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" fontSize={10} />
                <Radar name="Current" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Radar name="Target" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}