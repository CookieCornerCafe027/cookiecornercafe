"use client"

import { useEffect } from "react"

export function ClearCartOnSuccess() {
  useEffect(() => {
    try {
      localStorage.removeItem("cart")
      window.dispatchEvent(new Event("cartUpdated"))
    } catch {
      // ignore
    }
  }, [])

  return null
}





