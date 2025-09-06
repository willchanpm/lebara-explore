'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

// Toast types
export type ToastVariant = 'success' | 'danger' | 'warning' | 'info'

export interface ToastAction {
  label: string
  handler: () => void
}

export interface ToastOptions {
  title?: string
  autohideMs?: number
  action?: ToastAction
  icon?: string
}

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  options?: ToastOptions
  timestamp: number
}

interface ToastsContextType {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    },
    options?: ToastOptions
  ) => Promise<T>
  remove: (id: string) => void
}

const ToastsContext = createContext<ToastsContextType | null>(null)

export function useToast() {
  const context = useContext(ToastsContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastsProvider')
  }
  return context
}

// Individual Toast Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const autohideMs = toast.options?.autohideMs ?? 3500

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (isHovered || autohideMs === 0) return

    timerRef.current = setTimeout(() => {
      onRemove(toast.id)
    }, autohideMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isHovered, autohideMs, toast.id, onRemove])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 150) // Allow exit animation
  }

  const getVariantClasses = () => {
    switch (toast.variant) {
      case 'success':
        return 'bg-success text-white'
      case 'danger':
        return 'bg-danger text-white'
      case 'warning':
        return 'bg-warning text-dark'
      case 'info':
        return 'bg-info text-dark'
      default:
        return 'bg-primary text-white'
    }
  }

  const getIcon = () => {
    if (toast.options?.icon) return toast.options.icon
    switch (toast.variant) {
      case 'success':
        return '✅'
      case 'danger':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return 'ℹ️'
    }
  }

  const isShortMessage = toast.message.length < 50 && !toast.options?.title
  const roundedClass = isShortMessage ? 'rounded-pill' : 'rounded-4'

  return (
    <div
      className={`toast show ${getVariantClasses()} ${roundedClass} shadow-sm border-0`}
      style={{
        minWidth: '280px',
        maxWidth: '400px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.15s ease-in-out',
        marginBottom: '0.5rem',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="toast-body d-flex align-items-start gap-2">
        <span className="flex-shrink-0" aria-hidden="true">
          {getIcon()}
        </span>
        <div className="flex-grow-1">
          {toast.options?.title && (
            <div className="fw-bold mb-1">{toast.options.title}</div>
          )}
          <div className="mb-0">{toast.message}</div>
          {toast.options?.action && (
            <button
              className="btn btn-link btn-sm p-0 mt-1 text-decoration-none"
              style={{ color: 'inherit', textDecoration: 'underline' }}
              onClick={toast.options.action.handler}
            >
              {toast.options.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          className="btn-close btn-close-white flex-shrink-0"
          aria-label="Close"
          onClick={handleClose}
          style={{ fontSize: '0.75rem' }}
        />
      </div>
    </div>
  )
}

// Toast Container Component
function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return
    }
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    ...(isMobile
      ? {
          bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 1rem)',
          left: '50%',
          transform: 'translateX(-50%)',
          right: '1rem',
          maxWidth: 'calc(100vw - 2rem)',
        }
      : {
          top: '1rem',
          right: '1rem',
          maxWidth: '400px',
        }),
  }

  // Only render on client side
  if (typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div style={containerStyle} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  )
}

// Provider Component
export function ToastsProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const addToast = useCallback((variant: ToastVariant, message: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      message,
      variant,
      options,
      timestamp: Date.now(),
    }
    
    setToasts((prev) => [newToast, ...prev]) // Newest on top
  }, [])

  const success = useCallback((message: string, options?: ToastOptions) => {
    addToast('success', message, options)
  }, [addToast])

  const error = useCallback((message: string, options?: ToastOptions) => {
    addToast('danger', message, options)
  }, [addToast])

  const warning = useCallback((message: string, options?: ToastOptions) => {
    addToast('warning', message, options)
  }, [addToast])

  const info = useCallback((message: string, options?: ToastOptions) => {
    addToast('info', message, options)
  }, [addToast])

  const promise = useCallback(async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: unknown) => string)
    },
    options?: ToastOptions
  ): Promise<T> => {
    const loadingId = Math.random().toString(36).substr(2, 9)
    const loadingToast: Toast = {
      id: loadingId,
      message: messages.loading,
      variant: 'info',
      options: { ...options, icon: '⏳' },
      timestamp: Date.now(),
    }
    
    setToasts((prev) => [loadingToast, ...prev])

    try {
      const result = await promise
      setToasts((prev) => prev.filter((toast) => toast.id !== loadingId))
      
      const successMessage = typeof messages.success === 'function' 
        ? messages.success(result) 
        : messages.success
      addToast('success', successMessage, options)
      
      return result
    } catch (err) {
      setToasts((prev) => prev.filter((toast) => toast.id !== loadingId))
      
      const errorMessage = typeof messages.error === 'function' 
        ? messages.error(err) 
        : messages.error
      addToast('danger', errorMessage, options)
      
      throw err
    }
  }, [addToast])

  const contextValue: ToastsContextType = {
    success,
    error,
    warning,
    info,
    promise,
    remove: removeToast,
  }

  return (
    <ToastsContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastsContext.Provider>
  )
}
