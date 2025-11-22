'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { X, Globe, ChevronRight, Settings, Play, Star, Heart, Target } from 'lucide-react'

interface Language {
  id: string
  language_code: string
  language_name: string
  native_name: string
  flag_emoji: string
  cefr_supported: boolean
  difficulty_levels: string[]
}

interface SpeakingContinueModalProps {
  user: User
  languages: Language[]
  isOpen: boolean
  onClose: () => void
  onContinueLearning: (language: Language) => void
  onChangeLanguage: () => void
  onChangeLevel?: (language: Language) => void
  playerLevels?: Record<string, any>
  lastLanguage?: Language | null
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

export default function SpeakingContinueModal({
  user,
  languages,
  isOpen,
  onClose,
  onContinueLearning,
  onChangeLanguage,
  onChangeLevel,
  playerLevels = {},
  lastLanguage
}: SpeakingContinueModalProps) {
  if (!isOpen) return null

  // Get the user's level for the last language
  const currentLevel = lastLanguage && playerLevels.speaking?.[lastLanguage.language_code]?.textLevel

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 rounded-3xl shadow-2xl max-w-2xl w-full h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] border-4 border-white flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-800 mb-2">Speaking</h2>
              </div>
            </div>
            <KidButton variant="danger" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </KidButton>
          </div>

          {/* Last Language Display */}
          {lastLanguage ? (
            <div className="mb-8">
              <KidCard className="p-6 bg-gradient-to-r from-pink-50 to-red-50 border-pink-300">
                <div className="text-center">
                  <div className="mb-4">
                    <span className="text-6xl">{lastLanguage.flag_emoji}</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    {lastLanguage.language_name}
                  </h3>
                  <p className="text-gray-600 mb-4">{lastLanguage.native_name}</p>
                  
                  {currentLevel && (
                    <div className="mb-6">
                      <p className="text-sm text-gray-600 font-bold mb-2">Your Current Level:</p>
                      <KidBadge color="pink">
                        <Star className="w-4 h-4 mr-1" />
                        {currentLevel.toUpperCase()}
                      </KidBadge>
                    </div>
                  )}
                  
                  <div className="flex justify-center">
                    <KidButton 
                      variant="success" 
                      size="lg"
                      onClick={() => onContinueLearning(lastLanguage)}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Continue Learning
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </KidButton>
                  </div>
                </div>
              </KidCard>
              
              {/* Action Buttons - Outside the card */}
              <div className="flex flex-row gap-2 justify-center mt-6">
              {currentLevel && onChangeLevel && lastLanguage && (
                  <KidButton 
                    variant="warning" 
                    size="sm"
                    onClick={() => onChangeLevel(lastLanguage)}
                    className="opacity-80 hover:opacity-100"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Change Level
                  </KidButton>
                )}
                <KidButton 
                  variant="secondary" 
                  size="sm"
                  onClick={onChangeLanguage}
                  className="opacity-80 hover:opacity-100"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Change Language
                </KidButton>
              </div>
            </div>
          ) : (
            // No previous language - show start fresh message
            <div className="mb-8">
              <KidCard className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300">
                <div className="text-center">
                  <div className="mb-4">
                    <span className="text-6xl">🌍</span>
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">
                    Start Your Speaking Journey!
                  </h3>
                  <p className="text-gray-600 mb-6">Choose a language to begin your pronunciation practice.</p>
                  
                  <KidButton 
                    variant="primary" 
                    size="lg"
                    onClick={onChangeLanguage}
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    Choose Language
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </KidButton>
                </div>
              </KidCard>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  )
}