import { useState } from 'react'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  canRemove?: (tag: string) => boolean
}

export function TagInput({ value, onChange, suggestions, canRemove = () => true }: TagInputProps) {
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
      const lastTag = value[value.length - 1]
      if (canRemove(lastTag)) removeTag(lastTag)
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1.5 rounded-md border border-gray-300 p-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-800"
          >
            {tag}
            {canRemove(tag) && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="border-0 bg-transparent p-0 text-sm leading-none text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            )}
          </span>
        ))}

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Añadir etiqueta..."
          className="min-w-[100px] flex-1 border-0 outline-none"
        />
      </div>

      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full list-none rounded-md border border-gray-300 bg-white p-1 shadow-md box-border">
          {matches.map((m) => (
            <li
              key={m}
              onMouseDown={() => addTag(m)}
              className="cursor-pointer rounded px-2 py-1 hover:bg-gray-100"
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
