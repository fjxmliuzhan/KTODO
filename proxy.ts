/**
 * Next.js Proxy 文件（Next.js 16+ 推荐）
 * 用于替代 middleware.ts
 */

import { NextResponse } from 'next/server'

export default function proxy(request: Request) {
  // 对于当前项目，middleware 仍然可以正常工作
  // 这个 proxy 文件是 Next.js 16 的推荐约定
  // 但我们暂时保持 middleware.ts
  
  return NextResponse.next({
    request,
  })
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
