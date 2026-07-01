import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TagInput } from './TagInput'

const placeholder = 'Añadir etiqueta...'

describe('TagInput', () => {
  it('adds a typed tag on Enter, lowercased', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput value={[]} onChange={handleChange} suggestions={[]} />)

    await user.type(screen.getByPlaceholderText(placeholder), 'Infantil{Enter}')

    expect(handleChange).toHaveBeenCalledWith(['infantil'])
  })

  it('does not add a tag that already exists in value', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput value={['infantil']} onChange={handleChange} suggestions={[]} />)

    await user.type(screen.getByPlaceholderText(placeholder), 'infantil{Enter}')

    expect(handleChange).not.toHaveBeenCalled()
  })

  it('removes the last tag on Backspace when the input is empty', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<TagInput value={['infantil', 'aventura']} onChange={handleChange} suggestions={[]} />)

    await user.click(screen.getByPlaceholderText(placeholder))
    await user.keyboard('{Backspace}')

    expect(handleChange).toHaveBeenCalledWith(['infantil'])
  })

  it('shows matching suggestions while typing, excluding tags already added', async () => {
    const user = userEvent.setup()
    render(
      <TagInput
        value={['infantil']}
        onChange={() => {}}
        suggestions={['infantil', 'aventura', 'fantasía']}
      />
    )

    await user.type(screen.getByPlaceholderText(placeholder), 'a')

    expect(screen.getByText('aventura')).toBeInTheDocument()
    expect(screen.getByText('fantasía')).toBeInTheDocument()
    expect(screen.getAllByText('infantil')).toHaveLength(1) // only the existing chip, not a suggestion too
  })
})
