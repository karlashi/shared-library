import { Header } from '../components/Header'

export function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Header />
        <p className="mb-6 text-gray-600">Acerca de este sitio</p>

        <div className="space-y-4 text-gray-700">
          <p>
            Biblioteca Compartida es una biblioteca privada para compartir libros dentro de
            un pequeño grupo. Cada persona puede añadir los libros que tiene, y el resto del
            grupo puede pedirlos prestados.
          </p>

          <p>
            <b>¿Cómo funciona?</b> Cada miembro añade sus propios libros a la biblioteca,
            con título, autor y una portada (que se puede rellenar automáticamente
            buscando por ISBN). Cualquier otro miembro puede pedir prestado un libro
            disponible, y el dueño lo marca como devuelto cuando lo recibe de vuelta. El
            perfil de cada persona guarda un historial de lo que ha prestado y pedido
            prestado.
          </p>

          <p>
            Este sitio es solo para el grupo — es necesario tener una cuenta para ver o
            usar la biblioteca.
          </p>

          <div>
            <b>Privacidad</b>
            <p className="mt-1">
              Guardamos tu nombre, tu email y la actividad de la biblioteca que generas
              (libros que añades, préstamos) para poder ofrecer el servicio. Los datos se
              alojan en Supabase, en un centro de datos dentro de la UE (Irlanda). Puedes
              eliminar tu cuenta en cualquier momento desde tu perfil — tu nombre se
              anonimiza y dejas de poder iniciar sesión, aunque el historial de préstamos
              con otros miembros se conserva para no afectar sus propios registros.
            </p>
          </div>

          <p>
            Creado por <b>Carla Shinzato</b>.
            <br />
            Contacto: <span className="text-gray-500">(próximamente)</span>
          </p>
        </div>
      </div>
    </div>
  )
}
