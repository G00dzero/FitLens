import React from 'react'
import { isSafeRedirect, isExternal } from '../utils/url'

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: React.ReactNode
}

export default function LinkSafe({ href = '#', target, rel, children, ...rest }: Props) {
  const hrefStr = String(href)
  if (/^(javascript:|data:|vbscript:)/i.test(hrefStr)) {
    return <span {...rest}>{children}</span>
  }

  const safeHref = isSafeRedirect(hrefStr) ? hrefStr : '/'
  const external = isExternal(hrefStr)
  const finalTarget = target ?? (external ? '_blank' : undefined)
  const finalRel = rel ?? (finalTarget === '_blank' ? 'noopener noreferrer' : undefined)

  return (
    <a href={safeHref} target={finalTarget} rel={finalRel} {...rest}>
      {children}
    </a>
  )
}
