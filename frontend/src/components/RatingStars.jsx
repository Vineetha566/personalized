import React, { useState } from 'react'

export default function RatingStars({ onRate }) {
  const [hover, setHover] = useState(0)
  const [value, setValue] = useState(0)

  function click(i) {
    setValue(i)
    onRate && onRate(i)
  }

  return (
    <div>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => click(i)}
          style={{ cursor: 'pointer', color: (hover || value) >= i ? '#fbbf24' : '#667086', fontSize: 18 }}
        >★</span>
      ))}
    </div>
  )
}


