import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '셔틀콕! - 통학버스 관리',
    short_name: '셔틀콕',
    description: '통학버스 관리 시스템',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    icons: []
  };
}
