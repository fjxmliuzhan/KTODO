/**
 * 共享看板 API 路由 - 使用 SQL RPC
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// 定义请求体类型
interface CreateBoardRequest {
  name: string
  friend_id: string
}

// POST /api/boards - 创建共享看板
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, friend_id } = await request.json() as CreateBoardRequest

    if (!name || !friend_id) {
      return NextResponse.json({ error: 'Name and friend_id are required' }, { status: 400 })
    }

    // 使用 RPC（添加类型断言）
    const { data: board, error } = await supabase.rpc('create_shared_board', {
      p_board_name: name.trim(),
      p_user_id: user.id,
      p_friend_id: friend_id,
    } as any)

    if (error) {
      if (error.message.includes('not friends')) {
        return NextResponse.json({ error: 'Not friends with this user' }, { status: 403 })
      }
      throw error
    }

    return NextResponse.json({ data: board }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create board' }, { status: 500 })
  }
}

// GET /api/boards - 获取用户的共享看板
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 使用 SQL RPC（添加类型断言）
    const { data: boards, error } = await supabase.rpc('get_user_boards', {
      p_user_id: user.id as string,
    } as any)

    if (error) throw error

    return NextResponse.json({ data: boards || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch boards' }, { status: 500 })
  }
}
