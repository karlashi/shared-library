import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { signIn, signUp } from '../services/auth'

type FormValues = {
  name?: string
  email: string
  password: string
}

export function LoginPage() {
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
      alert('Email o contraseña incorrectos')
    },
  })

  const registerMutation = useMutation({
    mutationFn: (values: FormValues) => signUp(values.email, values.password, values.name ?? ''),
    onSuccess: (data) => {
      if (data.session) {
        navigate(from, { replace: true })
      } else {
        setInfo('Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.')
        setMode('login')
      }
    },
    onError: (error) => {
      console.error(error)
      alert('Error al crear la cuenta')
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
          📚 Biblioteca Compartida
        </h1>
        <h2 className="text-lg text-gray-600 text-center mb-6">
          {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
        </h2>

        {info && <p className="mb-4 text-sm text-gray-700">{info}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Nombre</span>
              <input
                {...register('name', { required: 'El nombre es obligatorio' })}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              {...register('email', {
                required: 'El email es obligatorio',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Introduce un email válido',
                },
              })}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Contraseña</span>
            <input
              type="password"
              {...register('password', {
                required: 'La contraseña es obligatoria',
                minLength: { value: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
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
            {pending ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
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
          {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  )
}
