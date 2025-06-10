import { useEffect, useState } from 'react';
import { useRequestStore } from '../../stores/requestStore';
import { Request, SentimentScore, Department } from '../../types';
import { SENTIMENT_LABELS } from '../../config';
import PageHeader from '../../components/shared/PageHeader';
import { Clock, BarChart2, MessageCircle, ThumbsUp, Users, CheckCircle, Activity, Target, TrendingUp, AlertCircle } from 'lucide-react';
import SentimentBadge from '../../components/shared/SentimentBadge';

const DEPARTMENTS = [
  { id: 'customer_service', label: 'Customer Service', color: 'blue' },
  { id: 'finance', label: 'Finance', color: 'green' },
  { id: 'hr', label: 'Human Resources', color: 'purple' },
  { id: 'it', label: 'IT', color: 'indigo' },
  { id: 'operations', label: 'Operations', color: 'orange' }
] as const;

interface SentimentStats {
  positive: number;
  negative: number;
  total: number;
}

interface DepartmentStats {
  department: string;
  totalRequests: number;
  resolvedRequests: number;
  avgResponseTime: number;
  sentiments: SentimentStats;
  satisfaction: number;
  activeUsers: number;
  resolutionTime: number;
}

interface DashboardMetrics {
  totalRequests: number;
  resolvedRequests: number;
  activeUsers: number;
  avgResolutionTime: number;
  overallSatisfaction: number;
}

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

