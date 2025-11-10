import React, { useState } from 'react'

export default function NotificationBell({ digest }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button className="btn ghost" onClick={() => setOpen(v => !v)} style={{ position: 'relative' }}>
        🔔
        {digest.length > 0 && (
          <span className="badge">{digest.length}</span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, marginTop: 8, width: 320, zIndex: 10 }} className="panel aside">
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Notifications</div>
          {digest.length === 0 && <div className="muted">No notifications</div>}
          {digest.map((d, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--border)', padding: '6px 0' }}>{d.message}</div>
          ))}
        </div>
      )}
    </div>
  )
}


