import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { signIn, signUp } from '../services/auth'

type FormValues = {
  name?: string
  email: string
  password: string
}

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [info, setInfo] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  const loginMutation = useMutation({
    mutationFn: (values: FormValues) => signIn(values.email, values.password),
    onSuccess: () => navigate(from, { replace: true }),
    onError: (error) => {
      console.error(error)
      alert(t('login.wrongCredentials'))
    },
  })

  const registerMutation = useMutation({
    mutationFn: (values: FormValues) => signUp(values.email, values.password, values.name ?? ''),
    onSuccess: (data) => {
      if (data.session) {
        navigate(from, { replace: true })
      } else {
        setInfo(t('login.accountCreatedInfo'))
        setMode('login')
      }
    },
    onError: (error) => {
      console.error(error)
      alert(t('login.registerError'))
    },
  })

  const onSubmit = (values: FormValues) => {
    setInfo('')
    if (mode === 'login') {
      loginMutation.mutate(values)
    } else {
      registerMutation.mutate(values)
    }
  }

  const pending = loginMutation.isPending || registerMutation.isPending

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-1">
          {t('common.appName')}
        </h1>
        <h2 className="text-lg text-gray-600 text-center mb-6">
          {mode === 'login' ? t('login.signIn') : t('login.createAccount')}
        </h2>

        {info && <p className="mb-4 text-sm text-gray-700">{info}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">{t('login.name')}</span>
              <input
                {...register('name', { required: t('login.nameRequired') })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('login.email')}</span>
            <input
              type="email"
              {...register('email', {
                required: t('login.emailRequired'),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t('login.emailInvalid'),
                },
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">{t('login.password')}</span>
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
            disabled={pending}
            className="rounded-md bg-brand px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t('common.loading') : mode === 'login' ? t('login.enter') : t('login.createAccount')}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login')
            setInfo('')
          }}
          className="mt-4 w-full text-center text-sm text-brand hover:underline"
        >
          {mode === 'login' ? t('login.toggleToRegister') : t('login.toggleToLogin')}
        </button>

        <Link
          to="/about"
          className="mt-2 block w-full text-center text-sm text-gray-500 hover:underline"
        >
          {t('login.aboutLink')}
        </Link>
      </div>
    </div>
  )
}
