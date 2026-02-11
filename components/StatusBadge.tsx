import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: {
      label: 'Pending Assignment',
      className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    },
    assigned: {
      label: 'Agent Assigned',
      className: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    },
    submitted: {
      label: 'Under Review',
      className: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
    },
    verified: {
      label: 'Verified',
      className: 'bg-green-500/10 text-green-700 border-green-500/20',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-500/10 text-red-700 border-red-500/20',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
