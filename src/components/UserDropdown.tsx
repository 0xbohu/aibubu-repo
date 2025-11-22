'use client'

import { useState, useEffect, useRef } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ChevronDown,
  User as UserIcon,
  LogOut,
  Settings,
  Home,
  Trophy,
  Target,
  Star,
  Zap,
  Medal
} from 'lucide-react'

interface UserDropdownProps {
  user: User | null
  player?: any
  showVoiceSettings?: boolean
  showTemperature?: boolean
  temperature?: number
  onTemperatureChange?: (temp: number) => void
  onVoiceSettingsClick?: () => void
  onMyLevelsClick?: () => void
  className?: string
}

export default function UserDropdown({
  user,
  player,
  showVoiceSettings = true,
  showTemperature = false,
  temperature = 0.7,
  onTemperatureChange,
  onVoiceSettingsClick,
  onMyLevelsClick,
  className = ''
}: UserDropdownProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleHomeClick = () => {
    setShowDropdown(false)
    router.push('/dashboard')
  }

  if (!user) return null

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg"
      >
        <UserIcon className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">
          {player?.username || user.email?.split('@')[0] || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
          {/* Player Stats */}
          {player && (
            <>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between space-x-3">
                  <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 border-2 border-yellow-300 px-3 py-2 rounded-full">
                    <Zap className="w-4 h-4" />
                    <span className="font-bold text-sm">{player.total_points || 0} XP</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-purple-100 text-purple-800 border-2 border-purple-300 px-3 py-2 rounded-full">
                    <Medal className="w-4 h-4" />
                    <span className="font-bold text-sm">Level {player.current_level || 1}</span>
                  </div>
                </div>
              </div>
              <hr className="my-1 border-gray-100" />
            </>
          )}

          {/* Temperature Control */}
          {showTemperature && onTemperatureChange && (
            <>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">AI Temperature</h3>
                    <p className="text-xs text-gray-500">Controls AI response creativity</p>
                  </div>
                  <span className="text-sm font-mono text-blue-600">{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Conservative</span>
                  <span>Creative</span>
                </div>
              </div>
              <hr className="my-1 border-gray-100" />
            </>
          )}

          {/* Voice Settings */}
          {showVoiceSettings && onVoiceSettingsClick && (
            <>
              <button
                onClick={() => {
                  setShowDropdown(false)
                  onVoiceSettingsClick()
                }}
                className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Settings className="w-4 h-4" />
                <div>
                  <span>Voice Settings</span>
                  {player?.player_preferences?.voice_settings && (
                    <p className="text-xs text-gray-500">
                      {player.player_preferences.voice_settings.voice_name}
                    </p>
                  )}
                </div>
              </button>
              <hr className="my-1 border-gray-100" />
            </>
          )}

          {/* Navigation */}
          <button
            onClick={handleHomeClick}
            className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          {/* Navigation items - now available for all screen sizes */}
          <button
            onClick={() => {
              setShowDropdown(false)
              if (onMyLevelsClick) {
                onMyLevelsClick()
              } else {
                router.push('/level')
              }
            }}
            className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <Target className="w-4 h-4" />
            <span>My Levels</span>
          </button>

          <button
            onClick={() => {
              setShowDropdown(false)
              router.push('/achievements')
            }}
            className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <Trophy className="w-4 h-4" />
            <span>Achievements</span>
          </button>

          <hr className="my-1 border-gray-100" />

          {/* Sign Out */}
          <button
            onClick={() => {
              setShowDropdown(false)
              handleSignOut()
            }}
            className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}