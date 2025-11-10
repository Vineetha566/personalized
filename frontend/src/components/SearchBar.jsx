import React from 'react'

export default function SearchBar({ value, onChange, onSearch }) {
  return (
    <div className="row">
      <input
        className="input"
        placeholder="Search podcasts or episodes"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSearch && onSearch() }}
        style={{ flex: 1 }}
      />
      <button className="btn" onClick={onSearch}>Search</button>
    </div>
  )
}


