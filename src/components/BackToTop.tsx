import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function BackToTop() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('backToTop.ariaLabel')}
      className="fixed bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-xl text-white shadow-lg hover:opacity-90"
    >
      ↑
    </button>
  )
}
