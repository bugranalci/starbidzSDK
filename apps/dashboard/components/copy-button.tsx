'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
  className?: string
}

export function CopyButton({ text, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors ${className}`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export function CopyableCode({ children, className = '' }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={`relative group ${className}`}>
      <code className="block bg-gray-100 px-3 py-2 rounded text-sm font-mono pr-16">
        {children}
      </code>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
