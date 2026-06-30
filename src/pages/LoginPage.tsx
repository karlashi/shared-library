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
    <div style={{ padding: 20, maxWidth: 400, margin: '0 auto' }}>
      <h1>📚 Biblioteca Compartida</h1>
      <h2>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>

      {info && <p>{info}</p>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {mode === 'register' && (
          <label>
            Nombre
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>
        )}

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%' }}
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%' }}
          />
        </label>

        <button type="submit" disabled={pending}>
          {pending ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setInfo('')
        }}
        style={{ marginTop: 10 }}
      >
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
      </button>
    </div>
  )
}
