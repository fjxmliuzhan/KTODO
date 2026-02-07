/**
 * 添加好友组件
 * 通过用户名搜索并发送好友请求
 */
'use client'

import { useState } from 'react'
import createClient from '@/lib/supabase/client'

interface AddFriendProps {
  onSent?: () => void
}

export default function AddFriend({ onSent }: AddFriendProps) {
  const supabase = createClient
  const [username, setUsername] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSearch = async () => {
    if (!username.trim()) return

    setSearching(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSearching(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${username.trim()}%`)
      .neq('id', user.id)
      .limit(10)

    if (!error && data) {
      setSearchResults(data)
    } else {
      setMessage({ type: 'error', text: '搜索失败，请重试' })
    }
    setSearching(false)
  }

  const handleSendRequest = async (receiverId: string) => {
    setSending(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSending(false)
      return
    }

    const { error } = await supabase.from('friend_requests').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      status: 'pending',
    }).select()

    if (error) {
      if (error.message.includes('duplicate')) {
        setMessage({ type: 'error', text: '已存在该好友关系或请求' })
      } else {
        setMessage({ type: 'error', text: error.message || '发送失败' })
      }
    } else {
      setMessage({ type: 'success', text: '好友请求已发送' })
      setSearchResults([])
      setUsername('')
      if (onSent) onSent()
    }
    setSending(false)
  }

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
          placeholder="输入用户名搜索"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !username.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition"
        >
          {searching ? '搜索中...' : '搜索'}
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">搜索结果 ({searchResults.length})</h3>
          {searchResults.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {profile.username[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{profile.username}</p>
                  <p className="text-xs text-gray-500">{profile.full_name || '未设置姓名'}</p>
                </div>
              </div>
              <button
                onClick={() => handleSendRequest(profile.id)}
                disabled={sending}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-medium rounded-lg transition"
              >
                {sending ? '发送中...' : '加好友'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 无结果 */}
      {!searching && username.trim() && searchResults.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">未找到用户 "{username}"</p>
          <p className="text-xs text-gray-400 mt-1">请尝试其他用户名</p>
        </div>
      )}
    </div>
  )
}
