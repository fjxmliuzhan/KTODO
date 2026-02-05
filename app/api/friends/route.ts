/**
 * 好友 API 路由 - 使用 SQL RPC
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/friends - 发送好友请求
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { receiver_username } = body

    if (!receiver_username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    // 使用 RPC
    const { data: request, error } = await supabase.rpc('send_friend_request', {
      p_sender_id: user.id as string,
      p_username: receiver_username as string,
    })

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (error.message.includes('yourself')) {
        return NextResponse.json({ error: 'Cannot add yourself as friend' }, { status: 400 })
      }
      if (error.message.includes('exists')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json({ data: request }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to send request' }, { status: 500 })
  }
}

// PATCH /api/friends - 接受好友请求
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { request_id } = body

    if (!request_id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    // 使用 RPC
    const { data: result, error } = await supabase.rpc('accept_friend_request', {
      p_request_id: request_id as string,
      p_user_id: user.id as string,
    })

    if (error) {
      if (error.message.includes('not found') || error.message.includes('forbidden')) {
        return NextResponse.json({ error: 'Request not found or forbidden' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to accept request' }, { status: 500 })
  }
}

// DELETE /api/friends - 删除好友
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const friend_id = searchParams.get('friend_id')

  if (!friend_id) {
    return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 })
  }

  try {
    // 使用 RPC
    const { error } = await supabase.rpc('delete_friend', {
      p_user_id: user.id as string,
      p_friend_id: friend_id as string,
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete friend' }, { status: 500 })
  }
}
