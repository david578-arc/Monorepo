'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Hub</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Analytics Dashboard
            <span className="text-blue-600"> with AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Powerful invoice analytics with AI-powered chat functionality. 
            Get insights from your data using natural language queries.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Interactive Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Beautiful charts and metrics showing revenue trends, vendor analysis, 
                and category breakdowns from your invoice data.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>AI-Powered Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ask questions in natural language and get instant SQL queries 
                and results. No technical knowledge required.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Secure & Scalable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Built with modern technologies including PostgreSQL, Prisma ORM, 
                and Next.js for enterprise-grade performance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Info */}
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Try the Demo</h2>
          <p className="text-gray-600 mb-6">
            Experience the full analytics dashboard with sample invoice data.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
            <p className="text-sm text-gray-700">
              <strong>Demo Credentials:</strong><br />
              Email: admin@demo.com<br />
              Password: password
            </p>
          </div>
          <Link href="/login">
            <Button size="lg">Access Demo Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}