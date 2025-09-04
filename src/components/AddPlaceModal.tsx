'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Toast from './Toast'

// Interface for the modal props
interface AddPlaceModalProps {
  isOpen: boolean
  onClose: () => void
  onPlaceAdded: () => void // Callback to refresh the places list
}

// Interface for the place form data
interface PlaceFormData {
  name: string
  category: string
  price_band: string
  url: string
  maps_url: string
  notes: string
  veg_friendly: boolean
}

export default function AddPlaceModal({ isOpen, onClose, onPlaceAdded }: AddPlaceModalProps) {
  // Ref for auto-focusing the first input
  const nameInputRef = useRef<HTMLInputElement>(null)
  
  // State for form data
  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    category: '',
    price_band: '',
    url: '',
    maps_url: '',
    notes: '',
    veg_friendly: false
  })
  
  // State for form validation errors
  const [errors, setErrors] = useState<Partial<PlaceFormData>>({})
  
  // State for loading and submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for toast notifications
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    isVisible: boolean
  }>({
    message: '',
    type: 'success',
    isVisible: false
  })

  // Available categories (matching the existing ones from the Discover page)
  const categories = [
    'market',
    'street_food', 
    'veg',
    'vegan',
    'coffee',
    'Fine_Dining',
    '24_7',
    'activity',
    'landmark',
    'other' // New category for places that don't fit existing ones
  ]

  // Available price bands
  const priceBands = ['£', '££', '£££']

  // Auto-focus first input and prevent scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      // Auto-focus the name input
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Function to validate the form
  const validateForm = (): boolean => {
    const newErrors: Partial<PlaceFormData> = {}
    
    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Place name is required'
    }
    
    // Category is required
    if (!formData.category) {
      newErrors.category = 'Please select a category'
    }
    
    // Price band is required
    if (!formData.price_band) {
      newErrors.price_band = 'Please select a price band'
    }
    
    // URL validation (if provided)
    if (formData.url && !isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL'
    }
    
    // Maps URL validation (if provided)
    if (formData.maps_url && !isValidUrl(formData.maps_url)) {
      newErrors.maps_url = 'Please enter a valid Google Maps URL'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Function to check if a URL is valid
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // Function to handle form input changes
  const handleInputChange = (field: keyof PlaceFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Function to handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate the form first
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to add a place')
      }
      
      // Insert the new place into the database
      const { error: insertError } = await supabase
        .from('places')
        .insert({
          name: formData.name.trim(),
          category: formData.category,
          price_band: formData.price_band,
          url: formData.url.trim() || null,
          maps_url: formData.maps_url.trim() || null,
          notes: formData.notes.trim() || null,
          veg_friendly: formData.veg_friendly,
          user_submitted: true,
          submitted_by: user.id
        })
      
      if (insertError) {
        throw new Error(insertError.message)
      }
      
      // Show success message
      setToast({
        message: 'Place submitted successfully! It will be reviewed and added to the platform.',
        type: 'success',
        isVisible: true
      })
      
      // Reset form and close modal after a short delay
      setTimeout(() => {
        resetForm()
        onClose()
        onPlaceAdded() // Refresh the places list
      }, 2000)
      
    } catch (error) {
      // Show error message
      setToast({
        message: error instanceof Error ? error.message : 'Failed to submit place. Please try again.',
        type: 'error',
        isVisible: true
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to reset the form
  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price_band: '',
      url: '',
      maps_url: '',
      notes: '',
      veg_friendly: false
    })
    setErrors({})
  }

  // Function to handle modal close
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Function to close toast
  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }))
  }

  return isOpen ? (
    <>
      <div className="modal fade show" style={{ display: "block", zIndex: 1200 }} role="dialog" aria-modal="true" aria-labelledby="addPlaceTitle">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4 shadow-lg">
            <div className="modal-header">
              <h5 id="addPlaceTitle" className="modal-title fw-bold">Add a New Place</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} />
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                {/* Place Name */}
                <div className="mb-3">
                  <label htmlFor="place-name" className="form-label">
                    Place Name *
                  </label>
                  <input
                    ref={nameInputRef}
                    id="place-name"
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter the name of the place"
                    maxLength={100}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                {/* Category and Price Band Row */}
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label htmlFor="category" className="form-label">
                      Category *
                    </label>
                    <select
                      id="category"
                      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.category}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'other' ? '🔍 Other' :
                           category.replace('_', ' ').split(' ').map(word => 
                             word.charAt(0).toUpperCase() + word.slice(1)
                           ).join(' ')}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <div className="invalid-feedback">{errors.category}</div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label htmlFor="price-band" className="form-label">
                      Price Band *
                    </label>
                    <select
                      id="price-band"
                      className={`form-select ${errors.price_band ? 'is-invalid' : ''}`}
                      value={formData.price_band}
                      onChange={(e) => handleInputChange('price_band', e.target.value)}
                      disabled={isSubmitting}
                      aria-invalid={!!errors.price_band}
                    >
                      <option value="">Select price</option>
                      {priceBands.map(band => (
                        <option key={band} value={band}>{band}</option>
                      ))}
                    </select>
                    {errors.price_band && (
                      <div className="invalid-feedback">{errors.price_band}</div>
                    )}
                  </div>
                </div>

                {/* Website URL */}
                <div className="mb-3">
                  <label htmlFor="url" className="form-label">
                    Website URL
                  </label>
                  <input
                    id="url"
                    type="url"
                    className={`form-control ${errors.url ? 'is-invalid' : ''}`}
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.url}
                  />
                  {errors.url && (
                    <div className="invalid-feedback">{errors.url}</div>
                  )}
                  <div className="form-text">Optional - Website URL</div>
                </div>

                {/* Google Maps URL */}
                <div className="mb-3">
                  <label htmlFor="maps-url" className="form-label">
                    Google Maps URL
                  </label>
                  <input
                    id="maps-url"
                    type="url"
                    className={`form-control ${errors.maps_url ? 'is-invalid' : ''}`}
                    value={formData.maps_url}
                    onChange={(e) => handleInputChange('maps_url', e.target.value)}
                    placeholder="https://maps.google.com/..."
                    disabled={isSubmitting}
                    aria-invalid={!!errors.maps_url}
                  />
                  {errors.maps_url && (
                    <div className="invalid-feedback">{errors.maps_url}</div>
                  )}
                  <div className="form-text">Optional - link to Google Maps location</div>
                </div>

                {/* Notes/Description */}
                <div className="mb-3">
                  <label htmlFor="notes" className="form-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Tell us about this place... (food, atmosphere, special features)"
                    rows={3}
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  <div className="form-text">Optional - describe what makes this place special</div>
                </div>

                {/* Vegetarian Friendly Toggle */}
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="vegSwitch"
                    checked={formData.veg_friendly}
                    onChange={(e) => handleInputChange('veg_friendly', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <label className="form-check-label" htmlFor="vegSwitch">
                    🌱 Vegetarian-friendly options available
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={handleClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn text-white" style={{ backgroundColor: 'rgba(255, 49, 130, 0.85)' }} onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Place'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* backdrop */}
      <div className="modal-backdrop fade show" style={{ zIndex: 1190 }}></div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </>
  ) : null
}
