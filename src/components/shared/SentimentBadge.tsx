import { SentimentScore } from '../../types';
import { SENTIMENT_COLORS, SENTIMENT_LABELS } from '../../config';

interface SentimentBadgeProps {
  score: SentimentScore;
  confidence?: number;
}

const SentimentBadge = ({ score, confidence }: SentimentBadgeProps) => {
  return (
    <div className="flex items-center space-x-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SENTIMENT_COLORS[score]}`}>
        {SENTIMENT_LABELS[score]}
      </span>
      {confidence !== undefined && (
        <span className="text-xs text-gray-500">
          {(confidence * 100).toFixed(0)}% confidence
        </span>
      )}
    </div>
  );
};

export default SentimentBadge; 