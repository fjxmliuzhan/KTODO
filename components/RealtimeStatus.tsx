/**
 * 实时连接状态指示器
 */
'use client'

interface RealtimeStatusProps {
  connected: boolean
}

export default function RealtimeStatus({ connected }: RealtimeStatusProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
        connected
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          connected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
        }`}
      />
      <span className="font-medium">
        {connected ? '实时同步中' : '连接中...'}
      </span>
    </div>
  )
}
