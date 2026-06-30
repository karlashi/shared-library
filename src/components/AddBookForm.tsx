import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

export function AddBookForm({ onBookAdded }: { onBookAdded: () => void }) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  // 🖼️ Upload image to Supabase Storage
  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(fileName, file)

    if (uploadError) {
      console.error(uploadError)
      throw uploadError
    }

    const { data } = supabase.storage
      .from('book-covers')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // 📚 Submit book
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let coverUrl = ''

      // upload image if exists
      if (file) {
        coverUrl = await uploadImage(file)
      }

      // get current user (IMPORTANT for RLS)
      const { data: userData } = await supabase.auth.getUser()

      const user = userData.user

      if (!user) {
        alert('Debes iniciar sesión')
        return
      }

      // insert book
      const { error } = await supabase.from('books').insert({
        title,
        author,
        status: 'Disponible',
        cover_url: coverUrl,
        owner_id: user.id
      })

      if (error) {
        console.error(error)
        alert('Error al guardar el libro')
        return
      }

      // reset form
      setTitle('')
      setAuthor('')
      setFile(null)

      alert('Libro creado correctamente 📚')

      // refresh gallery
      onBookAdded()

    } catch (err) {
      console.error(err)
      alert('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <h2>➕ Añadir libro</h2>

      <input
        placeholder="Título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <br /><br />

      <input
        placeholder="Autor"
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
      />

      <br /><br />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <br /><br />

      <button type="submit" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar libro'}
      </button>
    </form>
  )
}