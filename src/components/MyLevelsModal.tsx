'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { X, Trophy, BookOpen, Mic, Edit, ChevronRight } from 'lucide-react'
import { getLevelMappingByDbLevel, PLAYER_LEVEL_MAPPINGS } from '@/lib/level-utils'

interface Language {
  id: string
  language_code: string
  language_name: string
  native_name: string
  flag_emoji: string
  cefr_supported: boolean
  difficulty_levels: string[]
}

interface MyLevelsModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  playerLevels: Record<string, any>
  languages: Language[]
  onEditLevel?: (category: string, language: Language) => void
}

export default function MyLevelsModal({
  user,
  isOpen,
  onClose,
  playerLevels,
  languages,
  onEditLevel
}: MyLevelsModalProps) {
  if (!isOpen) return null

  // Get all categories that have levels set
  const categoriesWithLevels = Object.keys(playerLevels || {})

  // Helper function to get language info by code
  const getLanguageInfo = (languageCode: string) => {
    return languages.find(lang => lang.language_code === languageCode)
  }

  // Helper function to get level display info
  const getLevelDisplayInfo = (levelData: any) => {
    if (!levelData) return null
    
    const mapping = PLAYER_LEVEL_MAPPINGS.find(m => m.textLevel === levelData.textLevel)
    return mapping || {
      textLevel: levelData.textLevel,
      dbLevel: levelData.dbLevel,
      displayName: levelData.textLevel?.toUpperCase() || 'Unknown',
      description: 'Custom level',
      color: 'bg-gray-500'
    }
  }

  // Count total languages with levels set
  const totalLanguagesWithLevels = categoriesWithLevels.reduce((total, category) => {
    return total + Object.keys(playerLevels[category] || {}).length
  }, 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] flex flex-col">
        <div className="p-4 sm:p-6 border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">My Language Levels</h2>
                <p className="text-gray-600">
                  {totalLanguagesWithLevels > 0 
                    ? `${totalLanguagesWithLevels} language${totalLanguagesWithLevels > 1 ? 's' : ''} configured`
                    : 'No language levels set yet'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {categoriesWithLevels.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Language Levels Set</h3>
              <p className="text-gray-600 mb-6">
                You haven't set any language levels yet. Start by selecting a category to set your proficiency level.
              </p>
              <button
                onClick={onClose}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {categoriesWithLevels.map((category) => {
                const categoryLevels = playerLevels[category] || {}
                const languageCodes = Object.keys(categoryLevels)

                return (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {category === 'speaking' && <Mic className="w-5 h-5 text-blue-500" />}
                        {category === 'reading' && <BookOpen className="w-5 h-5 text-green-500" />}
                        {category === 'writing' && <Edit className="w-5 h-5 text-purple-500" />}
                        <h3 className="text-lg font-semibold text-gray-800 capitalize">{category}</h3>
                      </div>
                      <div className="text-sm text-gray-500">
                        {languageCodes.length} language{languageCodes.length > 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {languageCodes.map((languageCode) => {
                        const languageInfo = getLanguageInfo(languageCode)
                        const levelData = categoryLevels[languageCode]
                        const levelDisplayInfo = getLevelDisplayInfo(levelData)

                        if (!languageInfo || !levelDisplayInfo) return null

                        return (
                          <div
                            key={`${category}-${languageCode}`}
                            className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{languageInfo.flag_emoji}</span>
                                <div>
                                  <div className="font-semibold text-gray-800">
                                    {languageInfo.language_name}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {languageInfo.native_name}
                                  </div>
                                </div>
                              </div>
                              {onEditLevel && (
                                <button
                                  onClick={() => onEditLevel(category, languageInfo)}
                                  className="text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${levelDisplayInfo.color}`}>
                                {levelDisplayInfo.dbLevel}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-gray-800">
                                  {levelDisplayInfo.displayName}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {levelDisplayInfo.description}
                                </div>
                              </div>
                            </div>

                            {levelData.updatedAt && (
                              <div className="mt-3 text-xs text-gray-500">
                                Updated {new Date(levelData.updatedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Tip: Click the edit icon to update your language level
            </div>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 