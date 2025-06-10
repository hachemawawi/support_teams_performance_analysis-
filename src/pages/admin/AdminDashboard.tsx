import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/shared/PageHeader';
import { Activity, Users, FileText, BarChart3, Clock, ThumbsUp, Meh, ThumbsDown } from 'lucide-react';
import { useDashboardStore } from '../../stores/dashboardStore';
import { REQUEST_STATUS_COLORS, DEPARTMENT_LABELS } from '../../config';
import { RequestStatus, Department, SentimentScore, Request, Comment } from '../../types';

interface RecentRequest {
  id: number;
  title: string;
  status: RequestStatus;
  createdAt: string;
}

interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  keywords: string[];
  averageConfidence: number;
}

const AdminDashboard = () => {
  const { stats, loading, error, fetchDashboardStats } = useDashboardStore();
  const [sentimentStats, setSentimentStats] = useState<SentimentDistribution>({
    positive: 0,
    neutral: 0,
    negative: 0,
    total: 0,
    keywords: [],
    averageConfidence: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  useEffect(() => {
    if (stats?.requests) {
      const distribution = {
        positive: 0,
        neutral: 0,
        negative: 0,
        total: 0,
        keywords: new Set<string>(),
        totalConfidence: 0,
        commentCount: 0
      };

      stats.requests.forEach((request: Request) => {
        if (request.comments) {
          request.comments.forEach((comment: Comment) => {
            if (comment.sentiment && comment.user?.role === 'user') {
              distribution.total++;
              distribution.commentCount++;
              distribution.totalConfidence += comment.sentiment.confidence;

              // Add keywords to the set
              if (comment.sentiment.keywords) {
                comment.sentiment.keywords.forEach(keyword => 
                  distribution.keywords.add(keyword.toLowerCase())
                );
              }

              if (comment.sentiment.score >= SentimentScore.POSITIVE) {
                distribution.positive++;
              } else if (comment.sentiment.score <= SentimentScore.NEGATIVE) {
                distribution.negative++;
              } else {
                distribution.neutral++;
              }
            }
          });
        }

        // Include request's overall sentiment if available
        if (request.overallSentiment) {
          distribution.totalConfidence += request.overallSentiment.confidence;
          distribution.commentCount++;
          
          if (request.overallSentiment.keywords) {
            request.overallSentiment.keywords.forEach(keyword => 
              distribution.keywords.add(keyword.toLowerCase())
            );
          }
        }
      });

      setSentimentStats({
        positive: distribution.positive,
        neutral: distribution.neutral,
        negative: distribution.negative,
        total: distribution.total,
        keywords: Array.from(distribution.keywords).slice(0, 10), // Top 10 keywords
        averageConfidence: distribution.commentCount > 0 
          ? distribution.totalConfidence / distribution.commentCount 
          : 0
      });
    }
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  const dashboardStats = [
    { 
      label: 'Total Requests', 
      value: stats?.totalRequests.toString() || '0', 
      icon: FileText, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Open Requests', 
      value: stats?.openRequests.toString() || '0', 
      icon: Activity, 
      color: 'text-green-600' 
    },
    { 
      label: 'Resolution Rate', 
      value: stats?.resolvedRequests && stats.totalRequests 
        ? `${Math.round((stats.resolvedRequests / stats.totalRequests) * 100)}%` 
        : '0%', 
      icon: BarChart3, 
      color: 'text-purple-600' 
    },
    { 
      label: 'Avg Response Time', 
      value: stats?.avgResponseTime ? `${stats.avgResponseTime.toFixed(1)}h` : '0h', 
      icon: Clock, 
      color: 'text-orange-600' 
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Overview of system performance and key metrics"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} bg-gray-50 p-3 rounded-full`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Sentiment Analysis Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Overall User Sentiment Analysis</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Positive Sentiment */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <ThumbsUp className="w-5 h-5 text-green-500 mr-2" />
                  <span className="font-medium text-green-700">Positive</span>
                </div>
                <span className="text-lg font-semibold text-green-700">
                  {sentimentStats.total > 0 
                    ? `${((sentimentStats.positive / sentimentStats.total) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ 
                    width: `${sentimentStats.total > 0 
                      ? (sentimentStats.positive / sentimentStats.total) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <p className="text-sm text-green-600 mt-1">{sentimentStats.positive} responses</p>
            </div>

            {/* Neutral Sentiment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Meh className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium text-gray-700">Neutral</span>
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {sentimentStats.total > 0 
                    ? `${((sentimentStats.neutral / sentimentStats.total) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-500 h-2 rounded-full"
                  style={{ 
                    width: `${sentimentStats.total > 0 
                      ? (sentimentStats.neutral / sentimentStats.total) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">{sentimentStats.neutral} responses</p>
            </div>

            {/* Negative Sentiment */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <ThumbsDown className="w-5 h-5 text-red-500 mr-2" />
                  <span className="font-medium text-red-700">Negative</span>
                </div>
                <span className="text-lg font-semibold text-red-700">
                  {sentimentStats.total > 0 
                    ? `${((sentimentStats.negative / sentimentStats.total) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="w-full bg-red-100 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ 
                    width: `${sentimentStats.total > 0 
                      ? (sentimentStats.negative / sentimentStats.total) * 100 
                      : 0}%` 
                  }}
                />
              </div>
              <p className="text-sm text-red-600 mt-1">{sentimentStats.negative} responses</p>
            </div>
          </div>

          {/* Additional Sentiment Insights */}
          <div className="border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Common Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {sentimentStats.keywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Analysis Confidence</h4>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${sentimentStats.averageConfidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {(sentimentStats.averageConfidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
          <p className="text-sm text-gray-500 mt-1">Latest support requests</p>
          <div className="mt-4 space-y-4">
            {stats?.recentRequests && stats.recentRequests.length > 0 ? (
              stats.recentRequests.map((request: RecentRequest) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{request.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${REQUEST_STATUS_COLORS[request.status]}`}>
                    {request.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No recent requests</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Requests by Department</h3>
          <p className="text-sm text-gray-500 mt-1">Distribution of requests across departments</p>
          <div className="mt-4 space-y-4">
            {stats?.requestsByDepartment && Object.entries(stats.requestsByDepartment).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{DEPARTMENT_LABELS[dept as Department]}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;