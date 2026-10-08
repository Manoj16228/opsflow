import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Building, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    organizationName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData);
      showToast('Organization workspace registered successfully!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.error?.message || 'Registration failed. Check inputs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div
          className="inline-flex items-center gap-2 cursor-pointer mb-6"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">
            OPS<span className="text-brand-400">FLOW</span>
          </span>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-white">
          Create an Enterprise Organization
        </h2>
        <p className="mt-2 text-xs text-slate-400">
          Provision an isolated tenant environment with administrator credentials.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 backdrop-blur-md">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Organization Name"
              required
              placeholder="e.g. Apex Global Operations"
              leftIcon={<Building className="w-4 h-4" />}
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                required
                placeholder="Sarah"
                leftIcon={<User className="w-4 h-4" />}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />

              <Input
                label="Last Name"
                required
                placeholder="Jenkins"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>

            <Input
              label="Work Email"
              type="email"
              required
              placeholder="admin@company.io"
              leftIcon={<Mail className="w-4 h-4" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              helperText="Min 8 characters, at least 1 uppercase letter and 1 number"
              leftIcon={<Lock className="w-4 h-4" />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <Button type="submit" className="w-full mt-3" isLoading={isLoading} icon={<ArrowRight className="w-4 h-4" />}>
              Create Organization & Workspace
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
