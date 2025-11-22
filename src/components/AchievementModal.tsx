'use client'

import { Achievement } from '@/lib/achievements'
import { X, Trophy } from 'lucide-react'

interface AchievementModalProps {
  achievement: Achievement | null
  onClose: () => void
}

export default function AchievementModal({ achievement, onClose }: AchievementModalProps) {
  if (!achievement || !achievement.title) return null
  
  // Provide defaults for missing properties
  const safeAchievement = {
    title: achievement.title || 'Achievement Unlocked!',
    description: achievement.description || 'Great job!',
    icon: achievement.icon || '🏆',
    badge_color: achievement.badge_color || 'gray'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full h-full max-h-[calc(100vh-16px)] sm:max-h-[calc(100vh-32px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 sm:p-6 text-center relative flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-6xl mb-4">{safeAchievement.icon}</div>
          <h2 className="text-2xl font-bold text-white">Achievement Unlocked!</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 text-center">
          <div className={`inline-flex items-center px-4 py-2 rounded-full mb-4 ${
            safeAchievement.badge_color === 'gold' ? 'bg-yellow-100 text-yellow-800' :
            safeAchievement.badge_color === 'green' ? 'bg-green-100 text-green-800' :
            safeAchievement.badge_color === 'blue' ? 'bg-blue-100 text-blue-800' :
            safeAchievement.badge_color === 'purple' ? 'bg-purple-100 text-purple-800' :
            safeAchievement.badge_color === 'orange' ? 'bg-orange-100 text-orange-800' :
            safeAchievement.badge_color === 'teal' ? 'bg-teal-100 text-teal-800' :
            safeAchievement.badge_color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
            safeAchievement.badge_color === 'indigo' ? 'bg-indigo-100 text-indigo-800' :
            safeAchievement.badge_color === 'red' ? 'bg-red-100 text-red-800' :
            safeAchievement.badge_color === 'rainbow' ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white' :
            'bg-gray-100 text-gray-800'
          }`}>
            <Trophy className="w-4 h-4 mr-2" />
            {safeAchievement.badge_color.toUpperCase()} BADGE
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">{safeAchievement.title}</h3>
          <p className="text-gray-600 mb-6">{safeAchievement.description}</p>
          
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Awesome! 🎉
          </button>
          </div>
        </div>
      </div>
    </div>
  )
}