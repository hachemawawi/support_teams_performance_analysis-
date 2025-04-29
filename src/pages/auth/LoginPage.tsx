import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import TextField from '../../components/shared/TextField';
import Button from '../../components/shared/Button';

interface LoginFormValues {
  email: string;
  password: string;
}

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm<LoginFormValues>();
  
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setErrorMessage(null);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage('Invalid email or password. Please try again.');
    }
  };

  return (
    <div>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
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
        </div>
        
        <div className="mt-6">
          <Button 
            type="submit" 
            fullWidth 
            isLoading={isSubmitting}
          >
            Sign in
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;