import type { ServiceStatus } from '../types/dashboard'

interface StatusBadgeProps {
  status: ServiceStatus
}

function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {status}
    </span>
  )
}

export default StatusBadge
