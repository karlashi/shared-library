import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { updatePassword } from '../services/auth'

type FormValues = {
  password: string
}

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  const mutation = useMutation({
    mutationFn: (values: FormValues) => updatePassword(values.password),
    onSuccess: () => setDone(true),
    onError: (error) => {
      console.error(error)
      alert(t('resetPassword.error'))
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
          {t('resetPassword.title')}
        </h1>

        {done ? (
          <div className="text-center">
            <p className="mb-4 text-gray-700">{t('resetPassword.success')}</p>
            <button
              onClick={() => navigate('/login')}
              className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90"
            >
              {t('resetPassword.goToLogin')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">
                {t('resetPassword.newPassword')}
              </span>
              <input
                type="password"
                {...register('password', {
                  required: t('login.passwordRequired'),
                  minLength: { value: 6, message: t('login.passwordMinLength') },
                })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </label>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {mutation.isPending ? t('common.loading') : t('resetPassword.submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}