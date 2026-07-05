import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

type TagInputProps = {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  canRemove?: (tag: string) => boolean
  readOnly?: boolean
}

export function TagInput({ value, onChange, suggestions, canRemove = () => true, readOnly = false }: TagInputProps) {
  const { t } = useTranslation()
  const [inputValue, setInputValue] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const matches = inputValue.trim()
    ? suggestions
        .filter(
          (s) => s.includes(inputValue.trim().toLowerCase()) && !value.includes(s)
        )
        .slice(0, 8)
    : []

  // the matches list changes on every keystroke — drop any stale highlight from before
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [inputValue])

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInputValue('')
    setHighlightedIndex(-1)
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const moveHighlight = (direction: 1 | -1) => {
    setHighlightedIndex((i) => {
      const next = i + direction
      if (next < 0) return matches.length - 1
      return next % matches.length
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && matches.length > 0) {
      e.preventDefault()
      moveHighlight(1)
    } else if (e.key === 'ArrowUp' && matches.length > 0) {
      e.preventDefault()
      moveHighlight(-1)
    } else if (e.key === 'Tab' && matches.length > 0) {
      e.preventDefault()
      moveHighlight(e.shiftKey ? -1 : 1)
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const highlighted = matches[highlightedIndex]
      addTag(highlighted ?? inputValue)
    } else if (e.key === 'Escape') {
      setHighlightedIndex(-1)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      const lastTag = value[value.length - 1]
      if (canRemove(lastTag)) removeTag(lastTag)
    }
  }

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((tag) => (
          <span
            key={tag}
            className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-800"
          >
            {tag}
          </span>
        ))}
      </div>
    )
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
          placeholder={t('tagInput.addPlaceholder')}
          className="min-w-[100px] flex-1 border-0 outline-none"
        />
      </div>

      {matches.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full list-none rounded-md border border-gray-300 bg-white p-1 shadow-md box-border">
          {matches.map((m, i) => (
            <li
              key={m}
              onMouseDown={() => addTag(m)}
              onMouseEnter={() => setHighlightedIndex(i)}
              className={`cursor-pointer rounded px-2 py-1 ${
                i === highlightedIndex ? 'bg-gray-100' : 'hover:bg-gray-100'
              }`}
            >
              {m}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
