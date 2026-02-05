/**
 * Next.js 中间件
 * 用于保护需要认证的路由，并刷新 Supabase 会话
 */

import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 更新 Supabase 会话
  const response = await updateSession(request)

  // 检查用户是否已认证
  const isAuthenticated = request.cookies.get('sb-access-token')?.value

  // 定义公开路由
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // 如果未认证且访问受保护的路由，重定向到登录页
  if (!isAuthenticated && !isPublicRoute && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 如果已认证且访问登录/注册页，重定向到仪表板
  if (isAuthenticated && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - public 文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
