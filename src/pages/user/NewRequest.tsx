import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FileText, Send } from 'lucide-react';
import { useRequestStore } from '../../stores/requestStore';
import { Department, Priority } from '../../types';
import { DEPARTMENT_LABELS, PRIORITY_LABELS } from '../../config';
import PageHeader from '../../components/shared/PageHeader';
import TextField from '../../components/shared/TextField';
import Select from '../../components/shared/Select';
import Button from '../../components/shared/Button';

interface NewRequestFormValues {
  title: string;
  description: string;
  department: Department;
  priority: Priority;
}

const NewRequest = () => {
  const navigate = useNavigate();
  const { createRequest } = useRequestStore();
  const [submitting, setSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<NewRequestFormValues>({
    defaultValues: {
      priority: Priority.MEDIUM,
      department: Department.IT
    }
  });
  
  const departmentOptions = Object.entries(DEPARTMENT_LABELS).map(([value, label]) => ({
    value,
    label
  }));
  
  const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
    value: parseInt(value),
    label
  }));
  
  const onSubmit = async (data: NewRequestFormValues) => {
    setSubmitting(true);
    try {
      await createRequest({
        title: data.title,
        description: data.description,
        department: data.department,
        priority: data.priority as Priority
      });
      navigate('/requests');
    } catch (error) {
      console.error('Failed to create request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create New Request"
        subtitle="Submit a new technical support request"
      />
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <TextField
              id="title"
              label="Request Title"
              placeholder="Brief summary of your request"
              error={errors.title?.message}
              {...register('title', { 
                required: 'Title is required',
                maxLength: {
                  value: 100,
                  message: 'Title must be less than 100 characters'
                }
              })}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                id="department"
                label="Department"
                options={departmentOptions}
                error={errors.department?.message}
                {...register('department', { 
                  required: 'Department is required'
                })}
              />
              
              <Select
                id="priority"
                label="Priority"
                options={priorityOptions}
                error={errors.priority?.message}
                {...register('priority', { 
                  required: 'Priority is required',
                  valueAsNumber: true
                })}
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={6}
                className={`
                  w-full rounded-md shadow-sm
                  ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 
                    'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
                `}
                placeholder="Please provide a detailed description of your request..."
                {...register('description', { 
                  required: 'Description is required',
                  minLength: {
                    value: 20,
                    message: 'Description must be at least 20 characters'
                  }
                })}
              ></textarea>
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/requests')}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                isLoading={submitting}
                icon={<Send size={18} />}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;