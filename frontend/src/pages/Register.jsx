import React, { useState } from 'react'
import { register } from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const { token } = await register(name, email, password)
      localStorage.setItem('token', token)
      nav('/')
    } catch (e) {
      setError('Registration failed')
    }
  }

  return (
    <div className="center-wrap">
      <form onSubmit={onSubmit} style={{ maxWidth: 380, width: '100%' }} className="panel aside">
        <h3>Register</h3>
        {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
        <div className="grid" style={{ marginTop: 8 }}>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Name" required />
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required />
          <input className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required />
          <button className="btn" type="submit">Create Account</button>
        </div>
      </form>
    </div>
  )
}


