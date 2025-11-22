'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthConfirmPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Confirming your email...')

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')

        if (!accessToken || !refreshToken) {
          setStatus('error')
          setMessage('Invalid confirmation link. Please try signing up again.')
          return
        }

        // Set the session using the tokens from the email link
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (error) {
          console.error('Error setting session:', error)
          setStatus('error')
          setMessage('Failed to confirm email. Please try again.')
          return
        }

        if (data.user) {
          // Check if player record exists, create if not
          const { data: playerData, error: playerCheckError } = await supabase
            .from('players')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (playerCheckError && playerCheckError.code === 'PGRST116') {
            // Player doesn't exist, create it
            const { error: playerError } = await supabase
              .from('players')
              .insert({
                id: data.user.id,
                username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
                email: data.user.email,
                total_points: 0,
                current_level: 1,
                player_preferences: {},
                player_levels: {}
              })

            if (playerError) {
              console.error('Error creating player:', playerError)
            }
          }

          setStatus('success')
          setMessage('Email confirmed successfully! Redirecting to dashboard...')
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    handleEmailConfirmation()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirming Email</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Confirmed!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirmation Failed</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => router.push('/signup')}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-2 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              Back to Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  )
}
