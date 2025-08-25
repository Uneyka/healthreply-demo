export default function Badge({ children, tone='default' }:{children:React.ReactNode; tone?:'default'|'success'|'danger'}) {
  const map = {
    default:'bg-white/10 text-white border border-white/20',
    success:'bg-emerald-600/20 text-emerald-900 border border-emerald-700/30',
    danger:'bg-red-600/20 text-red-900 border border-red-700/30',
  } as const
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${map[tone]}`}>{children}</span>
}
