'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { DollarSign, FileText, Upload, TrendingUp, Search, Download, Calendar, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import axios from '@/lib/axios'

// Figma Design Colors
const CHART_COLORS = {
  primary: '#1C64F2',      // Blue
  success: '#0E9F6E',      // Green
  warning: '#F59E0B',      // Orange/Yellow
  danger: '#F05252',       // Red
  purple: '#9061F9',       // Purple
  teal: '#0694A2',         // Teal
  pink: '#E74694'          // Pink
}

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.danger, CHART_COLORS.purple]

export default function RealDataDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [invoiceTrends, setInvoiceTrends] = useState<any[]>([])
  const [vendorData, setVendorData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [cashOutflow, setCashOutflow] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    const filtered = invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredInvoices(filtered)
  }, [invoices, searchTerm])

  const fetchData = async () => {
    try {
      const [statsRes, trendsRes, vendorsRes, categoriesRes, cashRes, invoicesRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/invoice-trends'),
        axios.get('/api/vendors/top10'),
        axios.get('/api/category-spend'),
        axios.get('/api/cash-outflow'),
        axios.get('/api/invoices?limit=1000')
      ])

      setStats(statsRes.data)
      setInvoiceTrends(trendsRes.data)
      setVendorData(vendorsRes.data.map((v: any) => ({ name: v.name, totalSpend: v.spend })))
      setCategoryData(categoriesRes.data)
      setCashOutflow(cashRes.data.map((c: any) => ({ month: c.month, outflow: c.value })))
      setInvoices(invoicesRes.data)
      setFilteredInvoices(invoicesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    const csvContent = [
      ['Invoice Number', 'Vendor', 'Date', 'Amount', 'Status'],
      ...filteredInvoices.map(inv => [
        inv.invoiceNumber,
        inv.vendor.name,
        new Date(inv.issueDate).toLocaleDateString(),
        inv.totalAmount,
        inv.status
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>
  }

  // Deep Analytics
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID')
  const pendingInvoices = invoices.filter(inv => inv.status === 'PENDING')
  const overdueInvoices = invoices.filter(inv => inv.status === 'OVERDUE')
  
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const pendingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
  
  const collectionRate = stats?.totalSpend > 0 ? (paidAmount / stats.totalSpend) * 100 : 0
  const growthRate = invoiceTrends.length > 1 ? 
    ((invoiceTrends[invoiceTrends.length - 1]?.value - invoiceTrends[0]?.value) / invoiceTrends[0]?.value * 100) : 0

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive analytics and insights from your invoice data</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Select dates
          </Button>
          <Button onClick={downloadCSV} size="sm" style={{ backgroundColor: CHART_COLORS.primary }}>
            <Download className="w-4 h-4 mr-2" />
            Download report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">${stats?.totalSpend?.toLocaleString() || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">Paid: ${paidAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS.primary}15` }}>
                <DollarSign className="w-6 h-6" style={{ color: CHART_COLORS.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Pending Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">${pendingAmount.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">{pendingInvoices.length} invoices</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS.success}15` }}>
                <FileText className="w-6 h-6" style={{ color: CHART_COLORS.success }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Overdue Amount</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">${overdueAmount.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">{overdueInvoices.length} invoices</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS.purple}15` }}>
                <TrendingUp className="w-6 h-6" style={{ color: CHART_COLORS.purple }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalInvoices || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500">Paid: {paidInvoices.length}</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CHART_COLORS.warning}15` }}>
                <Upload className="w-6 h-6" style={{ color: CHART_COLORS.warning }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2 bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Revenue</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Revenue increase of {Math.abs(growthRate).toFixed(1)}% compared to last month</p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900">${stats?.totalSpend?.toLocaleString() || 0}</p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1 font-medium">{Math.abs(growthRate).toFixed(1)}%</span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={invoiceTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="value" stroke={CHART_COLORS.primary} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Category */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Sales by Category</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="spend"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {categoryData.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">${category.spend.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Acquisition (Vendors) */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Acquisition</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Top vendors by spend</p>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendorData.slice(0, 6)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis dataKey="name" type="category" width={120} stroke="#9CA3AF" fontSize={12} />
                <Tooltip />
                <Bar dataKey="totalSpend" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent transactions</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{
                      backgroundColor: invoice.status === 'PAID' ? `${CHART_COLORS.success}15` :
                                     invoice.status === 'PENDING' ? `${CHART_COLORS.warning}15` : `${CHART_COLORS.danger}15`
                    }}>
                      <DollarSign className="w-5 h-5" style={{
                        color: invoice.status === 'PAID' ? CHART_COLORS.success :
                               invoice.status === 'PENDING' ? CHART_COLORS.warning : CHART_COLORS.danger
                      }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{invoice.vendor.name}</p>
                      <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${invoice.totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Invoices</CardTitle>
              <p className="text-sm text-gray-500 mt-1">Manage and track all invoices</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Button onClick={downloadCSV} size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-96 border rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">Invoice Number</th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">Vendor</th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">Date</th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">Amount</th>
                  <th className="text-left p-3 font-medium text-gray-700 text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-t hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="p-3 text-gray-600">{invoice.vendor.name}</td>
                    <td className="p-3 text-gray-600">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-gray-900">${invoice.totalAmount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium`} style={{
                        backgroundColor: invoice.status === 'PAID' ? `${CHART_COLORS.success}15` :
                                       invoice.status === 'PENDING' ? `${CHART_COLORS.warning}15` : `${CHART_COLORS.danger}15`,
                        color: invoice.status === 'PAID' ? CHART_COLORS.success :
                               invoice.status === 'PENDING' ? CHART_COLORS.warning : CHART_COLORS.danger
                      }}>
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </div>
        </CardContent>
      </Card>
    </div>
  )
}