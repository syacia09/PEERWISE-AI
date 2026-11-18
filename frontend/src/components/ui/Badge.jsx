import { clsx } from 'clsx'

export function Badge({ children, variant = 'gray', className }) {
  const variants = {
    gray: 'badge-gray',
    blue: 'badge-blue',
    green: 'badge-green',
    yellow: 'badge-yellow',
    red: 'badge-red',
  }
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const map = {
    menunggu: { label: 'Menunggu', variant: 'yellow' },
    diterima: { label: 'Diterima', variant: 'green' },
    ditolak: { label: 'Ditolak', variant: 'red' },
    selesai: { label: 'Selesai', variant: 'blue' },
  }
  const config = map[status] || { label: status, variant: 'gray' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
