import { useEffect, useState } from 'react';
import { useRequestStore } from '../../stores/requestStore';
import { Request, SentimentScore } from '../../types';
import PageHeader from '../../components/shared/PageHeader';
import { Clock, Activity, Target, AlertCircle, CheckCircle, MessageCircle, TrendingUp, BarChart2 } from 'lucide-react';
import SentimentBadge from '../../components/shared/SentimentBadge';

interface TechMetrics {
  totalTickets: number;
  resolvedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  criticalIssues: number;
  satisfactionRate: number;
  firstResponseResolution: number;
  reopenedTickets: number;
}

interface ActiveRequest {
  id: number;
  title: string;
  priority: number;
  status: string;
  createdAt: string;
  lastUpdated: string;
  responseTime?: number;
}

const TechDashboard = () => {
  const { requests, fetchRequests } = useRequestStore();
  const [loading, setLoading] = useState(true);
  const [techMetrics, setTechMetrics] = useState<TechMetrics>({
    totalTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    criticalIssues: 0,
    satisfactionRate: 0,
    firstResponseResolution: 0,
    reopenedTickets: 0
  });
  const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<Request[]>([]);

  useEffect(() => {
    const loadData = async () => {
      await fetchRequests();
      setLoading(false);
    };
    loadData();
  }, [fetchRequests]);

  useEffect(() => {
    if (!loading) {
      // Filter tech department requests
      const techRequests = requests.filter(req => req.department === 'it');
      const resolvedTechRequests = techRequests.filter(req => req.status === 'resolved');
      const criticalRequests = techRequests.filter(req => req.priority === 1);
      
      // Calculate first response resolution rate
      const firstResponseResolved = techRequests.filter(req => {
        const comments = req.comments || [];
        return comments.length <= 2 && req.status === 'resolved';
      });

      // Calculate reopened tickets
      const reopenedCount = techRequests.filter(req => {
        const comments = req.comments || [];
        return comments.some(c => c.content?.toLowerCase().includes('reopen'));
      });

      // Calculate satisfaction rate
      let positiveFeedback = 0;
      let totalFeedback = 0;
      techRequests.forEach(req => {
        req.comments?.forEach(comment => {
          if (comment.user?.role === 'user' && comment.sentiment) {
            totalFeedback++;
            if (comment.sentiment.score >= SentimentScore.NEUTRAL) {
              positiveFeedback++;
            }
          }
        });
      });

      // Update tech metrics
      const metrics: TechMetrics = {
        totalTickets: techRequests.length,
        resolvedTickets: resolvedTechRequests.length,
        avgResponseTime: techRequests.reduce((acc, req) => {
          return acc + (Math.random() * 24); // Mock response time
        }, 0) / (techRequests.length || 1),
        avgResolutionTime: resolvedTechRequests.reduce((acc, req) => {
          return acc + (Math.random() * 72); // Mock resolution time
        }, 0) / (resolvedTechRequests.length || 1),
        criticalIssues: criticalRequests.length,
        satisfactionRate: totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0,
        firstResponseResolution: techRequests.length > 0 
          ? (firstResponseResolved.length / techRequests.length) * 100 
          : 0,
        reopenedTickets: reopenedCount.length
      };

      // Get active requests
      const active = techRequests
        .filter(req => req.status !== 'resolved')
        .map(req => ({
          id: req.id,
          title: req.title,
          priority: req.priority,
          status: req.status,
          createdAt: req.createdAt,
          lastUpdated: req.updatedAt,
          responseTime: Math.random() * 24 // Mock response time
        }))
        .sort((a, b) => b.priority - a.priority);

      // Get recent activity
      const recent = [...techRequests]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

      setTechMetrics(metrics);
      setActiveRequests(active);
      setRecentActivity(recent);
    }
  }, [requests, loading]);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-50';
      case 2: return 'text-orange-600 bg-orange-50';
      case 3: return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-600 bg-blue-50';
      case 'in_progress': return 'text-purple-600 bg-purple-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Tech Dashboard" 
        subtitle="Overview of your assigned requests and performance metrics"
      />
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ticket Resolution */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Ticket Resolution</p>
              <p className="mt-1 text-2xl font-semibold text-blue-900">
                {techMetrics.resolvedTickets}/{techMetrics.totalTickets}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(techMetrics.resolvedTickets / techMetrics.totalTickets) * 100}%` }}
              />
            </div>
            <p className="text-sm text-blue-600 mt-1">
              {((techMetrics.resolvedTickets / techMetrics.totalTickets) * 100).toFixed(1)}% Resolution Rate
            </p>
          </div>
        </div>

        {/* Response Times */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Response Time</p>
              <p className="mt-1 text-2xl font-semibold text-green-900">
                {techMetrics.avgResponseTime.toFixed(1)}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-600">Avg. Resolution</span>
              <span className="text-green-800 font-medium">
                {techMetrics.avgResolutionTime.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>

        {/* Critical Issues */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Critical Issues</p>
              <p className="mt-1 text-2xl font-semibold text-red-900">
                {techMetrics.criticalIssues}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-red-600">Reopened</span>
            <span className="text-red-800 font-medium">{techMetrics.reopenedTickets}</span>
          </div>
        </div>

        {/* First Response Resolution */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">First Response Resolution</p>
              <p className="mt-1 text-2xl font-semibold text-purple-900">
                {techMetrics.firstResponseResolution.toFixed(1)}%
              </p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="w-full bg-purple-100 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${techMetrics.firstResponseResolution}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Active Requests and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Requests */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Active Requests</h3>
            <span className="text-sm text-gray-500">{activeRequests.length} open tickets</span>
          </div>
          <div className="space-y-4">
            {activeRequests.map(request => (
              <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      P{request.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 mt-2">{request.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Created {new Date(request.createdAt).toLocaleDateString()}</span>
                    {request.responseTime && (
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {request.responseTime.toFixed(1)}h
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">{activity.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated {new Date(activity.updatedAt).toLocaleDateString()}
                  </p>
                  {activity.comments && activity.comments.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="line-clamp-1">
                        Latest: {activity.comments[activity.comments.length - 1].content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Satisfaction Rate */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Customer Satisfaction</h3>
            <div className="text-sm text-gray-500">Target: 90%</div>
          </div>
          <div className="relative pt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-2xl font-semibold text-gray-900">
                {techMetrics.satisfactionRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full"
                style={{ width: `${techMetrics.satisfactionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Resolution Efficiency */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Resolution Efficiency</h3>
            <BarChart2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">First Response</p>
              <p className="text-2xl font-semibold text-gray-900">
                {techMetrics.firstResponseResolution.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Resolution</p>
              <p className="text-2xl font-semibold text-gray-900">
                {techMetrics.avgResolutionTime.toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechDashboard;