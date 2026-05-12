'use client'

import { useEffect } from 'react'
import { setDevLogSession } from '@/lib/dev-logger/client-logger'

interface DevLogSessionSyncProps {
  userId?: string
  role?: string
  schoolId?: string
}

export default function DevLogSessionSync({
  userId,
  role,
  schoolId,
}: DevLogSessionSyncProps) {
  useEffect(() => {
    setDevLogSession({ userId, role, schoolId })
  }, [userId, role, schoolId])

  return null
}
