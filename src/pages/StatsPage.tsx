import { useBooks, useAllLoans, useProfiles } from '../services/queries'
import { Header } from '../components/Header'

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-center">
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-600">{label}</p>
    </div>
  )
}

export function StatsPage() {
  const { data: books = [] } = useBooks()
  const { data: loans = [] } = useAllLoans()
  const { data: profiles = [] } = useProfiles()

  const activeBooks = books.filter((b) => !b.archived)
  const archivedBooks = books.filter((b) => b.archived)
  const activeLoans = loans.filter((l) => !l.returned_at)
  const listedBooks = activeBooks.filter((b) => b.listing_type)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Header />

        <h1 className="mb-5 text-2xl font-semibold text-gray-900">📊 Estadísticas</h1>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Libros activos" value={activeBooks.length} />
          <StatCard label="Libros archivados" value={archivedBooks.length} />
          <StatCard label="Miembros" value={profiles.length} />
          <StatCard label="Préstamos totales" value={loans.length} />
          <StatCard label="Préstamos activos" value={activeLoans.length} />
          <StatCard label="Para regalar/vender" value={listedBooks.length} />
        </div>
      </div>
    </div>
  )
}
