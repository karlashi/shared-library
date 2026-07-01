import { Component, type ReactNode } from 'react'
import i18n from '../i18n'

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="mb-2 text-lg font-semibold text-gray-900">{i18n.t('errorBoundary.heading')}</p>
          <p className="mb-4 text-gray-600">{i18n.t('errorBoundary.message')}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90"
          >
            {i18n.t('errorBoundary.reload')}
          </button>
        </div>
      </div>
    )
  }
}
