'use client'

import { useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'
import Toast from './Toast'

// Interface for the modal props
interface AddPlaceModalProps {
  isOpen: boolean
  onClose: () => void
  onPlaceAdded: () => void // Callback to refresh the places list
  userEmail?: string | null // Optional user email for attribution
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

export default function AddPlaceModal({ isOpen, onClose, onPlaceAdded, userEmail }: AddPlaceModalProps) {
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
  
  // Create a Supabase browser client for database operations
  const supabase = createSupabaseBrowser()
  
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
          submitted_by: userEmail || 'anonymous'
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

  // Don't render anything if modal is not open
  if (!isOpen) return null

  return (
    <>
      {/* Modal Overlay */}
      <div className="modal-overlay">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h2 className="modal-title">Add a New Place</h2>
            <button 
              type="button" 
              className="modal-close"
              onClick={handleClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            <form onSubmit={handleSubmit} className="add-place-form">
              {/* Place Name */}
              <div className="form-group">
                <label htmlFor="place-name" className="form-label">
                  Place Name *
                </label>
                <input
                  id="place-name"
                  type="text"
                  className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter the name of the place"
                  maxLength={100}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <div className="form-error">{errors.name}</div>
                )}
              </div>

              {/* Category and Price Band Row */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Category *
                  </label>
                  <select
                    id="category"
                    className={`form-select ${errors.category ? 'form-select-error' : ''}`}
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    disabled={isSubmitting}
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
                    <div className="form-error">{errors.category}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="price-band" className="form-label">
                    Price Band *
                  </label>
                  <select
                    id="price-band"
                    className={`form-select ${errors.price_band ? 'form-select-error' : ''}`}
                    value={formData.price_band}
                    onChange={(e) => handleInputChange('price_band', e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="">Select price</option>
                    {priceBands.map(band => (
                      <option key={band} value={band}>{band}</option>
                    ))}
                  </select>
                  {errors.price_band && (
                    <div className="form-error">{errors.price_band}</div>
                  )}
                </div>
              </div>

              {/* Website URL */}
              <div className="form-group">
                <label htmlFor="url" className="form-label">
                  Website URL
                </label>
                <input
                  id="url"
                  type="url"
                  className={`form-input ${errors.url ? 'form-input-error' : ''}`}
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="https://example.com"
                  disabled={isSubmitting}
                />
                {errors.url && (
                  <div className="form-error">{errors.url}</div>
                )}
                <div className="form-help">Optional - the place&apos;s website</div>
              </div>

              {/* Google Maps URL */}
              <div className="form-group">
                <label htmlFor="maps-url" className="form-label">
                  Google Maps URL
                </label>
                <input
                  id="maps-url"
                  type="url"
                  className={`form-input ${errors.maps_url ? 'form-input-error' : ''}`}
                  value={formData.maps_url}
                  onChange={(e) => handleInputChange('maps_url', e.target.value)}
                  placeholder="https://maps.google.com/..."
                  disabled={isSubmitting}
                />
                {errors.maps_url && (
                  <div className="form-error">{errors.maps_url}</div>
                )}
                <div className="form-help">Optional - link to Google Maps location</div>
              </div>

              {/* Notes/Description */}
              <div className="form-group">
                <label htmlFor="notes" className="form-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Tell us about this place... (food, atmosphere, special features)"
                  rows={3}
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="form-help">Optional - describe what makes this place special</div>
              </div>

              {/* Vegetarian Friendly Toggle */}
              <div className="form-group">
                <label className="form-checkbox-label">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={formData.veg_friendly}
                    onChange={(e) => handleInputChange('veg_friendly', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span className="checkbox-text">🌱 Vegetarian-friendly options available</span>
                </label>
              </div>
            </form>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Place'}
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </>
  )
}
