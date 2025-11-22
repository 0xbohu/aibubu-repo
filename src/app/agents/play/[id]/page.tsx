'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useChat } from 'ai/react'
import { 
  ArrowLeft, 
  Send, 
  Heart, 
  Share2, 
  Settings, 
  Star,
  Play,
  Save,
  Upload,
  RotateCcw
} from 'lucide-react'
import Link from 'next/link'
import { UserAgent } from '@/types/agents'

export default function PlayAgentPage() {
  const [user, setUser] = useState<User | null>(null)
  const [agent, setAgent] = useState<UserAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [sessionStartTime] = useState(new Date())
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [showPublishOptions, setShowPublishOptions] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const params = useParams()
  const router = useRouter()
  const agentId = params.id as string

  // Use AI SDK chat hook with custom system prompt
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/agents/chat',
    body: { 
      agentId,
      systemPrompt: agent?.generated_prompt 
    },
    onFinish: () => {
      // Update play count when conversation happens
      if (agent && messages.length > 0) {
        updatePlayCount()
      }
    }
  })

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Load agent data
      const { data: agentData } = await supabase
        .from('user_agents')
        .select(`
          *,
          players!creator_id (username, avatar_url),
          agent_templates!template_id (name, category, icon)
        `)
        .eq('id', agentId)
        .single()
      
      if (!agentData) {
        router.push('/agents')
        return
      }
      
      // Check if user can access this agent
      if (!agentData.is_published && agentData.creator_id !== user.id) {
        router.push('/agents')
        return
      }
      
      setAgent(agentData as any)
      
      // Check if user has liked this agent
      const { data: likeData } = await supabase
        .from('agent_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .single()
      
      setIsLiked(!!likeData)
      
      setLoading(false)
    }

    initialize()
  }, [router, agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const updatePlayCount = async () => {
    if (!agent) return
    
    await supabase
      .from('user_agents')
      .update({ play_count: agent.play_count + 1 })
      .eq('id', agentId)
  }

  const handleLike = async () => {
    if (!user || !agent) return
    
    if (isLiked) {
      // Remove like
      await supabase
        .from('agent_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
      
      await supabase
        .from('user_agents')
        .update({ like_count: Math.max(0, agent.like_count - 1) })
        .eq('id', agentId)
      
      setIsLiked(false)
      setAgent(prev => prev ? { ...prev, like_count: Math.max(0, prev.like_count - 1) } : null)
    } else {
      // Add like
      await supabase
        .from('agent_likes')
        .insert({ user_id: user.id, agent_id: agentId })
      
      await supabase
        .from('user_agents')
        .update({ like_count: agent.like_count + 1 })
        .eq('id', agentId)
      
      setIsLiked(true)
      setAgent(prev => prev ? { ...prev, like_count: prev.like_count + 1 } : null)
    }
  }

  const handleRatingSubmit = async () => {
    if (!user || !agent || rating === 0) return
    
    const sessionDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60))
    
    // Save session data
    await supabase
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        agent_id: agentId,
        session_data: {
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: new Date().toISOString()
          }))
        },
        duration_minutes: sessionDuration,
        rating,
        feedback: feedback.trim() || undefined
      })
    
    // Save review if feedback provided
    if (feedback.trim()) {
      await supabase
        .from('agent_reviews')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          rating,
          comment: feedback.trim()
        })
    }
    
    setShowRating(false)
    setRating(0)
    setFeedback('')
  }

  const handlePublish = async () => {
    if (!agent || agent.creator_id !== user?.id) return
    
    await supabase
      .from('user_agents')
      .update({ is_published: true })
      .eq('id', agentId)
    
    setAgent(prev => prev ? { ...prev, is_published: true } : null)
    setShowPublishOptions(false)
  }

  const resetConversation = () => {
    setMessages([])
  }

  if (loading || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/agents"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Link>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{agent.avatar_emoji}</span>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">{agent.name}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>by @{(agent as any).players?.username || 'Unknown'}</span>
                    <div className="flex items-center">
                      <Play className="w-3 h-3 mr-1" />
                      {agent.play_count}
                    </div>
                    <div className="flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      {agent.like_count}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={resetConversation}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="New conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleLike}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isLiked 
                    ? 'text-red-600 bg-red-50' 
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              
              {agent.creator_id === user?.id && (
                <div className="relative">
                  <button
                    onClick={() => setShowPublishOptions(!showPublishOptions)}
                    className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  {showPublishOptions && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 min-w-48">
                      {!agent.is_published && (
                        <button
                          onClick={handlePublish}
                          className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                        >
                          <Upload className="w-4 h-4 mr-3" />
                          Publish to Community
                        </button>
                      )}
                      <Link
                        href={`/agents/edit/${agent.id}`}
                        className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Edit Agent
                      </Link>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowRating(true)}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Star className="w-4 h-4 mr-2" />
                Rate
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <div className="text-4xl mb-3">{agent.avatar_emoji}</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Hey! I'm {agent.name}!</h2>
                <p className="text-gray-600 mb-4">{agent.description || 'Let\'s have a fun conversation!'}</p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 Tip: Start a conversation and I'll respond based on my personality!
                  </p>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{agent.avatar_emoji}</span>
                      <span className="text-xs font-medium text-gray-500">{agent.name}</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white shadow-sm border border-gray-100 px-4 py-3 rounded-2xl">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">{agent.avatar_emoji}</span>
                    <span className="text-xs font-medium text-gray-500">{agent.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder={`Chat with ${agent.name}...`}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Rate Your Experience</h2>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-3">How was your chat with {agent.name}?</p>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave a comment (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What did you think of this agent?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRating(false)}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}