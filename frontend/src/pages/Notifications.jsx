import React, { useEffect, useState } from 'react'
import { getDigest } from '../api/client'

export default function Notifications() {
  const [digest, setDigest] = useState([])
  useEffect(() => { (async () => setDigest(await getDigest()))() }, [])
  return (
    <div>
      <h3>Notifications</h3>
      {digest.length === 0 && <div className="muted">No notifications</div>}
      <ul>
        {digest.map((d, i) => (<li key={i}>{d.message}</li>))}
      </ul>
    </div>
  )
}


