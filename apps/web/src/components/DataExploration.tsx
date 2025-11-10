'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import axios from 'axios'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function DataExploration() {
  const [stats, setStats] = useState<any>(null)
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([])
  const [vendorPerformance, setVendorPerformance] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      const [
        statsRes,
        monthlyRes,
        paymentRes,
        statusRes,
        vendorRes,
        categoryRes
      ] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/analytics/monthly-revenue'),
        axios.get('/api/analytics/payment-methods'),
        axios.get('/api/analytics/invoice-status-breakdown'),
        axios.get('/api/analytics/vendor-performance'),
        axios.get('/api/category-spend')
      ])

      setStats(statsRes.data)
      setMonthlyRevenue(monthlyRes.data)
      setPaymentMethods(paymentRes.data)
      setStatusBreakdown(statusRes.data)
      setVendorPerformance(vendorRes.data)
      setCategoryData(categoryRes.data)
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>
  }

  const totalRevenue = stats?.totalSpend || 0
  const paidAmount = statusBreakdown.find(s => s.status === 'PAID')?.amount || 0
  const pendingAmount = statusBreakdown.find(s => s.status === 'PENDING')?.amount || 0
  const overdueAmount = statusBreakdown.find(s => s.status === 'OVERDUE')?.amount || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Exploration & Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">Deep insights from your invoice data</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                <p className="text-blue-100 text-xs mt-1">From {stats?.totalInvoices} invoices</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Paid Amount</p>
                <p className="text-2xl font-bold">${paidAmount.toLocaleString()}</p>
                <p className="text-green-100 text-xs mt-1">{((paidAmount/totalRevenue)*100).toFixed(1)}% of total</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending Amount</p>
                <p className="text-2xl font-bold">${pendingAmount.toLocaleString()}</p>
                <p className="text-yellow-100 text-xs mt-1">{((pendingAmount/totalRevenue)*100).toFixed(1)}% of total</p>
              </div>
              <FileText className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Overdue Amount</p>
                <p className="text-2xl font-bold">${overdueAmount.toLocaleString()}</p>
                <p className="text-red-100 text-xs mt-1">{((overdueAmount/totalRevenue)*100).toFixed(1)}% of total</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Breakdown</CardTitle>
            <p className="text-sm text-gray-600">Revenue by month with status breakdown</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, '']} />
                <Bar dataKey="paid" stackId="a" fill="#10B981" name="Paid" />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
                <Bar dataKey="overdue" stackId="a" fill="#EF4444" name="Overdue" />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} name="Total Revenue" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Status Distribution</CardTitle>
            <p className="text-sm text-gray-600">Breakdown by invoice status</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="amount"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {statusBreakdown.map((status, index) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{status.status}</span>
                    <span className="text-xs text-gray-500">({status.count} invoices)</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    ${status.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor & Category Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Performance Analysis</CardTitle>
            <p className="text-sm text-gray-600">Spend and payment rates by vendor</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vendorPerformance.slice(0, 5).map((vendor, index) => (
                <div key={vendor.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                        <p className="text-xs text-gray-500">{vendor.invoiceCount} invoices</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">${vendor.totalSpend.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Avg: ${Math.round(vendor.avgInvoiceValue).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${vendor.paymentRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Payment Rate: {vendor.paymentRate.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Spend Analysis</CardTitle>
            <p className="text-sm text-gray-600">Revenue distribution by category</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis dataKey="category" type="category" width={100} stroke="#9CA3AF" fontSize={12} />
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']} />
                <Bar dataKey="spend" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Analysis</CardTitle>
          <p className="text-sm text-gray-600">Payment preferences and amounts</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentMethods}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="amount"
                  label={({ method, percent }) => `${method} ${(percent * 100).toFixed(0)}%`}
                >
                  {paymentMethods.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{method.method}</p>
                      <p className="text-xs text-gray-500">{method.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${method.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      ${Math.round(method.amount / method.count).toLocaleString()} avg
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}