import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export function EditBookPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [cover_url, setCoverUrl] = useState('')
  const [collection, setCollection] = useState('')
  const [age_recommendation, setAge] = useState('')
  const [link, setLink] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    const loadBook = async () => {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) return

      setTitle(data.title)
      setAuthor(data.author)
      setCoverUrl(data.cover_url || '')
      setCollection(data.collection || '')
      setAge(data.age_recommendation || '')
      setLink(data.link || '')
      setTags((data.tags || []).join(', '))

      setLoading(false)
    }

    loadBook()
  }, [id])

  const updateBook = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase
      .from('books')
      .update({
        title,
        author,
        cover_url,
        collection,
        age_recommendation,
        link,
        tags: tags.split(',').map(t => t.trim())
      })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar libro')
      return
    }

    navigate(`/book/${id}`)
  }

  if (loading) return <p>Cargando...</p>

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h1>Editar libro</h1>

      <form onSubmit={updateBook} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        <label>
          Título
          <input value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <label>
          Autor
          <input value={author} onChange={e => setAuthor(e.target.value)} />
        </label>

<label>
  Portada (imagen)

  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      const fileName = `${Date.now()}-${file.name}`

      const { error } = await supabase.storage
        .from('book-covers')
        .upload(fileName, file)

      if (error) {
        alert('Error subiendo imagen')
        return
      }

      const { data } = supabase.storage
        .from('book-covers')
        .getPublicUrl(fileName)

      setCoverUrl(data.publicUrl)
    }}
  />

  {/* preview */}
  {cover_url && (
    <img
      src={cover_url}
      style={{ width: 120, marginTop: 10, borderRadius: 6 }}
    />
  )}
</label>

        <label>
          Colección
          <input value={collection} onChange={e => setCollection(e.target.value)} />
        </label>

        <label>
          Edad recomendada
          <input value={age_recommendation} onChange={e => setAge(e.target.value)} />
        </label>

        <label>
          Link
          <input value={link} onChange={e => setLink(e.target.value)} />
        </label>

        <label>
          Etiquetas (separadas por coma)
          <input value={tags} onChange={e => setTags(e.target.value)} />
        </label>

        <button type="submit">Guardar cambios</button>

        <button type="button" onClick={() => navigate(-1)}>
          Cancelar
        </button>
      </form>
    </div>
  )
}