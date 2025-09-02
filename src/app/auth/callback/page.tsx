import { redirect } from 'next/navigation'

export default function AuthCallback() {
  // This page is no longer part of the OTP authentication flow
  // Redirect users to login page
  redirect('/login')
}