const Analytics = () => {
  const { requests, fetchRequests } = useRequestStore();
  const [sentimentStats, setSentimentStats] = useState<SentimentStats>({
    positive: 0,
    negative: 0,
    total: 0
  });
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalRequests: 0,
    resolvedRequests: 0,
    activeUsers: 0,
    avgResolutionTime: 0,
    overallSatisfaction: 0
  });
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await fetchRequests();
      setLoading(false);
    };
    loadData();
  }, [fetchRequests]);

  useEffect(() => {
    if (!loading) {
      const stats = {
        positive: 0,
        negative: 0,
        total: 0
      };

      const deptStats: Record<string, DepartmentStats> = {};
      const uniqueUsers = new Set<number>();
      let totalResolutionTime = 0;

      // Initialize department stats
      DEPARTMENTS.forEach(({ id }) => {
        deptStats[id] = {
          department: id,
          totalRequests: 0,
          resolvedRequests: 0,
          avgResponseTime: 0,
          sentiments: { positive: 0, negative: 0, total: 0 },
          satisfaction: 0,
          activeUsers: 0,
          resolutionTime: 0
        };
      });

      requests.forEach(request => {
        // Track unique users
        uniqueUsers.add(request.userId);

        // Update department stats
        if (request.department) {
          const dept = deptStats[request.department];
          dept.totalRequests++;
          if (request.status === 'resolved') {
            dept.resolvedRequests++;
            // Mock resolution time calculation
            const resolutionTime = Math.random() * 72; // Random time up to 72 hours
            dept.resolutionTime += resolutionTime;
            totalResolutionTime += resolutionTime;
          }
          
          // Calculate response time (mock data)
          const responseTime = Math.random() * 24;
          dept.avgResponseTime = (dept.avgResponseTime * (dept.totalRequests - 1) + responseTime) / dept.totalRequests;
          
          // Track department active users
          const deptUsers = new Set(request.comments?.map(c => c.user?.id).filter(Boolean) || []);
          dept.activeUsers = deptUsers.size;
        }

        // Process comments for sentiment analysis
        if (request.comments) {
          request.comments.forEach(comment => {
            if (comment.sentiment && comment.user?.role === 'user') {
              const score = comment.sentiment.score;
              
              // Update overall stats
              if (score >= SentimentScore.NEUTRAL) {
                stats.positive++;
                if (request.department) {
                  deptStats[request.department].sentiments.positive++;
                  deptStats[request.department].sentiments.total++;
                }
          } else {
                stats.negative++;
                if (request.department) {
                  deptStats[request.department].sentiments.negative++;
                  deptStats[request.department].sentiments.total++;
                }
              }
              stats.total++;
            }
          });
        }
      });

      // Calculate satisfaction scores for departments
      Object.values(deptStats).forEach(dept => {
        dept.satisfaction = dept.sentiments.total > 0 
          ? (dept.sentiments.positive / dept.sentiments.total) * 100 
          : 0;
      });

      // Calculate dashboard metrics
      const metrics: DashboardMetrics = {
        totalRequests: requests.length,
        resolvedRequests: requests.filter(r => r.status === 'resolved').length,
        activeUsers: uniqueUsers.size,
        avgResolutionTime: totalResolutionTime / (requests.length || 1),
        overallSatisfaction: stats.total > 0 ? (stats.positive / stats.total) * 100 : 0
      };

      // Calculate tech metrics
      const techRequests = requests.filter(req => req.department === 'it');
      const resolvedTechRequests = techRequests.filter(req => req.status === 'resolved');
      const criticalRequests = techRequests.filter(req => req.priority === 1);
      
      // Calculate first response resolution rate
      const firstResponseResolved = techRequests.filter(req => {
        const comments = req.comments || [];
        return comments.length <= 2 && req.status === 'resolved';
      });

      // Calculate reopened tickets (mock data - replace with actual logic)
      const reopenedCount = techRequests.filter(req => {
        const comments = req.comments || [];
        return comments.some(c => c.content?.toLowerCase().includes('reopen'));
      });

      // Calculate satisfaction rate from tech department comments
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

      const techMetricsData: TechMetrics = {
        totalTickets: techRequests.length,
        resolvedTickets: resolvedTechRequests.length,
        avgResponseTime: techRequests.reduce((acc, req) => {
          // Mock response time calculation - replace with actual logic
          return acc + (Math.random() * 24);
        }, 0) / (techRequests.length || 1),
        avgResolutionTime: resolvedTechRequests.reduce((acc, req) => {
          // Mock resolution time calculation - replace with actual logic
          return acc + (Math.random() * 72);
        }, 0) / (resolvedTechRequests.length || 1),
        criticalIssues: criticalRequests.length,
        satisfactionRate: totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0,
        firstResponseResolution: techRequests.length > 0 
          ? (firstResponseResolved.length / techRequests.length) * 100 
          : 0,
        reopenedTickets: reopenedCount.length
      };

      setSentimentStats(stats);
      setDepartmentStats(Object.values(deptStats));
      setDashboardMetrics(metrics);
      setTechMetrics(techMetricsData);
    }
  }, [requests, loading]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Performance Dashboard"
        subtitle="Real-time analytics and insights across departments"
      />

      {/* Tech Support Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tech Support Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ticket Volume & Resolution */}
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
        </div>

        {/* Tech Support Trends */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Satisfaction Rate */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-indigo-600">Customer Satisfaction</h4>
              <ThumbsUp className="w-6 h-6 text-indigo-500" />
            </div>
            <div className="relative pt-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-indigo-900">
                  {techMetrics.satisfactionRate.toFixed(1)}%
                </p>
                <div className="text-sm text-indigo-600">
                  Target: 90%
                </div>
              </div>
              <div className="mt-2 w-full bg-indigo-100 rounded-full h-3">
                <div 
                  className="bg-indigo-500 h-3 rounded-full"
                  style={{ width: `${techMetrics.satisfactionRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Resolution Time Trend */}
          <div className="bg-teal-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-teal-600">Resolution Efficiency</h4>
              <TrendingUp className="w-6 h-6 text-teal-500" />
            </div>
            <div className="relative pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-semibold text-teal-900">
                    {((techMetrics.resolvedTickets / techMetrics.totalTickets) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-teal-600">First Response Resolution</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-teal-900">
                    {techMetrics.avgResolutionTime.toFixed(1)}h
                  </p>
                  <p className="text-sm text-teal-600">Avg Resolution Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {dashboardMetrics.totalRequests}
              </p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">
                {((dashboardMetrics.resolvedRequests / dashboardMetrics.totalRequests) * 100).toFixed(1)}% resolved
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {dashboardMetrics.activeUsers}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">
                Across all departments
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {dashboardMetrics.avgResolutionTime.toFixed(1)}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">
                Time to resolve requests
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Satisfaction</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {dashboardMetrics.overallSatisfaction.toFixed(1)}%
              </p>
            </div>
            <ThumbsUp className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-gray-500">
                Based on user feedback
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Performance Analysis */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Department Performance Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Satisfaction Chart */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Department Satisfaction Rates</h4>
            <div className="space-y-3">
              {DEPARTMENTS.map(({ id, label, color }) => {
                const dept = departmentStats.find(d => d.department === id);
                if (!dept) return null;
                return (
                  <div key={id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-600">
                        {label}
                      </span>
                <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {dept.satisfaction.toFixed(1)}%
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({dept.sentiments.total} responses)
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                        className={`h-full bg-${color}-500 transition-all duration-500`}
                        style={{ width: `${dept.satisfaction}%` }}
                  />
                    </div>
                  </div>
                );
              })}
                </div>
              </div>

          {/* Department Response Times */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Average Response Times</h4>
            <div className="space-y-3">
              {DEPARTMENTS.map(({ id, label, color }) => {
                const dept = departmentStats.find(d => d.department === id);
                if (!dept) return null;
                return (
                  <div key={id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-600">
                        {label}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {dept.avgResponseTime.toFixed(1)}h
                        </span>
                        <span className="text-gray-500 text-xs">
                          ({dept.totalRequests} requests)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-${color}-500 transition-all duration-500`}
                        style={{ width: `${(dept.avgResponseTime / 24) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Department Resolution Rate</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {DEPARTMENTS.map(({ id, label, color }) => {
                const dept = departmentStats.find(d => d.department === id);
                if (!dept) return null;
                return (
                  <div key={id} className={`bg-${color}-50 rounded-lg p-4`}>
                    <h5 className="text-xs font-medium text-gray-500 mb-2">
                      {label}
                    </h5>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-semibold text-gray-900">
                          {((dept.resolvedRequests / dept.totalRequests) * 100).toFixed(0)}%
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <CheckCircle className="w-4 h-4 text-gray-400" />
                          <p className="text-xs text-gray-500">
                            {dept.resolvedRequests}/{dept.totalRequests}
                          </p>
                        </div>
                      </div>
                      <BarChart2 className={`w-5 h-5 text-${color}-400`} />
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;