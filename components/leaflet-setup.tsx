"use client"

import { useEffect } from "react"
import Script from "next/script"

export function LeafletSetup() {
  useEffect(() => {
    // Add Leaflet CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    link.crossOrigin = ""
    document.head.appendChild(link)

    // Add meta tag to ensure proper mobile rendering
    const meta = document.createElement("meta")
    meta.name = "viewport"
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    document.head.appendChild(meta)

    // Add mobile-specific styles
    const style = document.createElement("style")
    style.textContent = `
      .leaflet-touch .leaflet-control-layers,
      .leaflet-touch .leaflet-bar {
        border: 2px solid rgba(0,0,0,0.2);
        background-clip: padding-box;
      }
      .leaflet-touch .leaflet-control-zoom-in,
      .leaflet-touch .leaflet-control-zoom-out {
        font-size: 22px;
      }
      .leaflet-container {
        touch-action: none;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(meta)
      document.head.removeChild(style)
    }
  }, [])

  return (
    <>
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        strategy="beforeInteractive"
      />
      {/* Add a debug script to help diagnose mobile issues */}
      <Script id="leaflet-debug" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined') {
            window.debugMapInfo = function() {
              console.log('User Agent:', navigator.userAgent);
              console.log('Is Mobile:', /Mobi|Android/i.test(navigator.userAgent));
              console.log('Window Size:', window.innerWidth, 'x', window.innerHeight);
              console.log('Leaflet Version:', L?.version || 'Not loaded');
              console.log('CORS Support:', window.fetch ? 'Yes' : 'No');
              return 'Debug info logged to console';
            };
          }
        `}
      </Script>
    </>
  )
}

