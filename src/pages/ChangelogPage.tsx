import { Header } from '../components/Header'

export function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Header />
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">🕘 Novedades</h1>

        <div className="space-y-8 text-gray-700">
          <div>
            <h2 className="mb-2 font-semibold text-gray-900">1 de julio de 2026</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>➕ Añadir varios libros rápido: el botón "Guardar y añadir otro" guarda el libro y deja el formulario listo para el siguiente escaneo, sin volver a la biblioteca cada vez.</li>
              <li>⚠️ Libros incompletos: los libros sin portada, descripción, edad recomendada o etiquetas se marcan con un aviso, con un filtro "Solo incompletos" y un editor en lote para completarlos varios a la vez. La búsqueda por ISBN también prueba con Open Library si Google Books no tiene portada o descripción.</li>
              <li>🙈 Ocultar mis libros: la biblioteca oculta tus propios libros por defecto, para centrarte en lo que puedes pedir prestado a otros.</li>
              <li>⌨️ Etiquetas más accesibles: ahora puedes navegar las sugerencias de etiquetas con el teclado (flechas o Tab) y confirmar con Enter.</li>
              <li>🛡️ Roles de administrador: los administradores designados pueden editar, archivar, eliminar o marcar como devuelto cualquier libro/préstamo de la biblioteca (por ejemplo, si un miembro está inactivo).</li>
              <li>⭐ Lista de deseos: marca libros de otros miembros que te gustaría pedir prestado más adelante (privado, solo tú lo ves).</li>
              <li>📷 Escanear código de barras: al añadir un libro, puedes escanear su código de barras con la cámara en vez de escribir el ISBN a mano.</li>
              <li>🔒 Eliminar cuenta: puedes eliminar tu cuenta desde tu perfil en cualquier momento. También se añadió un aviso de privacidad en "Acerca de".</li>
              <li>🌐 El texto de la app ahora vive en un diccionario de traducción, preparando el terreno para que en el futuro se pueda usar en otros idiomas.</li>
              <li>🧯 Más estabilidad: un error inesperado ya no deja la pantalla en blanco, ahora muestra un aviso con la opción de recargar la página.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-gray-900">30 de junio – 1 de julio de 2026</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>🏷️ Etiquetas colaborativas: cualquier miembro puede añadir etiquetas a cualquier libro, no solo el dueño.</li>
              <li>📊 Página de estadísticas de la biblioteca.</li>
              <li>🎁 Marca tus libros como "para regalar" o "en venta", y archívalos cuando ya no estén disponibles (sin perder el historial de préstamos).</li>
              <li>☰ Menú de navegación y botón para volver arriba al hacer scroll.</li>
              <li>🔍 Búsqueda y filtro de libros, con orden por más recientes.</li>
              <li>🎨 Rediseño visual responsive, se ve bien también en el móvil.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-gray-900">Lanzamiento inicial</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Inicio de sesión y registro.</li>
              <li>Perfil con tus libros, préstamos e historial.</li>
              <li>Búsqueda de libros por ISBN para rellenar título, autor y portada automáticamente.</li>
              <li>Prestar y devolver libros entre miembros del grupo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
