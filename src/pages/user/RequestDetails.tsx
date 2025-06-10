import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Calendar, 
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useRequestStore } from '../../stores/requestStore';
import { RequestStatus, Department } from '../../types';
import { DEPARTMENT_LABELS } from '../../config';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/shared/Button';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import SentimentBadge from '../../components/shared/SentimentBadge';
import Spinner from '../../components/shared/Spinner';

interface CommentFormValues {
  content: string;
}

const RequestDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentRequest, loading, fetchRequestById, addComment } = useRequestStore();
  const { register, handleSubmit, reset } = useForm<CommentFormValues>();

  useEffect(() => {
    if (id) {
      fetchRequestById(parseInt(id));
    }
  }, [id, fetchRequestById]);

  const onSubmit = async (data: CommentFormValues) => {
    if (id) {
      try {
        await addComment(parseInt(id), data.content);
        reset();
      } catch (error) {
        console.error('Failed to add comment:', error);
      }
    }
  };

  if (loading || !currentRequest) {
    return <Spinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{currentRequest.title}</h1>
              <p className="mt-1 text-sm text-gray-500">Request #{currentRequest.id}</p>
            </div>
            <StatusBadge status={currentRequest.status} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Created by:</span>
              <span className="font-medium text-gray-900">
                {currentRequest.user?.firstName} {currentRequest.user?.lastName}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {format(new Date(currentRequest.createdAt), 'MMM d, yyyy')}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Department:</span>
              <span className="font-medium text-gray-900">
                {DEPARTMENT_LABELS[currentRequest.department as Department]}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-600">Priority:</span>
              <PriorityBadge priority={currentRequest.priority} />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900">Description</h3>
            <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">
              {currentRequest.description}
            </p>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Comments</h3>
            <div className="space-y-4">
              {currentRequest.comments?.map((comment, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {comment.user?.firstName} {comment.user?.lastName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      {comment.sentiment && (
                        <SentimentBadge 
                          score={comment.sentiment.score} 
                          confidence={comment.sentiment.confidence}
                        />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
              <div className="flex items-start space-x-4">
                <div className="min-w-0 flex-1">
                  <textarea
                    {...register('content', { required: true })}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="Add your comment..."
                  />
                </div>
                <Button type="submit" icon={<Send size={16} />}>
                  Send
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;