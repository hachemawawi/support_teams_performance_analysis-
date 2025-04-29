import { RequestStatus } from '../../types';
import { REQUEST_STATUS_COLORS } from '../../config';

interface StatusBadgeProps {
  status: RequestStatus;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusLabels = {
    new: 'New',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${REQUEST_STATUS_COLORS[status]}`}>
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;