'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { X, Globe, ChevronRight, Star, Heart } from 'lucide-react'

interface Language {
  id: string
  language_code: string
  language_name: string
  native_name: string
  flag_emoji: string
  cefr_supported: boolean
  difficulty_levels: string[]
}

interface LanguageSelectionModalProps {
  user: User
  languages: Language[]
  isOpen: boolean
  onClose: () => void
  onLanguageSelect: (language: Language) => void
  playerLevels?: Record<string, any>
  pendingCategory?: string
  onGoToTutorials?: (language: Language, category: string) => void
  simpleMode?: boolean // New prop to show only language selection
}

// AiBubu UI Components (matching dashboard style)
const KidCard = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
}) => (
  <div
    className={`bg-white rounded-3xl shadow-lg border-4 border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:scale-105 ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const KidButton = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white",
    secondary: "bg-gradient-to-r from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white",
    success: "bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white",
    warning: "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white",
    danger: "bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const buttonClasses = `${variants[variant]} ${sizes[size]} font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-4 border-white/30 inline-flex items-center justify-center whitespace-nowrap ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`;

  return (
    <button className={buttonClasses} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

const KidBadge = ({ children, color = "blue" }: { children: React.ReactNode; color?: "blue" | "green" | "yellow" | "purple" | "pink" | "gray" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    green: "bg-green-100 text-green-800 border-green-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
    pink: "bg-pink-100 text-pink-800 border-pink-300",
    gray: "bg-gray-100 text-gray-800 border-gray-300",
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 ${colors[color]}`}>
      {children}
    </span>
  );
};

export default function LanguageSelectionModal({
  user,
  languages,
  isOpen,
  onClose,
  onLanguageSelect,
  playerLevels = {},
  pendingCategory = '',
  onGoToTutorials,
  simpleMode = false
}: LanguageSelectionModalProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null)

  if (!isOpen) return null

  const handleContinue = () => {
    if (selectedLanguage) {
      onLanguageSelect(selectedLanguage)
    }
  }

  const handleGoToTutorials = () => {
    if (selectedLanguage && pendingCategory && onGoToTutorials) {
      onGoToTutorials(selectedLanguage, pendingCategory)
    }
  }

  // Check if user has a level set for the selected language and category
  const hasExistingLevel = selectedLanguage && pendingCategory && 
    playerLevels[pendingCategory]?.[selectedLanguage.language_code]?.textLevel

  // Sort languages with English first, then popular languages, then the rest
  const getPopularLanguages = () => {
    const popularOrder = ['en', 'es', 'fr', 'de', 'zh', 'ja']
    return languages
      .filter(lang => popularOrder.includes(lang.language_code))
      .sort((a, b) => popularOrder.indexOf(a.language_code) - popularOrder.indexOf(b.language_code))
  }

  const getOtherLanguages = () => {
    const popularCodes = ['en', 'es', 'fr', 'de', 'zh', 'ja']
    return languages
      .filter(lang => !popularCodes.includes(lang.language_code))
      .sort((a, b) => a.language_name.localeCompare(b.language_name))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 rounded-3xl shadow-2xl max-w-6xl w-full h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] flex flex-col border-4 border-white">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-gray-600 text-lg">Choose a language to learn</p>
              </div>
            </div>
            <KidButton variant="danger" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </KidButton>
          </div>

          {/* Action Buttons - Only show in normal mode */}
          {!simpleMode && (
            <>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <KidButton variant="secondary" onClick={onClose} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </KidButton>
                
                {hasExistingLevel && (
                  <KidButton variant="success" onClick={handleGoToTutorials} className="flex-1">
                    <Star className="w-4 h-4 mr-2" />
                    Go to Tutorials
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </KidButton>
                )}
                
                <KidButton 
                  variant="primary" 
                  onClick={handleContinue}
                  disabled={!selectedLanguage}
                  className="flex-1"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {hasExistingLevel ? 'Change Level' : 'Let\'s Start!'}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </KidButton>
              </div>

              {/* Selection Feedback - Only show in normal mode */}
              {selectedLanguage && (
                <div className="mb-8">
                  <KidCard className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{selectedLanguage.flag_emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-black text-blue-800 text-lg mb-1">
                          🎉 Great choice! {selectedLanguage.language_name}
                        </h4>
                        <p className="text-blue-600 text-sm">
                          {hasExistingLevel ? (
                            <>
                              Current level: <KidBadge color="blue">{playerLevels[pendingCategory]?.[selectedLanguage.language_code]?.textLevel?.toUpperCase()}</KidBadge> in {pendingCategory}
                            </>
                          ) : (
                            "Next, we'll find your level - it's fun! 🚀"
                          )}
                        </p>
                      </div>
                    </div>
                  </KidCard>
                </div>
              )}
            </>
          )}

          {/* Popular Languages First */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <Star className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-black text-gray-800">⭐ Most Popular</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {getPopularLanguages().map((language, index) => (
                <KidCard
                  key={language.id}
                  onClick={() => simpleMode ? onLanguageSelect(language) : setSelectedLanguage(language)}
                  className={`p-6 cursor-pointer transition-all ${
                    !simpleMode && selectedLanguage?.id === language.id
                      ? 'border-blue-400 bg-blue-50 scale-105'
                      : 'border-gray-200 hover:border-pink-300'
                  } ${index === 0 ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''}`}
                >
                  <div className="text-center">
                    <div className="relative">
                      <span className="text-5xl mb-4 block">{language.flag_emoji}</span>
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2">
                          <KidBadge color="yellow">
                            <Star className="w-3 h-3 mr-1" />
                            #1
                          </KidBadge>
                        </div>
                      )}
                    </div>
                    <h4 className="font-black text-gray-800 text-xl mb-2">
                      {language.language_name}
                    </h4>
                    <p className="text-gray-600 mb-3 text-sm">
                      {language.native_name}
                    </p>
                    
                    <KidBadge color={language.cefr_supported ? "blue" : "purple"}>
                      {language.cefr_supported ? '🎯 CEFR A1-C2' : '📚 Custom Levels'}
                    </KidBadge>
                    
                    {!simpleMode && selectedLanguage?.id === language.id && (
                      <div className="mt-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto flex items-center justify-center animate-pulse">
                          <Heart className="w-4 h-4 text-white fill-current" />
                        </div>
                      </div>
                    )}
                  </div>
                </KidCard>
              ))}
            </div>

            {/* Other Languages */}
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-black text-gray-800">🌏 More Languages</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {getOtherLanguages().map((language) => (
                <KidCard
                  key={language.id}
                  onClick={() => simpleMode ? onLanguageSelect(language) : setSelectedLanguage(language)}
                  className={`p-4 cursor-pointer transition-all ${
                    !simpleMode && selectedLanguage?.id === language.id
                      ? 'border-blue-400 bg-blue-50 scale-105'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">{language.flag_emoji}</span>
                    <div className="font-bold text-gray-800 text-sm mb-1 truncate">
                      {language.language_name}
                    </div>
                    <div className="text-xs text-gray-600 truncate mb-2">
                      {language.native_name}
                    </div>
                    {!simpleMode && selectedLanguage?.id === language.id && (
                      <div className="w-5 h-5 bg-blue-500 rounded-full mx-auto flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </KidCard>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}