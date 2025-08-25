export default function Badge({ children, tone='default' }:{children:React.ReactNode; tone?:'default'|'success'|'danger'}) {
  if (tone==='success') return <span className="badge badge-green">{children}</span>
  if (tone==='danger')  return <span className="badge badge-red">{children}</span>
  return <span className="badge bg-slate-100 text-slate-700">{children}</span>
}
