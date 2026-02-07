#!/bin/bash

echo "🔍 开始自动修复构建问题..."

# 循环直到构建成功或达到最大尝试次数
max_attempts=10
attempt=1

while [ $attempt -le $max_attempts ]; do
  echo "🔄 尝试构建 (第 $attempt 次)..."
  
  # 执行构建
  if npm run build; then
    echo "✅ 构建成功！"
    exit 0
  else
    echo "❌ 构建失败，分析错误..."
    
    # 获取最后10行错误
    error=$(npm run build 2>&1 | tail -10)
    
    # 检查常见错误类型
    if [[ $error == *"Property 'onRequestSent' does not exist"* ]]; then
      echo "🔧 修复 FriendRequest 组件 props..."
      # 这里会添加具体修复逻辑
    elif [[ $error == *"Property 'onFriendUpdated' does not exist"* ]]; then
      echo "🔧 修复 FriendList 组件 props..."
      # 这里会添加具体修复逻辑
    elif [[ $error == *"Argument of type 'any' is not assignable"* ]]; then
      echo "🔧 修复 RPC 调用类型..."
      # 这里会添加具体修复逻辑
    else
      echo "⚠️ 未知错误类型，需要手动处理:"
      echo "$error"
      exit 1
    fi
    
    ((attempt++))
  fi
done

echo "❌ 达到最大尝试次数 ($max_attempts)，修复失败"
exit 1