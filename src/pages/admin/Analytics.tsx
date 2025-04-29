import { useEffect, useState } from 'react';
import { useRequestStore } from '../../stores/requestStore';
import { Request } from '../../types';
import PageHeader from '../../components/shared/PageHeader';
import { BarChart3, TrendingUp, TrendingDown, Smile, Frown, Meh } from 'lucide-react';

interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

interface DepartmentSentiment {
  department: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

const Analytics = () => {
  const { requests, fetchRequests } = useRequestStore();
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0
  });
  const [departmentSentiments, setDepartmentSentiments] = useState<DepartmentSentiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchRequests();
      setLoading(false);
    };
    loadData();
  }, [fetchRequests]);

  useEffect(() => {
    // This is a placeholder for the actual sentiment analysis
    // Replace this with real sentiment analysis once the Python backend is ready
    const calculateSentiments = () => {
      const stats = {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0
      };

      const departmentStats: Record<string, DepartmentSentiment> = {};

      requests.forEach(request => {
        if (request.comments && request.comments.length > 0) {
          // Placeholder: randomly assign sentiments
          // This will be replaced with actual sentiment analysis
          const sentiments = ['positive', 'neutral', 'negative'];
          request.comments.forEach(comment => {
            const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)] as keyof SentimentStats;
            stats[randomSentiment]++;
            stats.total++;

            // Initialize department stats if not exists
            if (!departmentStats[request.department]) {
              departmentStats[request.department] = {
                department: request.department,
                positive: 0,
                neutral: 0,
                negative: 0,
                total: 0
              };
            }
            departmentStats[request.department][randomSentiment]++;
            departmentStats[request.department].total++;
          });
        }
      });

      setSentimentStats(stats);
      setDepartmentSentiments(Object.values(departmentStats));
    };

    if (!loading) {
      calculateSentiments();
    }
  }, [requests, loading]);

  const getSentimentPercentage = (value: number) => {
    return sentimentStats.total > 0 ? ((value / sentimentStats.total) * 100).toFixed(1) : '0';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Dashboard"
        description="Sentiment analysis and insights from user feedback"
      />

      {/* Overall Sentiment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Positive Sentiment</p>
              <p className="mt-1 text-2xl font-semibold text-green-600">
                {getSentimentPercentage(sentimentStats.positive)}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-full">
              <Smile className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Neutral Sentiment</p>
              <p className="mt-1 text-2xl font-semibold text-yellow-600">
                {getSentimentPercentage(sentimentStats.neutral)}%
              </p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-full">
              <Meh className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Negative Sentiment</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">
                {getSentimentPercentage(sentimentStats.negative)}%
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-full">
              <Frown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Department Sentiment Analysis */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Department Sentiment Analysis</h3>
        <div className="space-y-4">
          {departmentSentiments.map((dept) => (
            <div key={dept.department} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  {dept.department.toUpperCase()}
                </h4>
                <span className="text-sm text-gray-500">
                  {dept.total} comments
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-green-500"
                    style={{ width: `${(dept.positive / dept.total) * 100}%` }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${(dept.neutral / dept.total) * 100}%` }}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${(dept.negative / dept.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder for future sentiment trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sentiment Trends</h3>
          <p className="text-sm text-gray-500">
            Sentiment analysis trends will be displayed here once more data is available.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Keywords</h3>
          <p className="text-sm text-gray-500">
            Common keywords and phrases from user feedback will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;