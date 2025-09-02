import { createSupabaseServer } from '@/lib/supabase/server'
import DiscoverPageClient from './DiscoverPageClient'

export default async function DiscoverPage() {
  // Fetch user data on the server using the correct server-side method
  const supabase = await createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  
  // Pass minimal user data to client component
  const userEmail = session?.user?.email || null
  
  return <DiscoverPageClient userEmail={userEmail} />
}
