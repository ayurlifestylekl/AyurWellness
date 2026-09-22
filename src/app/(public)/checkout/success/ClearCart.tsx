'use client'

import { useEffect } from 'react'

export default function ClearCart() {
  useEffect(() => {
    try {
      window.localStorage.removeItem('kal_cart_v1')
    } catch {
      // ignore
    }
  }, [])
  return null
}
