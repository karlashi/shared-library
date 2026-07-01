import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import es from '../i18n/locales/es.json'

function Bomb(): never {
  throw new Error('boom')
}

describe('ErrorBoundary', () => {
  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>
    )

    expect(screen.getByText('all good')).toBeInTheDocument()
  })

  it('renders the fallback screen instead of crashing when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    )

    expect(screen.getByText(es.errorBoundary.heading)).toBeInTheDocument()
    expect(screen.getByText(es.errorBoundary.reload)).toBeInTheDocument()

    vi.restoreAllMocks()
  })
})
