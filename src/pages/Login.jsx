import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { Lock, Mail, AlertTriangle, Loader2, Home } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setFormError('');
    
    const res = await signIn(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setFormError(res.error || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-brand-bg font-sans text-brand-text w-full overflow-hidden text-left">
      
      {/* LEFT COLUMN: Auth form and text content */}
      <div className="flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-12 space-y-8 w-full">
        
        {/* Brand Slogan Section */}
        <div className="w-full max-w-md space-y-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-brand-green hover:text-brand-green-deep transition-all duration-300 w-fit">
            <div className="bg-brand-green/10 border border-brand-green/30 p-1.5 rounded-lg">
              <Home className="w-5 h-5 text-brand-green" />
            </div>
            <span className="font-bold text-lg tracking-wider text-brand-text">
              Rent<span className="text-brand-green">Ease</span>
            </span>
          </Link>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-dark leading-tight pt-2">
            Simplify Your <span className="text-brand-green">Rentals</span>
          </h2>
          <p className="text-brand-secondary text-sm leading-relaxed">
            Our most capable system helps you manage leases, properties, and payments with fewer check-ins needed.
          </p>
        </div>

        {/* Login Form Box */}
        <div className="w-full max-w-md bg-brand-section border border-brand-border rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-brand-dark">Welcome Back</h3>
            <p className="text-brand-secondary text-xs">Enter your details below to log in</p>
          </div>

          {formError && (
            <div className="bg-brand-error/10 border border-brand-error text-brand-error text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Social Logins mock */}
          <button
            type="button"
            onClick={() => alert('SSO login is disabled for demo accounts. Please use email credentials.')}
            className="w-full border border-brand-border hover:bg-brand-surface/40 text-brand-text py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {/* Google icon SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.45 1.74 14.96 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.86 3C6.27 7.55 8.91 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.48c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.69-4.92 3.69-8.54z"/>
              <path fill="#FBBC05" d="M5.36 14.5A7.12 7.12 0 0 1 5 12c0-.88.16-1.73.44-2.52L1.58 6.48A11.94 11.94 0 0 0 0 12c0 2.05.52 4 1.44 5.73l3.92-3.23z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.7-2.87c-1.03.69-2.34 1.1-4.26 1.1-3.09 0-5.73-2.51-6.64-5.46L1.5 16.08C3.39 20.35 7.35 23 12 23z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex py-1.5 items-center">
            <div className="flex-grow border-t border-brand-border/80"></div>
            <span className="flex-shrink mx-4 text-brand-secondary text-[10px] uppercase font-bold tracking-widest">or</span>
            <div className="flex-grow border-t border-brand-border/80"></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-brand-secondary text-[10px] font-bold uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@rentease.com"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-brand-secondary text-[10px] font-bold uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-green-deep text-brand-dark disabled:bg-brand-border disabled:text-brand-secondary font-bold text-xs py-3 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin text-brand-dark" size={14} /> : 'Login'}
            </button>
          </form>

          <div className="text-center text-xs text-brand-secondary pt-2">
            New to RentEase?{' '}
            <Link to="/register" className="text-brand-green hover:underline font-semibold">
              Create an Account
            </Link>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Large floating premium image card */}
      <div className="hidden lg:flex w-full h-full p-4 items-center justify-center">
        <div className="w-full h-[calc(100vh-96px)] min-h-[500px] rounded-3xl overflow-hidden relative shadow-2xl border border-brand-border">
          <img
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200"
            alt="Beautiful Modern Rental Property"
            className="w-full h-full object-cover"
          />
          {/* Subtle overlay shading */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Slogan details overlay */}
          <div className="absolute bottom-10 left-10 text-left text-white max-w-md space-y-2">
            <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 backdrop-blur-sm px-2.5 py-1 rounded uppercase tracking-wider">
              Verified Properties
            </span>
            <h3 className="text-2xl font-extrabold tracking-tight leading-tight">
              Premium Homes Across Bangalore
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Explore listings directly from owners. Zero brokerage, verified parameters, and secure digital leases.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
