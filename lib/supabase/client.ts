/**
 * Supabase 客户端配置 - 浏览器端
 * 用于在客户端组件中与 Supabase 交互
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

/**
 * 创建浏览器端 Supabase 客户端
 * 使用 cookie 来管理会话
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
