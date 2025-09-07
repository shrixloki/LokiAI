import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRegistration } from '@/components/auth/user-registration';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleRegistrationSuccess = (user: any) => {
    console.log('Registration successful:', user);
    setRegistrationComplete(true);
    
    // Redirect to dashboard after successful registration
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="text-scale-gray-400 hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Registration Component */}
        <UserRegistration
          onSuccess={handleRegistrationSuccess}
          onCancel={handleCancel}
        />

        {registrationComplete && (
          <div className="text-center space-y-2">
            <p className="text-green-400 text-sm">
              Registration complete! Redirecting to dashboard...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
