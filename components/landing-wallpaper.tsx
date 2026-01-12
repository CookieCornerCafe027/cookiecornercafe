"use client"

type LandingWallpaperProps = {
  /** Path to the wallpaper image (e.g. "/images/cc.jpeg"). */
  imageUrl: string
  /** Optional background-size value (defaults to 400px like the old global wallpaper). */
  backgroundSize?: string
  children: React.ReactNode
}

export function LandingWallpaper({
  imageUrl,
  backgroundSize = "400px",
  children,
}: LandingWallpaperProps) {
  const wallpaperStyle = {
    backgroundImage: `url("${imageUrl}")`,
    backgroundRepeat: "repeat",
    backgroundSize,
    height: "100vh",
  } as const

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0"
        style={wallpaperStyle}
      />
      <div className="relative z-10">{children}</div>
    </>
  )
}


