import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TODO - 双人协同 Todo 系统',
  description: '与好友一起管理任务，高效协作',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  )
}
