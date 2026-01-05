import { useState, useCallback } from 'react'

// Helper function to generate a gradient banner as data URL
async function generateGradientBanner(gradient: string, text: string, textColor: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 300
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        console.error('Could not get canvas context')
        reject(new Error('Could not get canvas context'))
        return
      }

      // Parse gradient colors from CSS gradient string
      // Example: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)
      const gradientMatch = gradient.match(/#[0-9A-Fa-f]{6}/g)
      const colors = gradientMatch || ['#3B82F6', '#2563EB']
      
      if (colors.length === 0) {
        console.error('No colors found in gradient')
        reject(new Error('No colors found in gradient'))
        return
      }
      
      // Create linear gradient
      const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      if (colors.length === 1) {
        grd.addColorStop(0, colors[0])
        grd.addColorStop(1, colors[0])
      } else {
        const step = 1 / (colors.length - 1)
        colors.forEach((color, index) => {
          grd.addColorStop(index * step, color)
        })
      }
      
      // Fill with gradient
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add text with shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillStyle = textColor
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(text, canvas.width / 2, canvas.height / 2)
      
      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/png')
      console.log('Generated gradient banner, data URL length:', dataUrl.length)
      resolve(dataUrl)
    } catch (error) {
      console.error('Error generating gradient banner:', error)
      reject(error)
    }
  })
}

export interface ProgramContext {
  companyName: string
  businessType: string | null
  averageTransaction: number | null
  visitFrequency: string | null
  uniqueValues: string[]
  programObjective: string | null
  loyaltyType: 'points' | 'stamps' | null
}

export interface Tier {
  order: number
  name: string
  pointsRequired: number
  color: string | null
  benefits: string[]
}

export interface Benefit {
  name: string
  description: string
  tierName: string
}

export interface ImageOption {
  url: string | null
  style: string
  prompt: string
  gradient?: string
  textColor?: string
  icon?: string
}

export interface StampReward {
  stampsRequired: number
  rewardName: string
  rewardDescription: string | null
}

export interface ProgramBuilderState {
  // Context
  context: ProgramContext
  step: 'context' | 'name' | 'tiers' | 'benefits' | 'stamps' | 'image' | 'review'
  
  // Suggestions
  programNameSuggestions: Array<{ name: string; explanation: string }>
  selectedProgramName: string | null
  
  tierSuggestions: Tier[]
  selectedTiers: Tier[]
  
  benefitSuggestions: Record<string, Benefit[]>
  selectedBenefits: Record<string, Benefit[]>
  
  // Stamp program fields
  stampsRequired: number
  stampRewards: StampReward[]
  
  imageSuggestions: ImageOption[]
  selectedImage: string | null
  
  // Program details
  programDescription: string | null
  pointsEarningRules: string | null
  pointsMultiplier: number
  
  // UI state
  isGenerating: boolean
  chatHistory: Array<{ role: 'ai' | 'user'; content: string; timestamp: Date }>
}

const initialState: ProgramBuilderState = {
  context: {
    companyName: '',
    businessType: null,
    averageTransaction: null,
    visitFrequency: null,
    uniqueValues: [],
    programObjective: null,
    loyaltyType: null,
  },
  step: 'context',
  programNameSuggestions: [],
  selectedProgramName: null,
  tierSuggestions: [],
  selectedTiers: [],
  benefitSuggestions: {},
  selectedBenefits: {},
  stampsRequired: 10,
  stampRewards: [],
  imageSuggestions: [],
  selectedImage: null,
  programDescription: null,
  pointsEarningRules: null,
  pointsMultiplier: 1.0,
  isGenerating: false,
  chatHistory: [],
}

