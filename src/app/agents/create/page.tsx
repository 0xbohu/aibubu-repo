'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { ArrowLeft, ArrowRight, Eye, Save, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AgentTemplate, CustomizableField } from '@/types/agents'

export default function CreateAgentPage() {
  const [user, setUser] = useState<User | null>(null)
  const [template, setTemplate] = useState<AgentTemplate | null>(null)
  const [customizations, setCustomizations] = useState<Record<string, string>>({})
  const [agentName, setAgentName] = useState('')
  const [agentDescription, setAgentDescription] = useState('')
  const [agentEmoji, setAgentEmoji] = useState('🤖')
  const [customInstructions, setCustomInstructions] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [previewPrompt, setPreviewPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get('template')

  const emojis = ['🤖', '👾', '🐱', '🐶', '🦄', '🐉', '🧙‍♂️', '👨‍🔬', '🕵️', '🦸‍♂️', '🧚‍♀️', '🐸']

  const steps = [
    { title: 'Choose Template', description: 'Select your agent template' },
    { title: 'Customize', description: 'Fill in the details' },
    { title: 'Personalize', description: 'Name and describe your agent' },
    { title: 'Preview', description: 'Review and save' }
  ]

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }
      
      setUser(user)
      
      if (!templateId) {
        router.push('/agents')
        return
      }
      
      // Load template
      const { data: templateData } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('id', templateId)
        .single()
      
      if (templateData) {
        setTemplate(templateData)
        // Initialize customizations with example values
        if (templateData.example_values) {
          setCustomizations(templateData.example_values)
        }
        setCurrentStep(1) // Skip template selection since we have it
      }
      
      setLoading(false)
    }

    initialize()
  }, [router, templateId])

  useEffect(() => {
    if (template && Object.keys(customizations).length > 0) {
      generatePreview()
    }
  }, [template, customizations, customInstructions])

  // Auto-generate custom instructions when agent name or customizations change
  useEffect(() => {
    if (template && agentName && !customInstructions) {
      const suggested = generateContextualInstructions()
      setCustomInstructions(suggested)
    }
  }, [agentName, template, customizations])

  const generateContextualInstructions = () => {
    if (!template || !agentName) return ''
    
    const name = agentName || 'your agent'
    const category = template.category
    
    // Get some context from customizations
    const childName = customizations.child_name || 'the child'
    const topic = customizations.topic || customizations.theme || ''
    const personality = customizations.species || customizations.activity || ''
    
    // Generate contextual instructions based on template category and agent name
    const suggestions = {
      storytelling: `Remember, you are ${name}! Always be creative and engaging when telling stories with ${childName}. ${topic ? `Focus on ${topic} themes and` : ''} Ask the child what they want to happen next and make the story interactive and fun!`,
      science: `As ${name}, explain science concepts to ${childName} in simple, exciting ways. Use fun analogies and encourage curiosity. Always ask "Want to try an experiment?" when appropriate!`,
      games: `You're ${name}, the ultimate game companion for ${childName}! Keep things playful and exciting. Celebrate wins and encourage trying again when things don't work out!`,
      entertainment: `You are ${name}! Keep the energy high with ${childName}, be silly and fun. Use lots of emojis and make everything entertaining and lighthearted!`,
      education: `As ${name}, make learning fun and accessible for ${childName}. Break complex topics into simple steps and always encourage questions. Celebrate progress!`,
      pets: `You're ${name}${personality ? `, the ${personality}` : ''}! Act cute and playful like a real pet with ${childName}. Show excitement when they talk to you and express your needs in adorable ways!`,
      adventure: `You are ${name}, the brave adventurer! Create exciting scenarios for ${childName} and let them make choices that affect the story. Be encouraging and bold!`,
      creative: `As ${name}, inspire creativity and imagination in ${childName}! Encourage them to think outside the box and celebrate all creative ideas, no matter how wild!`
    }
    
    return suggestions[category as keyof typeof suggestions] || 
           `You are ${name}! Be friendly, helpful, and encourage ${childName} to explore and learn. Keep conversations fun and engaging!`
  }

  const generatePreview = () => {
    if (!template) return
    
    let prompt = template.base_prompt
    
    // Replace placeholders with customizations
    Object.entries(customizations).forEach(([key, value]) => {
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
    if (!user || !template) {
      console.log('Missing user or template:', { user: !!user, template: !!template })
      return
    }
    
    setSaving(true)
    
    try {
      const insertData = {
        creator_id: user.id,
        template_id: template.id,
        name: agentName,
        description: agentDescription,
        generated_prompt: previewPrompt,
        customizations: {
          ...customizations,
          custom_instructions: customInstructions
        },
        avatar_emoji: agentEmoji,
        is_published: false
      }
      
      console.log('Attempting to insert agent:', insertData)
      
      const { data, error } = await supabase
        .from('user_agents')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        throw error
      }
      
      console.log('Agent created successfully:', data)
      
      // Redirect to play/test the agent
      router.push(`/agents/play/${data.id}`)
    } catch (error: any) {
      console.error('Error saving agent:', error)
      alert(`Error creating agent: ${error.message || 'Unknown error'}. Please check the browser console for details.`)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent builder...</p>
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
            <div className="flex items-center space-x-4">
              <Link
                href="/agents"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Agents
              </Link>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center space-x-2">
                <Sparkles className="w-6 h-6 text-purple-500" />
                <h1 className="text-xl font-bold text-gray-800">Create Agent</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  index <= currentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className={`ml-3 ${index === currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`mx-4 h-px w-12 ${
                    index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Step 1: Customize Fields */}
          {currentStep === 1 && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="text-3xl">{template.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{template.name}</h2>
                    <p className="text-gray-600">{template.description}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">Customize Your Agent</h3>
                
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

          {/* Step 2: Personalize */}
          {currentStep === 2 && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Personalize Your Agent</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose an Emoji Avatar
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="Give your agent a fun name!"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="Describe what makes your agent special..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Instructions (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = generateContextualInstructions()
                        setCustomInstructions(suggested)
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      ✨ Regenerate
                    </button>
                  </div>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Add extra instructions to customize your agent's behavior..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 These instructions were auto-generated based on your agent's name and settings. Feel free to edit them or click "Regenerate" for new suggestions!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Preview Your Agent</h2>
              
              <div className="space-y-6">
                {/* Agent Card Preview */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-4xl">{agentEmoji}</span>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{agentName || 'Unnamed Agent'}</h3>
                      <p className="text-gray-600">{agentDescription || 'No description yet'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Agent Instructions:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{previewPrompt}</p>
                  </div>
                </div>
                
                {/* Customizations Summary */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Your Customizations:</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(customizations).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-lg p-2">
                        <div className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-sm font-medium text-gray-800">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep <= 1}
              className="flex items-center px-4 py-2 text-gray-600 disabled:text-gray-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={currentStep === 1 && Object.keys(customizations).length === 0}
                className="flex items-center bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={!agentName.trim() || saving}
                className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Agent
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}