/**
 * 创建共享看板表单组件
 */
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CreateSharedBoardProps {
  friends: any[]
  onSuccess?: () => void
}

export default function CreateSharedBoard({ friends, onSuccess }: CreateSharedBoardProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [selectedFriend, setSelectedFriend] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!boardName.trim() || !selectedFriend) return

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      const { error } = await supabase.rpc('create_shared_board', {
        p_board_name: boardName.trim(),
        p_user_id: user.id,
        p_friend_id: selectedFriend
      })

      if (error) throw error

      // 添加成员关系
      const { data: board } = await supabase
        .from('shared_boards')
        .select('id')
        .eq('created_by', user.id)
        .eq('name', boardName.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (board) {
        await supabase.from('shared_board_members').insert({
          board_id: board.id,
          user_id: selectedFriend
        })
      }

      setBoardName('')
      setSelectedFriend('')
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      setError(err.message || '创建看板失败')
    }

    setLoading(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition shadow-lg"
      >
        创建看板
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">创建共享看板</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-1">
              看板名称
            </label>
            <input
              id="boardName"
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="例如：项目协作"
            />
          </div>

          <div>
            <label htmlFor="friend" className="block text-sm font-medium text-gray-700 mb-1">
              选择好友
            </label>
            <select
              id="friend"
              value={selectedFriend}
              onChange={(e) => setSelectedFriend(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">请选择好友</option>
              {friends.map((f: any) => (
                <option key={f.friend_id} value={f.friend_id}>
                  {f.profiles.username}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !boardName.trim() || !selectedFriend}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
