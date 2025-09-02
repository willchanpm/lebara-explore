import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is already authenticated
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  
  // If user is authenticated, redirect to home
  if (session) {
    redirect('/')
  }
  
  // If not authenticated, show the login page
  return <>{children}</>
}
