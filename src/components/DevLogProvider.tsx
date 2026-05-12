'use client'

/**
 * 개발 모드 전용 로그 프로바이더
 * - pathname 변경 감지 → page_view 로그
 * - 전역 클릭 위임 → button / a / [role="button"] / [data-log] 캡처
 * - production 빌드에서는 렌더링만 하고 아무 효과 없음
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  logPageView,
  logClick,
  setDevLogPathname,
} from '@/lib/dev-logger/client-logger'

const IS_DEV = process.env.NODE_ENV !== 'production'

interface DevLogProviderProps {
  children: React.ReactNode
}

export default function DevLogProvider({ children }: DevLogProviderProps) {
  const pathname = usePathname()
  const prevPathname = useRef<string>('')

  // pathname 변경 감지
  useEffect(() => {
    if (!IS_DEV) return
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname
    setDevLogPathname(pathname)
    logPageView(pathname)
  }, [pathname])

  // 전역 클릭 위임 리스너
  useEffect(() => {
    if (!IS_DEV) return

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null
      if (!target) return

      // 캡처 대상 선택자
      const el = target.closest(
        'button, a, [role="button"], [data-log]',
      ) as HTMLElement | null
      if (!el) return

      // data-log 속성이 있으면 우선 사용, 없으면 텍스트 추출
      const dataLog = el.getAttribute('data-log')
      const label =
        dataLog ??
        (el.textContent?.trim().slice(0, 80) || el.getAttribute('aria-label') || '')

      // target 식별자: data-log > aria-label > tagName+id
      const targetId =
        dataLog ??
        el.getAttribute('aria-label') ??
        `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}`

      logClick(label, targetId)
    }

    document.addEventListener('click', handleClick, { capture: true })
    return () => {
      document.removeEventListener('click', handleClick, { capture: true })
    }
  }, [])

  // production에서는 children만 반환
  return <>{children}</>
}
