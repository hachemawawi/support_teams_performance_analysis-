import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import TextField from '../../components/shared/TextField';
import Button from '../../components/shared/Button';

interface RegisterFormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors, isSubmitting } 
  } = useForm<RegisterFormValues>();
  
  const password = watch('password');
  
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setErrorMessage(null);
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
      });
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage('Registration failed. This email may already be in use.');
    }
  };

  return (
    <div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
      
      <form className="mt-8" onSubmit={handleSubmit(onSubmit)}>
        {errorMessage && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              id="firstName"
              type="text"
              label="First name"
              placeholder="John"
              icon={<User size={18} />}
              error={errors.firstName?.message}
              {...register('firstName', { 
                required: 'First name is required',
                maxLength: {
                  value: 50,
                  message: 'First name is too long'
                }
              })}
            />
            
            <TextField
              id="lastName"
              type="text"
              label="Last name"
              placeholder="Doe"
              icon={<User size={18} />}
              error={errors.lastName?.message}
              {...register('lastName', { 
                required: 'Last name is required',
                maxLength: {
                  value: 50,
                  message: 'Last name is too long'
                }
              })}
            />
          </div>
          
          <TextField
            id="email"
            type="email"
            label="Email address"
            placeholder="your@email.com"
            icon={<Mail size={18} />}
            error={errors.email?.message}
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
          />
          
          <TextField
            id="password"
            type="password"
            label="Password"
            placeholder="********"
            icon={<Lock size={18} />}
            error={errors.password?.message}
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
          />
          
          <TextField
            id="confirmPassword"
            type="password"
            label="Confirm password"
            placeholder="********"
            icon={<Lock size={18} />}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', { 
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match'
            })}
          />
        </div>
        
        <div className="mt-6">
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isSubmitting}
          >
            Create account
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage;