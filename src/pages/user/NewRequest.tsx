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
  serviceType: string;
  accountNumber: string;
  location: string;
  issueType: string;
}

const NewRequest = () => {
  const navigate = useNavigate();
  const { createRequest } = useRequestStore();
  const [submitting, setSubmitting] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<NewRequestFormValues>();

  const serviceTypeOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tv', label: 'TV' },
    { value: 'landline', label: 'Landline' }
  ];

  const issueTypeOptions = [
    { value: 'connectivity', label: 'Connectivity Issues' },
    { value: 'speed', label: 'Speed Problems' },
    { value: 'billing', label: 'Billing Issues' },
    { value: 'equipment', label: 'Equipment Problems' },
    { value: 'installation', label: 'Installation Request' },
    { value: 'other', label: 'Other' }
  ];
  
  const onSubmit = async (data: NewRequestFormValues) => {
    setSubmitting(true);
    try {
      await createRequest({
        title: data.title,
        description: data.description,
        serviceType: data.serviceType,
        accountNumber: data.accountNumber,
        location: data.location,
        issueType: data.issueType
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
                id="serviceType"
                label="Service Type"
                options={serviceTypeOptions}
                error={errors.serviceType?.message}
                {...register('serviceType', { 
                  required: 'Service type is required'
                })}
              />
              
              <TextField
                id="accountNumber"
                label="Account Number"
                placeholder="Your account number"
                error={errors.accountNumber?.message}
                {...register('accountNumber', { 
                  required: 'Account number is required'
                })}
              />
            </div>

            <TextField
              id="location"
              label="Service Location"
              placeholder="Address where service is installed"
              error={errors.location?.message}
              {...register('location', { 
                required: 'Location is required'
              })}
            />

            <Select
              id="issueType"
              label="Issue Type"
              options={issueTypeOptions}
              error={errors.issueType?.message}
              {...register('issueType', { 
                required: 'Issue type is required'
              })}
            />

            <TextField
              id="description"
              label="Description"
              placeholder="Detailed description of your issue"
              multiline
              rows={4}
              error={errors.description?.message}
              {...register('description', { 
                required: 'Description is required',
                minLength: {
                  value: 20,
                  message: 'Description must be at least 20 characters'
                }
              })}
            />
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
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