export function useProgramBuilder() {
  const [state, setState] = useState<ProgramBuilderState>(initialState)

  const updateContext = useCallback((updates: Partial<ProgramContext>) => {
    setState((prev) => ({
      ...prev,
      context: { ...prev.context, ...updates },
    }))
  }, [])

  const selectProgramName = useCallback((name: string) => {
    setState((prev) => {
      // Move to appropriate step based on loyalty type
      const nextStep = prev.context.loyaltyType === 'stamps' ? 'stamps' : 'tiers'
      return {
        ...prev,
        selectedProgramName: name,
        step: nextStep,
      }
    })
  }, [])

  const updateTiers = useCallback((tiers: Tier[], advanceStep: boolean = false) => {
    setState((prev) => ({
      ...prev,
      selectedTiers: tiers,
      step: advanceStep && prev.step === 'tiers' ? 'benefits' : prev.step,
    }))
  }, [])

  const updateBenefits = useCallback((tierName: string, benefits: Benefit[], advanceStep: boolean = false) => {
    setState((prev) => ({
      ...prev,
      selectedBenefits: {
        ...prev.selectedBenefits,
        [tierName]: benefits,
      },
      step: advanceStep && prev.step === 'benefits' ? 'image' : prev.step,
    }))
  }, [])

  const selectImage = useCallback((imageUrl: string) => {
    // If imageUrl is empty or null, don't set it but still advance to review
    setState((prev) => ({
      ...prev,
      selectedImage: imageUrl || null,
      step: 'review',
    }))
  }, [])

  const generateSuggestions = useCallback(async (type: 'name' | 'tiers' | 'benefits' | 'image') => {
    setState((prev) => ({ ...prev, isGenerating: true }))

    try {
      const requestBody: any = { context: state.context }
      
      // Add additional context based on type
      if (type === 'benefits') {
        requestBody.tiers = state.selectedTiers
      }
      if (type === 'image') {
        requestBody.programName = state.selectedProgramName
      }

      const response = await fetch(`/api/ai/program/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(`Failed to generate ${type} suggestions:`, errorData)
        throw new Error(errorData.error || 'Failed to generate suggestions')
      }

      const data = await response.json()
      console.log(`Generated ${type} suggestions:`, data)

      // Handle benefits case separately
      if (type === 'benefits') {
        // Update benefits and stop generating
        setState((prev) => ({
          ...prev,
          benefitSuggestions: data.benefits || {},
          step: 'benefits',
          isGenerating: false,
        }))
        
        // Generate image suggestions in background (don't wait for it)
        fetch('/api/ai/program/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            context: state.context,
            programName: state.selectedProgramName 
          }),
        })
        .then((imageResponse) => imageResponse.json())
        .then((imageResponse) => {
          if (imageResponse.ok) {
            return imageResponse.json()
          }
          throw new Error('Failed to fetch images')
        })
        .then((imageData) => {
          setState((prev) => ({
            ...prev,
            imageSuggestions: imageData.images || [],
          }))
        })
        .catch((error) => {
          console.error('Error generating image suggestions:', error)
        })
        return
      }

      // Handle other types normally
      setState((prev) => {
        switch (type) {
          case 'name':
            return {
              ...prev,
              programNameSuggestions: data.suggestions || [],
              step: 'name',
              isGenerating: false,
            }
          case 'tiers':
            return {
              ...prev,
              tierSuggestions: data.tiers || [],
              selectedTiers: data.tiers || [],
              step: 'tiers',
              isGenerating: false,
            }
          case 'image':
            return {
              ...prev,
              imageSuggestions: data.images || [],
              step: 'image',
              isGenerating: false,
            }
          default:
            return { ...prev, isGenerating: false }
        }
      })
    } catch (error: any) {
      console.error('Error generating suggestions:', error)
      setState((prev) => ({ 
        ...prev, 
        isGenerating: false,
        // Show error in UI - you might want to add an error state
      }))
      alert(`Failed to generate ${type} suggestions: ${error.message || 'Unknown error'}. Please try again.`)
    }
  }, [state.context, state.selectedTiers, state.selectedProgramName])

  const updateStamps = useCallback((stampsRequired: number, stampRewards: StampReward[], advanceStep: boolean = false) => {
    setState((prev) => ({
      ...prev,
      stampsRequired,
      stampRewards,
      step: advanceStep && prev.step === 'stamps' ? 'image' : prev.step,
    }))
  }, [])

  const saveProgram = useCallback(async () => {
    // Validate based on program type
    if (!state.context.companyName || !state.selectedProgramName) {
      return { success: false, error: 'Please complete all required fields' }
    }

    if (state.context.loyaltyType === 'points' && state.selectedTiers.length === 0) {
      return { success: false, error: 'Please configure at least one tier' }
    }

    if (state.context.loyaltyType === 'stamps' && state.stampRewards.length === 0) {
      return { success: false, error: 'Please configure at least one reward milestone' }
    }

    try {
      // Determine banner image URL
      let bannerImageUrl: string | null = null
      
      if (state.selectedImage && !state.selectedImage.startsWith('gradient-')) {
        // Real image URL
        bannerImageUrl = state.selectedImage
      } else if (state.selectedImage && state.selectedImage.startsWith('gradient-')) {
        // Gradient selection - find the corresponding gradient and create a data URL
        const gradientIndex = parseInt(state.selectedImage.replace('gradient-', ''))
        const selectedImageOption = state.imageSuggestions[gradientIndex]
        
        if (selectedImageOption && selectedImageOption.gradient) {
          try {
            // Create a data URL from the gradient using canvas
            bannerImageUrl = await generateGradientBanner(
              selectedImageOption.gradient,
              state.selectedProgramName || state.context.companyName,
              selectedImageOption.textColor || '#FFFFFF'
            )
            console.log('Generated banner image URL from gradient')
          } catch (error) {
            console.error('Failed to generate gradient banner:', error)
            // Fallback to null if generation fails
            bannerImageUrl = null
          }
        } else {
          console.warn('Selected image option not found or missing gradient:', selectedImageOption)
        }
      }

      // Step 1: Create SME account
      const smeResponse = await fetch('/api/smes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyName: state.context.companyName,
              bannerImageUrl: bannerImageUrl,
            }),
      })

      if (!smeResponse.ok) {
        const errorData = await smeResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || 'Failed to create SME account'
        console.error('SME creation failed:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      const smeData = await smeResponse.json()
      const smeId = smeData.id

      // Step 3: Create program (points or stamps)
      const programResponse = await fetch(`/api/smes/id/${smeId}/program`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName: state.selectedProgramName,
          programDescription: state.programDescription || `Welcome to ${state.selectedProgramName}!`,
          pointsEarningRules: state.context.loyaltyType === 'points' 
            ? (state.pointsEarningRules || `Earn ${state.pointsMultiplier} point${state.pointsMultiplier !== 1 ? 's' : ''} for every dollar spent.`)
            : null,
          pointsMultiplier: state.pointsMultiplier,
          loyaltyType: state.context.loyaltyType || 'points',
          stampsRequired: state.context.loyaltyType === 'stamps' ? state.stampsRequired : null,
          tiers: state.context.loyaltyType === 'points' ? state.selectedTiers.map((tier) => {
            // Get benefits for this tier from selectedBenefits
            const tierBenefits = state.selectedBenefits[tier.name] || []
            const benefitNames = tierBenefits.length > 0 
              ? tierBenefits.map((b: any) => b.name).join(',')
              : tier.benefits.join(',')
            
            return {
              name: tier.name,
              pointsRequired: tier.pointsRequired,
              benefits: benefitNames,
              color: tier.color,
              order: tier.order,
            }
          }) : [],
          stampRewards: state.context.loyaltyType === 'stamps' ? state.stampRewards.map((reward, index) => ({
            stampsRequired: reward.stampsRequired,
            rewardName: reward.rewardName,
            rewardDescription: reward.rewardDescription,
            order: index,
          })) : [],
        }),
      })

      if (!programResponse.ok) {
        const errorData = await programResponse.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || 'Failed to create program'
        console.error('Program creation failed:', errorMessage, errorData)
        throw new Error(errorMessage)
      }

      return {
        success: true,
        smeId,
        uniqueLinkId: smeData.uniqueLinkId,
      }
    } catch (error: any) {
      console.error('Error saving program:', error)
      return { success: false, error: error.message || 'Failed to save program' }
    }
  }, [state])

  return {
    state,
    updateContext,
    selectProgramName,
    updateTiers,
    updateBenefits,
    updateStamps,
    selectImage,
    generateSuggestions,
    saveProgram,
  }
}

