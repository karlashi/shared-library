import { useTranslation } from 'react-i18next'
import { LANGUAGE_CODES, OTHER_LANGUAGES_VALUE } from '../constants/languages'

export function LanguageCheckboxes({
  value,
  onChange,
  includeOthers = false,
}: {
  value: string[]
  onChange: (languages: string[]) => void
  /** Adds an "Others" option (filter-only) covering any language outside LANGUAGE_CODES. */
  includeOthers?: boolean
}) {
  const { t } = useTranslation()

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  }

  const codes: string[] = includeOthers ? [...LANGUAGE_CODES, OTHER_LANGUAGES_VALUE] : [...LANGUAGE_CODES]

  return (
    <div className="flex flex-wrap gap-3">
      {codes.map((code) => (
        <label key={code} className="flex items-center gap-1.5 text-sm text-gray-700">
          <input type="checkbox" checked={value.includes(code)} onChange={() => toggle(code)} />
          {code === OTHER_LANGUAGES_VALUE ? t('languages.others') : t(`languages.${code}`)}
        </label>
      ))}
    </div>
  )
}
