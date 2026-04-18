// Self-unregistering service worker.
// 과거 배포된 SW가 브라우저에 남아 navigation을 가로채는 문제를 해결하기 위한 kill-switch.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // 모든 캐시 삭제
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
      // 자기 자신 등록 해제
      await self.registration.unregister()
      // 열려있는 모든 클라이언트 강제 새로고침
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) {
        client.navigate(client.url)
      }
    })()
  )
})
