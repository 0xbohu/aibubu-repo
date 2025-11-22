'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, Save, Eye } from 'lucide-react'
import Link from 'next/link'
import { UserAgent, AgentTemplate, CustomizableField } from '@/types/agents'

export default function EditAgentPage() {
  const [user, setUser] = useState<User | null>(null)
  const [agent, setAgent] = useState<UserAgent | null>(null)
  const [template, setTemplate] = useState<AgentTemplate | null>(null)
  const [customizations, setCustomizations] = useState<Record<string, string>>({})
  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [agentEmoji, setAgentEmoji] = useState('🤖')
  const [customInstructions, setCustomInstructions] = useState('')
  const [previewPrompt, setPreviewPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()
  const params = useParams()
  const agentId = params.id as string

  const emojis = ['🤖', '👾', '🐱', '🐶', '🦄', '🐉', '🧙‍♂️', '👨‍🔬', '🕵️', '🦸‍♂️', '🧚‍♀️', '🐸']

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      // Load agent data
      const { data: agentData } = await supabase
        .from('user_agents')
        .select('*')
        .eq('id', agentId)
        .eq('creator_id', user.id) // Only allow editing own agents
        .single()
      
      if (!agentData) {
        router.push('/agents')
        return
      }
      
      setAgent(agentData)
      setCustomizations(agentData.customizations)
      setAgentName(agentData.name)
      setAgentDescription(agentData.description || '')
      setAgentEmoji(agentData.avatar_emoji)
      setCustomInstructions(agentData.customizations?.custom_instructions || '')
      
      // Load template if available
      if (agentData.template_id) {
        const { data: templateData } = await supabase
          .from('agent_templates')
          .select('*')
          .eq('id', agentData.template_id)
          .single()
        
        if (templateData) {
          setTemplate(templateData)
        }
      }
      
      setLoading(false)
    }

    initialize()
  }, [router, agentId])

  useEffect(() => {
    if (template && Object.keys(customizations).length > 0) {
      generatePreview()
    }
  }, [template, customizations, customInstructions])

  const generatePreview = () => {
    if (!template) return
    
    let prompt = template.base_prompt
    
    // Replace placeholders with customizations
    Object.entries(customizations).forEach(([key, value]) => {
      // Skip custom_instructions as it's handled separately
      if (key === 'custom_instructions') return
      const placeholder = `{{${key}}}`
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value || `[${key}]`)
    })
    
    // Add custom instructions if provided
    if (customInstructions.trim()) {
      prompt += `\n\nAdditional Instructions: ${customInstructions.trim()}`
    }
    
    setPreviewPrompt(prompt)
  }

  const handleCustomizationChange = (fieldName: string, value: string) => {
    setCustomizations(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSave = async () => {
    if (!user || !agent) return
    
    setSaving(true)
    
    try {
      const updateData: any = {
        name: agentName,
        description: agentDescription,
        avatar_emoji: agentEmoji,
      }

      // Only update customizations and generated_prompt if we have a template
      if (template) {
        updateData.customizations = {
          ...customizations,
          custom_instructions: customInstructions
        }
        updateData.generated_prompt = previewPrompt
      }

      const { error } = await supabase
        .from('user_agents')
        .update(updateData)
        .eq('id', agentId)
      
      if (error) throw error
      
      // Redirect back to the play page
      router.push(`/agents/play/${agentId}`)
    } catch (error) {
      console.error('Error updating agent:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/agents/play/${agentId}`}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Agent
            </Link>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/agents/play/${agentId}`}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Link>
              
              <button
                onClick={handleSave}
                disabled={!agentName.trim() || saving}
                className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Agent</h2>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="border-b border-gray-100 pb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                
                <div className="space-y-4">
                  {/* Emoji Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Avatar Emoji
                    </label>
                    <div className="grid grid-cols-6 gap-3">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setAgentEmoji(emoji)}
                          className={`text-3xl p-3 rounded-lg border-2 transition-colors ${
                            agentEmoji === emoji
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Agent Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={agentDescription}
                      onChange={(e) => setAgentDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Instructions (Optional)
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Add extra instructions to customize your agent's behavior..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Example: "Always respond with enthusiasm and use lots of emojis!" or "Explain things in a simple way that a 10-year-old can understand"
                    </p>
                  </div>
                </div>
              </div>

              {/* Customizations (only show if template exists) */}
              {template && (
                <div className="border-b border-gray-100 pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Template Customizations
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(template.customizable_fields as Record<string, CustomizableField>).map(([fieldName, field]) => (
                      <div key={fieldName}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        
                        {field.type === 'text' && (
                          <input
                            type="text"
                            value={customizations[fieldName] || ''}
                            onChange={(e) => handleCustomizationChange(fieldName, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                        
                        {field.type === 'select' && (
                          <select
                            value={customizations[fieldName] || ''}
                            onChange={(e) => handleCustomizationChange(fieldName, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Choose...</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === 'textarea' && (
                          <textarea
                            value={customizations[fieldName] || ''}
                            onChange={(e) => handleCustomizationChange(fieldName, e.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview (only show if template exists) */}
              {template && previewPrompt && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="text-4xl">{agentEmoji}</span>
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">{agentName || 'Unnamed Agent'}</h4>
                        <p className="text-gray-600">{agentDescription || 'No description yet'}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <h5 className="font-semibold text-gray-800 mb-2">Agent Instructions:</h5>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{previewPrompt}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}