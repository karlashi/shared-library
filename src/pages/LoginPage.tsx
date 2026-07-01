import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { signIn, signUp } from '../services/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [info, setInfo] = useState('')

  const loginMutation = useMutation({
    mutationFn: () => signIn(email, password),
    onSuccess: () => navigate(from, { replace: true }),
    onError: (error) => {
      console.error(error)
      alert('Email o contraseña incorrectos')
    },
  })

  const registerMutation = useMutation({
    mutationFn: () => signUp(email, password, name),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setInfo('')
    if (mode === 'login') {
      loginMutation.mutate()
    } else {
      registerMutation.mutate()
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Nombre</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
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
