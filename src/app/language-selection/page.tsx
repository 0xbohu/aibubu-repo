'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Globe, Star, Heart } from 'lucide-react'
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

export default function LanguageSelectionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)

  // Get parameters from URL
  const category = searchParams.get('category') || 'speaking'
  const returnTo = searchParams.get('returnTo') || '/dashboard'

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)

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

  const handleLanguageSelect = (language: Language) => {
    // Navigate to the return URL with the selected language
    if (returnTo === '/speaking/continue') {
      router.push(`/speaking/continue?language=${language.language_code}`)
    } else if (returnTo.includes('/assessment/')) {
      router.push(`/assessment/${category}/${language.language_code}`)
    } else {
      router.push(`${returnTo}?language=${language.language_code}&category=${category}`)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {user && (
        <AppHeader
          user={user}
          title="Choose Language"
          subtitle="Choose a language to learn"
          showBackButton={true}
        />
      )}

      <main className="max-w-6xl mx-auto p-4 sm:p-6">
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
                onClick={() => handleLanguageSelect(language)}
                className={`p-6 cursor-pointer transition-all border-gray-200 hover:border-pink-300 ${
                  index === 0 ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''
                }`}
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
                onClick={() => handleLanguageSelect(language)}
                className="p-4 cursor-pointer transition-all border-gray-200 hover:border-purple-300"
              >
                <div className="text-center">
                  <span className="text-3xl mb-2 block">{language.flag_emoji}</span>
                  <div className="font-bold text-gray-800 text-sm mb-1 truncate">
                    {language.language_name}
                  </div>
                  <div className="text-xs text-gray-600 truncate mb-2">
                    {language.native_name}
                  </div>
                </div>
              </KidCard>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}