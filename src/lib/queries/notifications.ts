import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/database'

/** 내 알림 목록 (미읽음 우선) */
export async function getMyNotifications(limit = 20): Promise<Notification[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('is_read', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}

/** 미읽음 알림 개수 */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) throw error
  return count ?? 0
}

/** 알림 읽음 처리 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
}

/** 전체 알림 읽음 처리 */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
}
