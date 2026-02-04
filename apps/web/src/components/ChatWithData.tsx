'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Bot, User, Code, Database } from 'lucide-react'
import axios from 'axios'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  sql?: string
  results?: any[]
}

const SAMPLE_QUERIES = [
  "What's the total spend in the last 90 days?",
  "List top 5 vendors by spend",
  "Show overdue invoices as of today",
  "What's the average invoice amount by category?",
  "How many invoices were processed this month?"
]

export default function ChatWithData() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput('')
    setLoading(true)

    try {
      const response = await axios.post('/api/chat-with-data', {
        query: currentInput
      })

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.data.message || 'Query executed successfully',
        sql: response.data.sql,
        results: response.data.results
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please make sure the Vanna AI service is running.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSampleQuery = (query: string) => {
    setInput(query)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Chat with Your Data</h1>
        <p className="text-slate-600 mt-1">Ask natural language questions about your invoice data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm h-[700px] flex flex-col">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Start a conversation</h3>
                    <p className="text-slate-600 mb-4">Ask questions about your invoice data using natural language</p>
                    <div className="text-sm text-slate-500">
                      <p>Try asking:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• "What's our total spend this year?"</li>
                        <li>• "Which vendors do we spend the most on?"</li>
                        <li>• "Show me overdue invoices"</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.type === 'user' ? 'bg-blue-100' : 'bg-slate-100'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Bot className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className={`rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-slate-50 border border-slate-200'
                      }`}>
                        <p className="text-slate-900">{message.content}</p>
                      </div>
                      
                      {message.sql && (
                        <div className="bg-slate-900 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Code className="h-4 w-4 text-green-400" />
                            <span className="text-xs font-medium text-green-400">Generated SQL</span>
                          </div>
                          <code className="text-green-300 text-sm font-mono">{message.sql}</code>
                        </div>
                      )}
                      
                      {message.results && message.results.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                            <Database className="h-4 w-4 text-slate-600" />
                            <span className="text-sm font-medium text-slate-900">
                              Results ({message.results.length} rows)
                            </span>
                          </div>
                          <div className="overflow-x-auto max-h-64">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50">
                                <tr>
                                  {Object.keys(message.results[0]).map((key) => (
                                    <th key={key} className="text-left py-2 px-3 font-medium text-slate-600 border-b border-slate-200">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {message.results.slice(0, 10).map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    {Object.values(row).map((value: any, cellIdx) => (
                                      <td key={cellIdx} className="py-2 px-3 border-b border-slate-100">
                                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {message.results.length > 10 && (
                            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200">
                              <p className="text-xs text-slate-500">
                                Showing first 10 of {message.results.length} results
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-slate-600">Analyzing your question...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="border-t border-slate-200 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about your data..."
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                  <Button type="submit" disabled={loading || !input.trim()} className="px-4">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Queries Sidebar */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Sample Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SAMPLE_QUERIES.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleSampleQuery(query)}
                  className="w-full text-left p-3 text-sm bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  disabled={loading}
                >
                  {query}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <p>Ask your question in natural language</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <p>AI converts it to SQL query</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <p>Query runs on your database</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">4</span>
                </div>
                <p>Results displayed in table format</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}