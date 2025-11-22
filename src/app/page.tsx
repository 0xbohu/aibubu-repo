import Link from 'next/link'
import { Languages, BookOpen, Trophy, Sparkles, Target, Award } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Header */}
      <header className="p-4 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <img 
                src="/aibubu-logo.svg" 
                alt="AiBubu Logo" 
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">AiBubu</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-200"
            >
              Registration
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            <img 
              src="/aibubu-logo.svg" 
              alt="AiBubu Logo" 
              className="w-48 h-48 drop-shadow-lg"
            />
          </div>
          
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Learn Languages Like a Game!
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Master new languages through interactive lessons, earn points, and track your progress with AI-powered learning
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Feature Cards */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Languages className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Multiple Languages</h3>
              <p className="text-gray-600">Learn English, Spanish, Chinese, and more with personalized lessons adapted to your level</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-green-100 hover:border-green-300 transition-all">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Interactive Lessons</h3>
              <p className="text-gray-600">Engage with AI tutors, practice speaking, reading, writing, and comprehension skills</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100 hover:border-purple-300 transition-all">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Earn Rewards</h3>
              <p className="text-gray-600">Collect XP points, unlock achievements, and level up as you progress through your learning journey</p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-pink-600 mr-2" />
                <h4 className="text-lg font-bold text-gray-800">AI-Powered</h4>
              </div>
              <p className="text-gray-600 text-sm">Personalized learning paths that adapt to your pace and style</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-center mb-3">
                <Target className="w-6 h-6 text-blue-600 mr-2" />
                <h4 className="text-lg font-bold text-gray-800">Track Progress</h4>
              </div>
              <p className="text-gray-600 text-sm">Monitor your improvement with detailed stats and level tracking</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl shadow-md">
              <div className="flex items-center justify-center mb-3">
                <Award className="w-6 h-6 text-orange-600 mr-2" />
                <h4 className="text-lg font-bold text-gray-800">Achievements</h4>
              </div>
              <p className="text-gray-600 text-sm">Unlock badges and celebrate milestones as you learn</p>
            </div>
          </div>

          <div className="space-y-4">
            <Link
              href="/signup"
              className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start Learning Today! 🚀
            </Link>
            
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-blue-500 font-semibold hover:text-blue-600 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}