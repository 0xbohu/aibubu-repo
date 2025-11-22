'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { 
  Plus, 
  Sparkles, 
  Heart, 
  Play, 
  Star, 
  Filter,
  Search,
  ArrowLeft
} from 'lucide-react'
import { AgentTemplate, UserAgent, AgentCategory } from '@/types/agents'

export default function AgentsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [templates, setTemplates] = useState<AgentTemplate[]>([])
  const [userAgents, setUserAgents] = useState<UserAgent[]>([])
  const [featuredAgents, setFeaturedAgents] = useState<UserAgent[]>([])
  const [communityAgents, setCommunityAgents] = useState<UserAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'templates' | 'my-agents' | 'community'>('templates')
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [communitySearchQuery, setCommunitySearchQuery] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const categories: { value: AgentCategory | 'all'; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '🌟' },
    { value: 'storytelling', label: 'Stories', emoji: '📚' },
    { value: 'science', label: 'Science', emoji: '🔬' },
    { value: 'games', label: 'Games', emoji: '🎮' },
    { value: 'entertainment', label: 'Fun', emoji: '😂' },
    { value: 'education', label: 'Learning', emoji: '🎓' },
    { value: 'pets', label: 'Pets', emoji: '🐾' },
  ]

  useEffect(() => {
    // Set tab from URL parameter
    const tabParam = searchParams.get('tab')
    if (tabParam === 'templates' || tabParam === 'my-agents' || tabParam === 'community') {
      setActiveTab(tabParam)
    }

    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Load templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('agent_templates')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (templatesError) {
        console.error('Error loading templates:', templatesError)
      }
      
      if (templatesData) {
        setTemplates(templatesData)
      }
      
      // Load user's agents
      const { data: userAgentsData } = await supabase
        .from('user_agents')
        .select(`
          *,
          agent_templates!template_id (name, category)
        `)
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
      
      if (userAgentsData) {
        setUserAgents(userAgentsData as any)
      }
      
      // Load featured community agents
      const { data: featuredData } = await supabase
        .from('user_agents')
        .select(`
          *,
          players!creator_id (username),
          agent_templates!template_id (name, category)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('like_count', { ascending: false })
        .limit(6)
      
      if (featuredData) {
        setFeaturedAgents(featuredData as any)
      }

      // Load all community agents
      const { data: communityData } = await supabase
        .from('user_agents')
        .select(`
          *,
          players!creator_id (username),
          agent_templates!template_id (name, category)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (communityData) {
        setCommunityAgents(communityData as any)
      }
      
      setLoading(false)
    }

    initialize()
  }, [router, searchParams])

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const filteredCommunityAgents = communityAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
                         (agent.description && agent.description.toLowerCase().includes(communitySearchQuery.toLowerCase()))
    return matchesSearch
  })

  const getDifficultyColor = (level: number) => {
    if (level <= 2) return 'bg-green-100 text-green-800'
    if (level <= 3) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getDifficultyText = (level: number) => {
    if (level <= 2) return 'Easy'
    if (level <= 3) return 'Medium'
    return 'Advanced'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pb-20 md:pb-0">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <h1 className="text-2xl font-bold text-gray-800">AI Agents</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm mb-6">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🏗️ Templates
          </button>
          <button
            onClick={() => setActiveTab('my-agents')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my-agents'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            👨‍💻 My Agents ({userAgents.length})
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'community'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🌍 Community
          </button>
        </div>

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <>
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-blue-50 border border-gray-200'
                    }`}
                  >
                    {category.emoji} {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{template.icon}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty_level)}`}>
                          {getDifficultyText(template.difficulty_level)}
                        </span>
                        {template.is_featured && (
                          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-medium">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{template.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{template.description}</p>
                    
                    <div className="mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {template.category}
                      </span>
                    </div>
                    
                    <Link
                      href={`/agents/create?template=${template.id}`}
                      className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Agent
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* My Agents Tab */}
        {activeTab === 'my-agents' && (
          <div className="space-y-4">
            {userAgents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No agents yet</h2>
                <p className="text-gray-600 mb-6">Create your first AI agent from a template!</p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Browse Templates
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white rounded-xl shadow-md border border-gray-100 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{agent.avatar_emoji}</span>
                      <div className="flex items-center space-x-1">
                        {agent.is_published && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Published
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 mb-2">{agent.name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{agent.description}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Play className="w-4 h-4 mr-1" />
                        {agent.play_count} plays
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {agent.like_count} likes
                      </div>
                    </div>
                    
                    <Link
                      href={`/agents/play/${agent.id}`}
                      className="w-full flex items-center justify-center bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Test Agent
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="space-y-8">
            {/* Featured Agents Section */}
            {featuredAgents.length > 0 && (
              <>
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">⭐ Featured Community Agents</h2>
                  <p className="text-gray-600">Top-rated agents from the community!</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredAgents.map((agent: any) => (
                    <div
                      key={agent.id}
                      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-3xl">{agent.avatar_emoji}</span>
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-medium">
                            ⭐ Featured
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{agent.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{agent.description}</p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>by @{agent.players?.username}</span>
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center">
                              <Play className="w-4 h-4 mr-1" />
                              {agent.play_count}
                            </div>
                            <div className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {agent.like_count}
                            </div>
                          </div>
                        </div>
                        
                        <Link
                          href={`/agents/play/${agent.id}`}
                          className="w-full flex items-center justify-center bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Play Agent
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* All Community Agents Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">🌍 Community Gallery</h2>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search community agents..."
                    value={communitySearchQuery}
                    onChange={(e) => setCommunitySearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {filteredCommunityAgents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No community agents yet</h3>
                  <p className="text-gray-600 mb-6">Be the first to publish an agent to the community!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredCommunityAgents.map((agent: any) => (
                    <div
                      key={agent.id}
                      className="bg-white rounded-xl shadow-md border border-gray-100 p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{agent.avatar_emoji}</span>
                        {agent.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-bold text-gray-800 mb-2 line-clamp-1">{agent.name}</h4>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{agent.description || 'No description'}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>@{agent.players?.username || 'Unknown'}</span>
                        <div className="flex items-center space-x-2">
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
                      
                      <Link
                        href={`/agents/play/${agent.id}`}
                        className="w-full flex items-center justify-center bg-blue-500 text-white text-sm py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}