'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Trophy, Edit, X } from 'lucide-react'
import AppHeader from '@/components/AppHeader'

interface Language {
  id: string
  language_code: string
  language_name: string
  native_name: string
  flag_emoji: string
  cefr_supported: boolean
  difficulty_levels: string[]
}

export default function MyLevelsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<any>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)

      // Get player data
      const { data: playerData } = await supabase
        .from('players')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (playerData) {
        setPlayer(playerData)
      }

      // Load available languages
      const { data: languagesData } = await supabase
        .from('speaking_languages')
        .select('*')
        .eq('is_active', true)
        .order('language_name')
      
      if (languagesData) {
        setLanguages(languagesData)
      }
      
      setLoading(false)
    }

    getUser()
  }, [router])

  const handleEditLevel = (category: string, languageCode: string) => {
    // Navigate to assessment page for editing
    router.push(`/assessment/${category}/${languageCode}`)
  }

  const playerLevels = player?.player_levels || {}
  const categoriesWithLevels = Object.keys(playerLevels).filter(category => 
    Object.keys(playerLevels[category] || {}).length > 0
  )

  const totalLanguagesWithLevels = categoriesWithLevels.reduce((total, category) => {
    return total + Object.keys(playerLevels[category] || {}).length
  }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {user && (
        <AppHeader
          user={user}
          title="My Language Levels"
          subtitle={totalLanguagesWithLevels > 0 
            ? `${totalLanguagesWithLevels} language${totalLanguagesWithLevels > 1 ? 's' : ''} configured`
            : 'No language levels set yet'
          }
          showBackButton={true}
        />
      )}

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        {categoriesWithLevels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Language Levels Set</h3>
            <p className="text-gray-600 mb-6">
              You haven't set any language levels yet. Start by selecting a category to set your proficiency level.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {categoriesWithLevels.map(category => (
              <div key={category} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h3 className="text-xl font-bold text-gray-800 capitalize">{category}</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(playerLevels[category] || {}).map(([languageCode, levelData]: [string, any]) => {
                    const language = languages.find(l => l.language_code === languageCode)
                    if (!language) return null

                    return (
                      <div key={languageCode} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{language.flag_emoji}</span>
                            <div>
                              <h4 className="font-semibold text-gray-800">{language.language_name}</h4>
                              <p className="text-sm text-gray-600">{language.native_name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditLevel(category, languageCode)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit level"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Current Level:</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                              {levelData.textLevel?.toUpperCase() || 'Unknown'}
                            </span>
                          </div>
                          
                          {levelData.updatedAt && (
                            <div className="text-xs text-gray-500">
                              Updated: {new Date(levelData.updatedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Add New Level Button */}
            <div className="text-center">
              <button
                onClick={() => router.push('/language-selection?category=speaking&returnTo=/my-levels')}
                className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                Add New Language Level
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}