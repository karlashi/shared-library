import { useState } from 'react'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
}

export function TagInput({ value, onChange, suggestions }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const matches = inputValue.trim()
    ? suggestions
        .filter(
          (s) => s.includes(inputValue.trim().toLowerCase()) && !value.includes(s)
        )
        .slice(0, 8)
    : []

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInputValue('')
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          border: '1px solid #ccc',
          borderRadius: 6,
          padding: 6,
        }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              background: '#eee',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 13,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Añadir etiqueta..."
          style={{ border: 'none', outline: 'none', flex: 1, minWidth: 100 }}
        />
      </div>

      {matches.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            zIndex: 1,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 6,
            marginTop: 4,
            padding: 4,
            listStyle: 'none',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {matches.map((m) => (
            <li
              key={m}
              onMouseDown={() => addTag(m)}
              style={{ padding: '4px 8px', cursor: 'pointer' }}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
