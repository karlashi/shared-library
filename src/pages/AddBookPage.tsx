import { useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'

export function AddBookPage() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [collection, setCollection] = useState('')
  const [link, setLink] = useState('')
  const [age, setAge] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const uploadImage = async (file: File) => {
    const fileName = `${crypto.randomUUID()}-${file.name}`

    const { error } = await supabase.storage
      .from('book-covers')
      .upload(fileName, file)

    if (error) throw error

    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      alert('Debes iniciar sesión')
      setLoading(false)
      return
    }

    try {
      let coverUrl = ''

      if (file) {
        coverUrl = await uploadImage(file)
      }

      const { error } = await supabase.from('books').insert({
        title,
        author,
        collection,
        link,
        age_recommendation: age,
        tags: tags.split(',').map(t => t.trim()),
        cover_url: coverUrl,
        owner_id: user.id,
        status: 'Disponible'
      })

      if (error) {
        console.error(error)
        alert('Error al guardar el libro')
        setLoading(false)
        return
      }

      alert('Libro creado 📚')

      navigate('/')
    } catch (err) {
      console.error(err)
      alert('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
        <button
  type="button"
  onClick={() => navigate('/')}
  style={{
    marginBottom: 20,
    background: '#eee',
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer'
  }}
>
  ← Volver a la biblioteca
</button>
      <h1>➕ Añadir libro</h1>

      <form onSubmit={handleSubmit}>

        <label>
          Título
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Autor
          <input
            value={author}
            onChange={e => setAuthor(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Colección
          <input
            value={collection}
            onChange={e => setCollection(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Link
          <input
            value={link}
            onChange={e => setLink(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Edad recomendada
          <input
            value={age}
            onChange={e => setAge(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Etiquetas (separadas por coma)
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            style={{ width: '100%', marginBottom: 10 }}
          />
        </label>

        <label>
          Portada
          <input
            type="file"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ marginBottom: 10 }}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar libro'}
        </button>

      </form>
    </div>
  )
}