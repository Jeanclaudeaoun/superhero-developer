import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Moved page. Static hosting has no server redirects, so redirect on the client.
export default function Moved() {
  const router = useRouter()
  useEffect(() => { router.replace('/contracts/address-link/') }, [router])
  return <meta httpEquiv="refresh" content="0; url=/contracts/address-link/" />
}
