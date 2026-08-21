import { useEffect, useRef } from 'react'

export function PulsingTreeVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const assetUrl = (fileName: string) => `${import.meta.env.BASE_URL}${fileName}`

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')

    const syncPlayback = () => {
      if (motionPreference.matches || document.hidden) {
        video.pause()
        if (motionPreference.matches && video.readyState >= 1) video.currentTime = Math.min(2.8, video.duration || 2.8)
        return
      }

      void video.play().catch(() => {
        // The poster remains visible if a browser blocks even muted autoplay.
      })
    }

    syncPlayback()
    video.addEventListener('loadedmetadata', syncPlayback)
    document.addEventListener('visibilitychange', syncPlayback)
    motionPreference.addEventListener('change', syncPlayback)

    return () => {
      video.removeEventListener('loadedmetadata', syncPlayback)
      document.removeEventListener('visibilitychange', syncPlayback)
      motionPreference.removeEventListener('change', syncPlayback)
    }
  }, [])

  return (
    <div className="tree-video">
      <video
        className="tree-video__surface"
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster={assetUrl('tree-pulse-transparent.png')}
        aria-hidden="true"
      >
        <source src={assetUrl('tree-pulse-transparent.webm')} type="video/webm" />
        <source src={assetUrl('tree-pulse-final.mp4')} type="video/mp4" />
      </video>
    </div>
  )
}
