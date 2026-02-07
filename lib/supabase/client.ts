/**
 * Supabase 客户端配置 - 客户端
 * 用于在客户端组件中与 Supabase 交互
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default supabase