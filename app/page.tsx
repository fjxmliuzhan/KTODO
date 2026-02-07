/**
 * 首页
 * 自动重定向到登录或仪表板
 */
import createClient from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createClient
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
