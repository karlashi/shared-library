import { useTranslation } from 'react-i18next'

const LANGUAGE_CODES = ['es', 'de', 'en', 'pt'] as const

export function LanguageCheckboxes({
  value,
  onChange,
}: {
  value: string[]
  onChange: (languages: string[]) => void
}) {
  const { t } = useTranslation()

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  }

  return (
    <div className="flex flex-wrap gap-3">
      {LANGUAGE_CODES.map((code) => (
        <label key={code} className="flex items-center gap-1.5 text-sm text-gray-700">
          <input type="checkbox" checked={value.includes(code)} onChange={() => toggle(code)} />
          {t(`languages.${code}`)}
        </label>
      ))}
    </div>
  )
}
