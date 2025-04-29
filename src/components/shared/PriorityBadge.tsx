import { Priority } from '../../types';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '../../config';

interface PriorityBadgeProps {
  priority: Priority;
}

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
};

export default PriorityBadge;