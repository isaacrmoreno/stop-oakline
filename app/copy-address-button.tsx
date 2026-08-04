'use client'

import { useEffect, useState } from 'react'
import { Copy, CopyCheck } from 'lucide-react'

export default function CopyAddressButton({
  value,
  iconOnly = false
}: {
  value: string
  iconOnly?: boolean
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCopied(false)
    }, 1600)

    return () => window.clearTimeout(timeoutId)
  }, [copied])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      aria-label={copied ? 'Copied address' : `Copy ${value}`}
      className={
        iconOnly
          ? 'inline-flex size-8 items-center justify-center rounded-full bg-white/84 text-[var(--pine)] shadow-[0_10px_24px_rgba(8,29,23,0.05)] transition hover:bg-white'
          : 'inline-flex items-center gap-2 rounded-full bg-white/84 px-3 py-2 text-sm font-medium text-[var(--pine)] shadow-[0_10px_24px_rgba(8,29,23,0.05)] transition hover:bg-white'
      }
      onClick={handleCopy}
      type='button'>
      {copied ? <CopyCheck className='size-4' /> : <Copy className='size-4' />}
      {iconOnly ? <span className='sr-only'>{copied ? 'Copied' : 'Copy Address'}</span> : copied ? 'Copied' : 'Copy Address'}
    </button>
  )
}
