/**
 * 好友列表组件
 * 显示好友并支持删除好友
 */
'use client'

import { useState, useEffect } from 'react'
import createClient from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

interface Friend {
  friend_id: string
  profiles: {
    id: string
    username: string
}

interface FriendListProps {
  onFriendUpdated?: () => void
}
    full_name: string | null
    avatar_url: string | null
  }
}

interface FriendListProps {
  onDeleted?: () => void
}

export default function FriendList({ onDeleted }: FriendListProps) {
  const supabase = createClient
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(false)

  const loadFriends = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('friendships')
      .select('friend_id, profiles(username, full_name, avatar_url)')
      .eq('user_id', user.id)
      .innerJoin('profiles', 'friendships.friend_id', 'profiles.id')
      .order('profiles.created_at', { ascending: false })

    setFriends(data || [])
  }

  useEffect(() => {
    loadFriends()
  }, [])

  const handleDeleteFriend = async (friendId: string) => {
    if (!confirm('确定要删除这个好友吗？')) return

    setLoading(true)
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('friend_id', friendId)

    if (!error) {
      await loadFriends()
      if (onDeleted) onDeleted()
    }
    setLoading(false)
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">还没有好友</p>
        <p className="text-gray-400 text-xs mt-1">去添加好友一起协作吧！</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">我的好友 ({friends.length})</h2>
      <div className="space-y-2">
        {friends.map((friend) => (
          <div key={friend.friend_id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition">
            <div className="flex items-center gap-3 flex-1">
              {friend.profiles.avatar_url ? (
                <img
                  src={friend.profiles.avatar_url}
                  alt={friend.profiles.username}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {friend.profiles.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{friend.profiles.username}</p>
                <p className="text-xs text-gray-500">{friend.profiles.full_name || '未设置姓名'}</p>
              </div>
            </div>
            <button
              onClick={() => handleDeleteFriend(friend.friend_id)}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="删除好友"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
