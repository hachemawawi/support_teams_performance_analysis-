import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  Clock, 
  User, 
  Calendar, 
  MessageSquare 
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRequestStore } from '../../stores/requestStore';
import { RequestStatus, Department, Priority } from '../../types';
import { DEPARTMENT_LABELS } from '../../config';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/shared/Button';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import Spinner from '../../components/shared/Spinner';

interface CommentFormValues {
  content: string;
}

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentRequest, loading, fetchRequestById, addComment } = useRequestStore();
  const [submitting, setSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<CommentFormValues>();
  
  useEffect(() => {
    if (id) {
      fetchRequestById(parseInt(id));
    }
  }, [id, fetchRequestById]);
  
  const onSubmitComment = async (data: CommentFormValues) => {
    if (!id) return;
    
    setSubmitting(true);
    try {
      await addComment(parseInt(id), data.content);
      reset();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading || !currentRequest) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Request #${currentRequest.id}`}
        subtitle={currentRequest.title}
        actions={
          <Button
            variant="ghost"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/requests')}
          >
            Back to Requests
          </Button>
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Request Details</h2>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={currentRequest.status} />
                  <PriorityBadge priority={currentRequest.priority} />
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-medium text-gray-900 mb-4">{currentRequest.title}</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{currentRequest.description}</p>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-2">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Submitted by</p>
                    <p className="text-sm font-medium text-gray-900">
                      {currentRequest.user?.firstName} {currentRequest.user?.lastName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-2">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date submitted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(currentRequest.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comments section */}
          <div className="mt-6 bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <MessageSquare size={18} className="text-gray-400 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Comments</h2>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {currentRequest.comments && currentRequest.comments.length > 0 ? (
                currentRequest.comments.map((comment) => (
                  <div key={comment.id} className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-2">
                          {comment.user?.firstName?.charAt(0) || 'U'}{comment.user?.lastName?.charAt(0) || ''}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {comment.user?.role}
                      </div>
                    </div>
                    
                    <div className="pl-10">
                      <p className="text-gray-700 whitespace-pre-line">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No comments yet
                </div>
              )}
            </div>
            
            {/* Add comment form */}
            <div className="p-6 bg-gray-50">
              <form onSubmit={handleSubmit(onSubmitComment)}>
                <div>
                  <label htmlFor="content" className="sr-only">Comment</label>
                  <textarea
                    id="content"
                    rows={3}
                    className={`
                      w-full rounded-md shadow-sm
                      ${errors.content ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 
                        'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
                    `}
                    placeholder="Add a comment..."
                    {...register('content', { 
                      required: 'Comment cannot be empty',
                      minLength: {
                        value: 5,
                        message: 'Comment must be at least 5 characters'
                      }
                    })}
                  ></textarea>
                  {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>}
                </div>
                
                <div className="mt-2 flex justify-end">
                  <Button
                    type="submit"
                    isLoading={submitting}
                    icon={<Send size={16} />}
                  >
                    Post Comment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Request info sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Request Information</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <StatusBadge status={currentRequest.status} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                <PriorityBadge priority={currentRequest.priority} />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
                <p className="text-sm text-gray-900">
                  {DEPARTMENT_LABELS[currentRequest.department as Department]}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                {currentRequest.assignee ? (
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs mr-2">
                      {currentRequest.assignee.firstName?.charAt(0) || 'T'}{currentRequest.assignee.lastName?.charAt(0) || ''}
                    </div>
                    <p className="text-sm text-gray-900">
                      {currentRequest.assignee.firstName} {currentRequest.assignee.lastName}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Not assigned yet</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="p-1 rounded-full bg-blue-100 text-blue-600 mr-2">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">Created</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(currentRequest.createdAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  
                  {currentRequest.status === RequestStatus.RESOLVED && (
                    <div className="flex items-start">
                      <div className="p-1 rounded-full bg-green-100 text-green-600 mr-2">
                        <CheckCircle2 size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">Resolved</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(currentRequest.updatedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;