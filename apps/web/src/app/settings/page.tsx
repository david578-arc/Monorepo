'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Bell, Shield, Palette, Database } from 'lucide-react'
import axios from '@/lib/axios'
import { useTheme } from '@/components/ThemeProvider'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    overdueAlerts: true,
    weeklyReports: false,
    monthlyReports: true
  })

  const { theme, setTheme } = useTheme()
  const [preferences, setPreferences] = useState({
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'UTC'
  })

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsed = JSON.parse(userData)
      setUser(parsed)
      setProfileData({
        ...profileData,
        name: parsed.name,
        email: parsed.email
      })
    }
  }, [])

  const handleProfileUpdate = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const updateData: any = {
        name: profileData.name,
        email: profileData.email
      }
      
      if (profileData.newPassword) {
        if (profileData.newPassword !== profileData.confirmPassword) {
          alert('Passwords do not match')
          return
        }
        updateData.password = profileData.newPassword
      }
      
      const response = await axios.put(`/api/users/${user.id}`, updateData)
      localStorage.setItem('user', JSON.stringify(response.data))
      setUser(response.data)
      alert('Profile updated successfully')
      
      setProfileData({
        ...profileData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationsSave = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
    alert('Notification preferences saved')
  }

  const handlePreferencesSave = async () => {
    try {
      await axios.post('/api/preferences', { userId: user.id, preferences })
      localStorage.setItem('preferences', JSON.stringify(preferences))
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Settings Updated', {
          body: `Language: ${preferences.language}, Currency: ${preferences.currency}`,
        })
      }
      alert(`Preferences saved: ${preferences.language.toUpperCase()} / ${preferences.currency}`)
    } catch (error) {
      alert('Failed to save preferences')
    }
  }

  const handleBackup = async () => {
    try {
      const response = await axios.post('/api/backup')
      alert(`Backup completed successfully!\n\nSummary:\n- Invoices: ${response.data.summary.invoices}\n- Vendors: ${response.data.summary.vendors}\n- Customers: ${response.data.summary.customers}\n- Documents: ${response.data.summary.documents}\n\nTimestamp: ${new Date(response.data.timestamp).toLocaleString()}`)
    } catch (error) {
      alert('Failed to create backup')
    }
  }

  const handle2FAToggle = async () => {
    try {
      if (user.twoFactorEnabled) {
        await axios.post(`/api/users/${user.id}/disable-2fa`)
        alert('2FA disabled successfully')
      } else {
        const response = await axios.post(`/api/users/${user.id}/enable-2fa`)
        alert(`2FA enabled successfully!\n\nSecret: ${response.data.secret}\n\nScan this QR code with your authenticator app:\n${response.data.qrCode}`)
      }
      const userData = await axios.get(`/api/users`)
      const updatedUser = userData.data.find((u: any) => u.id === user.id)
      if (updatedUser) {
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(updatedUser)
      }
    } catch (error) {
      alert('Failed to toggle 2FA')
    }
  }

  const viewSessions = async () => {
    try {
      const response = await axios.get(`/api/sessions/${user.id}`)
      const sessions = response.data
      const sessionText = sessions.map((s: any) => 
        `${s.device}\n${s.location} - ${s.ip}\nLast active: ${new Date(s.lastActive).toLocaleString()}${s.current ? ' [Current Session]' : ''}`
      ).join('\n\n')
      alert(`Active Sessions (${sessions.length}):\n\n${sessionText}`)
    } catch (error) {
      alert('Failed to fetch sessions')
    }
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification('Notifications Enabled', {
          body: 'You will now receive notifications',
        })
      }
    }
  }

  const handleExportData = async () => {
    try {
      const response = await axios.get('/api/invoices', { params: { limit: 1000 } })
      const data = JSON.stringify(response.data, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'data-export.json'
      a.click()
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Palette className="w-4 h-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="data">
            <Database className="w-4 h-4 mr-2" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleProfileUpdate} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-500">Enable browser push notifications</p>
                </div>
                <Button onClick={requestNotificationPermission} variant="outline" size="sm">
                  Enable
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                </div>
                <Switch
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({...notifications, emailNotifications: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Invoice Reminders</Label>
                  <p className="text-sm text-gray-500">Get reminders for upcoming invoice due dates</p>
                </div>
                <Switch
                  checked={notifications.invoiceReminders}
                  onCheckedChange={(checked) => setNotifications({...notifications, invoiceReminders: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue Alerts</Label>
                  <p className="text-sm text-gray-500">Receive alerts for overdue invoices</p>
                </div>
                <Switch
                  checked={notifications.overdueAlerts}
                  onCheckedChange={(checked) => setNotifications({...notifications, overdueAlerts: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Reports</Label>
                  <p className="text-sm text-gray-500">Get weekly summary reports via email</p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Monthly Reports</Label>
                  <p className="text-sm text-gray-500">Get monthly analytics reports</p>
                </div>
                <Switch
                  checked={notifications.monthlyReports}
                  onCheckedChange={(checked) => setNotifications({...notifications, monthlyReports: checked})}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNotificationsSave}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>Customize your application experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Language</Label>
                <Select value={preferences.language} onValueChange={(v) => setPreferences({...preferences, language: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Currency</Label>
                <Select value={preferences.currency} onValueChange={(v) => setPreferences({...preferences, currency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date Format</Label>
                <Select value={preferences.dateFormat} onValueChange={(v) => setPreferences({...preferences, dateFormat: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Timezone</Label>
                <Select value={preferences.timezone} onValueChange={(v) => setPreferences({...preferences, timezone: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time</SelectItem>
                    <SelectItem value="America/Chicago">Central Time</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePreferencesSave}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                </div>
                <Button variant="outline" onClick={handle2FAToggle}>
                  {user?.twoFactorEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Sessions</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage your active sessions across devices</p>
                </div>
                <Button variant="outline" onClick={viewSessions}>View Sessions</Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login History</Label>
                  <p className="text-sm text-gray-500">View your recent login activity</p>
                </div>
                <Button variant="outline">View History</Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2 text-red-600">Danger Zone</h3>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Delete Account</Label>
                    <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export, import, and manage your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export Data</Label>
                  <p className="text-sm text-gray-500">Download all your data in JSON format</p>
                </div>
                <Button onClick={handleExportData}>
                  <Database className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Import Data</Label>
                  <p className="text-sm text-gray-500">Import data from a file</p>
                </div>
                <Button variant="outline">
                  Import
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Clear Cache</Label>
                  <p className="text-sm text-gray-500">Clear application cache and temporary data</p>
                </div>
                <Button variant="outline">Clear Cache</Button>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Database Backup</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Create a backup of your database</p>
                  </div>
                  <Button variant="outline" onClick={handleBackup}>Create Backup</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
