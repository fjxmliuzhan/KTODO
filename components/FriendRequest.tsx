/**
 * 好友请求组件
 * 显示待处理的好友请求
 */
'use client'

import { useState, useEffect } from 'react'
import createClient from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

interface PendingRequest {
  id: string
  sender_id: string
  profiles: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

interface FriendRequestProps {
  onAccept?: () => void
}

export default function FriendRequest({ onAccept }: FriendRequestProps) {
  const supabase = createClient
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(false)

  const loadRequests = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('friend_requests')
      .select('id, sender_id, profiles(username, full_name, avatar_url)')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .innerJoin('profiles', 'friend_requests.sender_id', 'profiles.id')
      .order('created_at', { ascending: false })

    setRequests(data || [])
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleAccept = async (requestId: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)

    if (!updateError) {
      const request = requests.find(r => r.id === requestId)
      if (request) {
        const { error: friendError } = await supabase.from('friendships').insert({
          user_id: user.id,
          friend_id: request.sender_id,
        })

        if (!friendError) {
          await supabase.from('friendships').insert({
            user_id: request.sender_id,
            friend_id: user.id,
          })
        }
      }

      await loadRequests()
      if (onAccept) onAccept()
    }
    setLoading(false)
  }

  const handleReject = async (requestId: string) => {
    if (!confirm('确定要拒绝这个好友请求吗？')) return

    setLoading(true)
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    if (!error) await loadRequests()
    setLoading(false)
  }

  if (requests.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
        待处理请求 ({requests.length})
      </h2>
      <div className="space-y-2">
        {requests.map((request) => (
          <div 
            key={request.id} 
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
          >
            <div className="flex items-center gap-3">
              {request.profiles.avatar_url ? (
                <img
                  src={request.profiles.avatar_url}
                  alt={request.profiles.username}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                  {request.profiles.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {request.profiles.username}
                </p>
                <p className="text-xs text-gray-500">
                  {request.profiles.full_name || '未设置姓名'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(request.id)}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg transition"
              >
                接受
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={loading}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg transition"
              >
                拒绝
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
