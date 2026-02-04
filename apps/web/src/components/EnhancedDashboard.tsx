'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Search, Download, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Filter, TrendingUp, TrendingDown, DollarSign, FileText, Clock, AlertCircle } from 'lucide-react'
import axios from '@/lib/axios'

const COLORS = ['#1C64F2', '#0E9F6E', '#F59E0B', '#F05252', '#9061F9', '#3F83F8']

export default function EnhancedDashboard({ globalSearch = '' }: { globalSearch?: string }) {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [categorySpend, setCategorySpend] = useState<any[]>([])
  const [cashOutflow, setCashOutflow] = useState<any[]>([])
  const [vendorsList, setVendorsList] = useState<any[]>([])
  const [customersList, setCustomersList] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  
  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (globalSearch) setSearch(globalSearch)
  }, [globalSearch])
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  
  // CRUD Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<any>(null)
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    vendorId: '',
    customerId: '',
    issueDate: '',
    dueDate: '',
    totalAmount: '',
    status: 'PENDING',
    category: 'General',
    description: ''
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) setUser(JSON.parse(userData))
    fetchData()
  }, [page, search, statusFilter, categoryFilter])

  const isAdmin = user?.role === 'ADMIN'

  const fetchData = async () => {
    try {
      const [statsRes, invoicesRes, trendsRes, vendorsRes, categoryRes, cashOutflowRes, vendorsListRes, customersListRes, categoriesRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/invoices', { params: { page, limit, search, status: statusFilter, category: categoryFilter } }),
        axios.get('/api/invoice-trends'),
        axios.get('/api/vendors/top10'),
        axios.get('/api/category-spend'),
        axios.get('/api/cash-outflow'),
        axios.get('/api/vendors'),
        axios.get('/api/customers'),
        axios.get('/api/categories')
      ])
      
      setStats(statsRes.data)
      setInvoices(invoicesRes.data.data)
      setTotalPages(invoicesRes.data.pagination.totalPages)
      setTrends(trendsRes.data)
      setVendors(vendorsRes.data)
      setCategorySpend(categoryRes.data)
      setCashOutflow(cashOutflowRes.data)
      setVendorsList(vendorsListRes.data)
      setCustomersList(customersListRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleCreateOrUpdate = async () => {
    console.log('Saving invoice:', editingInvoice ? 'UPDATE' : 'CREATE', formData)
    try {
      if (editingInvoice) {
        const response = await axios.put(`/api/invoices/${editingInvoice.id}`, formData)
        console.log('Update response:', response.data)
      } else {
        const response = await axios.post('/api/invoices', formData)
        console.log('Create response:', response.data)
      }
      setIsDialogOpen(false)
      setEditingInvoice(null)
      resetForm()
      await fetchData()
    } catch (error: any) {
      console.error('Error saving invoice:', error.response?.data || error.message)
      alert(`Failed to save invoice: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleEdit = (invoice: any) => {
    console.log('Editing invoice:', invoice.id)
    setEditingInvoice(invoice)
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      vendorId: invoice.vendorId,
      customerId: invoice.customerId,
      issueDate: invoice.issueDate.split('T')[0],
      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
      totalAmount: invoice.totalAmount.toString(),
      status: invoice.status,
      category: invoice.category || 'General',
      description: invoice.description || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    console.log('Deleting invoice:', id)
    try {
      const response = await axios.delete(`/api/invoices/${id}`)
      console.log('Delete response:', response.data)
      await fetchData()
    } catch (error: any) {
      console.error('Error deleting invoice:', error.response?.data || error.message)
      alert(`Failed to delete invoice: ${error.response?.data?.error || error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      invoiceNumber: '',
      vendorId: '',
      customerId: '',
      issueDate: '',
      dueDate: '',
      totalAmount: '',
      status: 'PENDING',
      category: 'General',
      description: ''
    })
  }

  const exportToCSV = () => {
    const headers = ['Invoice Number', 'Vendor', 'Customer', 'Amount', 'Status', 'Issue Date', 'Due Date']
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.vendor.name,
      inv.customer.name,
      inv.totalAmount,
      inv.status,
      new Date(inv.issueDate).toLocaleDateString(),
      inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'N/A'
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoices.csv'
    a.click()
  }

  if (!stats) return <div className="flex items-center justify-center h-screen">Loading...</div>

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</h3>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" /> +12.5% from last month
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <h3 className="text-2xl font-bold text-gray-900">${stats.pendingAmount.toLocaleString()}</h3>
                <p className="text-xs text-gray-600 mt-1">{stats.pendingCount} invoices</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue Amount</p>
                <h3 className="text-2xl font-bold text-gray-900">${stats.overdueAmount.toLocaleString()}</h3>
                <p className="text-xs text-red-600 flex items-center mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" /> {stats.overdueCount} invoices
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</h3>
                <p className="text-xs text-gray-600 mt-1">Avg: ${stats.averageInvoiceValue}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1C64F2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1C64F2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#1C64F2" fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendors} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="paid" stackId="a" fill="#0E9F6E" name="Paid" />
                <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categorySpend} dataKey="spend" nameKey="category" cx="50%" cy="50%" outerRadius={100} label>
                  {categorySpend.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Outflow Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashOutflow}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#F05252" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Invoices</CardTitle>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(c => c).map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              {isAdmin && (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingInvoice(null); resetForm(); }}>
                      <Plus className="w-4 h-4 mr-2" /> Add Invoice
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingInvoice ? 'Edit Invoice' : 'Create Invoice'}</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Invoice Number</Label>
                      <Input value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} />
                    </div>
                    <div>
                      <Label>Vendor</Label>
                      <Select value={formData.vendorId} onValueChange={(v) => setFormData({...formData, vendorId: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorsList.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Customer</Label>
                      <Select value={formData.customerId} onValueChange={(v) => setFormData({...formData, customerId: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customersList.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} />
                    </div>
                    <div>
                      <Label>Issue Date</Label>
                      <Input type="date" value={formData.issueDate} onChange={(e) => setFormData({...formData, issueDate: e.target.value})} />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PAID">Paid</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="OVERDUE">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                    </div>
                    <div className="col-span-2">
                      <Label>Description</Label>
                      <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateOrUpdate}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-semibold">Invoice #</th>
                  <th className="text-left p-3 text-sm font-semibold">Vendor</th>
                  <th className="text-left p-3 text-sm font-semibold">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold">Status</th>
                  <th className="text-left p-3 text-sm font-semibold">Issue Date</th>
                  <th className="text-left p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{invoice.invoiceNumber}</td>
                    <td className="p-3 text-sm">{invoice.vendor.name}</td>
                    <td className="p-3 text-sm">{invoice.customer.name}</td>
                    <td className="p-3 text-sm font-semibold">${invoice.totalAmount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {isAdmin && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(invoice)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(invoice.id)}>
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        {!isAdmin && <span className="text-xs text-gray-400">View only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
