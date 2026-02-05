/**
 * Realtime 订阅 Hook
 * 监听任务的实时变化
 */
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export function useRealtimeSubscriptions(userId: string) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel

    const setupSubscription = async () => {
      try {
        // 创建频道
        channel = supabase
          .channel(`tasks:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*', // 监听所有变更
              schema: 'public',
              table: 'tasks',
              filter: `user_id=eq.${userId}`,
            },
            (payload) => {
              console.log('Realtime payload:', payload)
              
              // 根据事件类型更新任务列表
              switch (payload.eventType) {
                case 'INSERT':
                  setTasks((prev) => [...prev, payload.new])
                  break
                case 'UPDATE':
                  setTasks((prev) => 
                    prev.map((task) => 
                      task.id === payload.new.id ? payload.new : task
                    )
                  )
                  break
                case 'DELETE':
                  setTasks((prev) => 
                    prev.filter((task) => task.id !== payload.old.id)
                  )
                  break
              }
            }
          )
          .subscribe((status) => {
            console.log('Realtime status:', status)
            
            if (status === 'SUBSCRIBED') {
              setConnected(true)
              setError(null)
            } else if (status === 'CLOSED') {
              setConnected(false)
            } else if (status === 'CHANNEL_ERROR') {
              setConnected(false)
              setError('实时连接错误')
            }
          })
      } catch (err: any) {
        console.error('Realtime setup error:', err)
        setError(err.message || '实时设置失败')
      }
    }

    setupSubscription()

    // 清理
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  return { tasks, connected, error }
}

/**
 * 共享看板 Realtime 订阅 Hook
 */
export function useSharedBoardRealtime(boardId: string) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<any[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!boardId) return

    let channel: RealtimeChannel

    const setupSubscription = async () => {
      try {
        channel = supabase
          .channel(`board_tasks:${boardId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'tasks',
              filter: `shared_board_id=eq.${boardId}`,
            },
            (payload) => {
              switch (payload.eventType) {
                case 'INSERT':
                  setTasks((prev) => [...prev, payload.new])
                  break
                case 'UPDATE':
                  setTasks((prev) => 
                    prev.map((task) => 
                      task.id === payload.new.id ? payload.new : task
                    )
                  )
                  break
                case 'DELETE':
                  setTasks((prev) => 
                    prev.filter((task) => task.id !== payload.old.id)
                  )
                  break
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setConnected(true)
            } else if (status === 'CLOSED') {
              setConnected(false)
            }
          })
      } catch (err: any) {
        console.error('Shared board realtime error:', err)
      }
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [boardId])

  return { tasks, connected }
}
