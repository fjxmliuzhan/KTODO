/**
 * 任务 API 路由 - 使用 SQL RPC
 */
import { createClient } from '@/lib/supabase/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, description, priority, shared_board_id, sort_order = 0 } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // 使用 RPC
    const { data: task, error } = await supabase.rpc('create_task', {
      p_user_id: user.id as string,
      p_title: title.trim() as string,
      p_description: (description?.trim() || null) as string | null,
      p_priority: (priority || 'medium') as string,
      p_shared_board_id: (shared_board_id || null) as string | null,
      p_sort_order: sort_order as number,
    })

    if (error) throw error

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create task' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, title, description, priority, completed, completed_at, sort_order } = body

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // 使用 RPC
    const { data: task, error } = await supabase.rpc('update_task', {
      p_task_id: id as string,
      p_user_id: user.id as string,
      p_title: title ? title.trim() : null,
      p_description: description !== undefined ? (description?.trim() || null) as string | null : null,
      p_priority: priority ? priority as string : null,
      p_completed: completed ? completed as boolean : null,
      p_completed_at: completed ? (new Date().toISOString()) as string : null,
      p_sort_order: sort_order ? sort_order as number : null,
    })

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      throw error
    }

    return NextResponse.json({ data: task })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('id')

  if (!taskId) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
  }

  try {
    // 使用 RPC
    const { error } = await supabase.rpc('delete_task', {
      p_task_id: taskId as string,
      p_user_id: user.id as string,
    })

    if (error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete task' }, { status: 500 })
  }
}
