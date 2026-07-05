import { Header } from '../components/Header'

export function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Header />
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">🕘 Novedades</h1>

        <div className="space-y-8 text-gray-700">
          <div>
            <h2 className="mb-2 font-semibold text-gray-900">5 de julio de 2026</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>🔐 Mejoras de seguridad: reforzamos varios permisos internos de la aplicación.</li>
              <li>✅ Aprobación de nuevos miembros: las cuentas nuevas ahora quedan pendientes de aprobación. Mientras esperan, pueden explorar y buscar en la biblioteca con normalidad, pero necesitan que un administrador las apruebe para poder pedir prestado, comentar, añadir etiquetas o añadir libros.</li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 font-semibold text-gray-900">2 de julio de 2026</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>🔄 Transferir un libro: si regalas o vendes un libro, ahora puedes transferirle la propiedad a quien lo recibe directamente desde la página del libro (no disponible mientras el libro esté prestado).</li>
              <li>🔒 Eliminar cuenta: ahora también se bloquea si tienes libros de otras personas pedidos prestados, no solo si tú tienes libros prestados a otros.</li>
              <li>💬 Comentarios en los libros: comparte tu opinión o reacción sobre un libro ("a mi hija le encantó", "daba un poco de miedo") en su página de detalle.</li>
              <li>↔️ Navegación anterior/siguiente: en la página de un libro, puedes pasar al siguiente o anterior de la lista que estabas viendo, sin volver a la biblioteca cada vez.</li>
              <li>🏷️ Categorías: los libros ahora tienen una categoría (Infantil, Juvenil, Adultos, Cómic, Poesía, Arte, Aprendizaje de idiomas), visible como etiqueta en cada libro. Puedes filtrar la biblioteca por categoría, y elegirla o cambiarla al añadir o editar un libro.</li>
              <li>🔍 Búsqueda mejorada: ahora la búsqueda también revisa la descripción del libro, no solo título, autor y etiquetas, y tolera pequeños errores de escritura.</li>
              <li>🏷️ Los filtros de "Estado" y "Categoría" ahora tienen su propia etiqueta, para que quede claro qué filtra cada uno.</li>
            </ul>
          </div>

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
