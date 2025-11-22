'use client'

import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Zap, Medal, Trophy, Star } from 'lucide-react'
import UserDropdown from './UserDropdown'

interface AppHeaderProps {
  user: User
  player?: any
  title?: string
  subtitle?: string
  showBackButton?: boolean
  showVoiceSettings?: boolean
  showTemperature?: boolean
  temperature?: number
  onTemperatureChange?: (temp: number) => void
  onVoiceSettingsClick?: () => void
  onMyLevelsClick?: () => void
  showPlayerStats?: boolean
  tutorials?: any[]
  progress?: Record<string, any>
  className?: string
}


// Badge Component for stats
const StatBadge = ({ 
  icon: Icon, 
  value, 
  label, 
  color 
}: { 
  icon: any; 
  value: string | number; 
  label: string; 
  color: string; 
}) => (
  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border-2 ${color}`}>
    <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
    <span className="hidden sm:inline">{value} {label}</span>
    <span className="sm:hidden">{value}</span>
  </div>
);

export default function AppHeader({
  user,
  player,
  title,
  subtitle,
  showBackButton = false,
  showVoiceSettings = true,
  showTemperature = false,
  temperature = 0.7,
  onTemperatureChange,
  onVoiceSettingsClick,
  onMyLevelsClick,
  showPlayerStats = false,
  tutorials = [],
  progress = {},
  className = ""
}: AppHeaderProps) {
  const router = useRouter()

  return (
    <>
      {/* Main Header */}
      <header className={`bg-white shadow-sm border-b border-gray-100 ${className}`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Logo and Title */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform cursor-pointer"
                >
                  <img
                    src="/aibubu-logo.svg"
                    alt="AiBubu Logo"
                    className="w-8 h-8 sm:w-12 sm:h-12"
                  />
                </button>
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{title}</h1>
                  )}
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-gray-600 truncate hidden sm:block">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Back Button - for tutorial pages */}
              {showBackButton && (
                <>
                  <div className="h-6 w-px bg-gray-300 hidden sm:block" />
                  <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                </>
              )}
            </div>


            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              {/* User Dropdown */}
              <UserDropdown
                user={user}
                player={player}
                showVoiceSettings={showVoiceSettings}
                showTemperature={showTemperature}
                temperature={temperature}
                onTemperatureChange={onTemperatureChange}
                onVoiceSettingsClick={onVoiceSettingsClick}
                onMyLevelsClick={onMyLevelsClick}
              />
            </div>
          </div>
        </div>
      </header>
    </>
  )
}