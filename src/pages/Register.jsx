import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../store/useAuth';
import { User, Mail, Phone, Lock, AlertTriangle, Loader2, Home } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('TENANT');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Password strength checker (PRD Section 4.1.1)
  const calcPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const strength = calcPasswordStrength(password);

  const getStrengthLabel = (score) => {
    if (score <= 25) return { text: 'Weak (Min 8 chars)', color: 'bg-red-500' };
    if (score <= 50) return { text: 'Medium (Add upper letter)', color: 'bg-orange-500' };
    if (score <= 75) return { text: 'Strong (Add number/symbol)', color: 'bg-yellow-500' };
    return { text: 'Excellent', color: 'bg-brand-green' };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (strength < 50) {
      setFormError('Password is too weak. Please verify security requirements.');
      return;
    }

    setLoading(true);
    setFormError('');

    const res = await signUp(email, password, fullName, role, phone);
    if (res.success) {
      navigate('/');
    } else {
      setFormError(res.error || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-brand-bg font-sans text-brand-text w-full overflow-hidden text-left">
      
      {/* LEFT COLUMN: Auth form and text content */}
      <div className="flex flex-col justify-center items-center px-6 sm:px-12 lg:px-16 py-8 space-y-6 w-full">
        
        {/* Brand Slogan Section */}
        <div className="w-full max-w-md space-y-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-brand-green hover:text-brand-green-deep transition-all duration-300 w-fit">
            <div className="bg-brand-green/10 border border-brand-green/30 p-1.5 rounded-lg">
              <Home className="w-5 h-5 text-brand-green" />
            </div>
            <span className="font-bold text-lg tracking-wider text-brand-text">
              Rent<span className="text-brand-green">Ease</span>
            </span>
          </Link>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-dark leading-tight pt-1">
            Join the <span className="text-brand-green">Community</span>
          </h2>
          <p className="text-brand-secondary text-sm leading-relaxed">
            Create an account to discover verified owner property listings with zero brokerage and instant leasing.
          </p>
        </div>

        {/* Register Form Box */}
        <div className="w-full max-w-md bg-brand-section border border-brand-border rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight text-brand-dark">Create an Account</h3>
            <p className="text-brand-secondary text-xs">Fill in your details below to register</p>
          </div>

          {formError && (
            <div className="bg-brand-error/10 border border-brand-error text-brand-error text-xs p-3 rounded-lg flex items-start gap-2">
              <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            
            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="block text-brand-secondary text-[10px] font-bold uppercase tracking-wider">Join RentEase As</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRole('TENANT')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${role === 'TENANT' ? 'bg-brand-green text-brand-dark border-brand-green' : 'bg-brand-bg text-brand-secondary border-brand-border hover:border-brand-green/30'}`}
                >
                  Tenant
                </button>
                <button
                  type="button"
                  onClick={() => setRole('LANDLORD')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${role === 'LANDLORD' ? 'bg-brand-green text-brand-dark border-brand-green' : 'bg-brand-bg text-brand-secondary border-brand-border hover:border-brand-green/30'}`}
                >
                  Landlord
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-brand-secondary text-[10px] font-bold uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green"
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-brand-secondary text-[10px] font-bold uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@example.com"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-brand-secondary text-[10px] font-bold uppercase tracking-wider">Phone (Optional)</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green"
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
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
                  placeholder="Minimum 8 characters"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 pl-9 text-xs focus:outline-none focus:border-brand-green"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary" size={14} />
              </div>

              {/* Password strength meter */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[9px] text-brand-secondary">
                    <span>Strength:</span>
                    <span className="font-semibold text-brand-text">{getStrengthLabel(strength).text}</span>
                  </div>
                  <div className="w-full h-1 bg-brand-bg rounded-full overflow-hidden border border-brand-border">
                    <div
                      className={`h-full ${getStrengthLabel(strength).color} transition-all duration-300`}
                      style={{ width: `${strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-green-deep text-brand-dark disabled:bg-brand-border disabled:text-brand-secondary font-bold text-xs py-3 rounded-lg uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin text-brand-dark" size={14} /> : 'Register'}
            </button>
          </form>

          <div className="text-center text-xs text-brand-secondary pt-1">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-green hover:underline font-semibold">
              Login here
            </Link>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Large floating premium image card */}
      <div className="hidden lg:flex w-full h-full p-4 items-center justify-center">
        <div className="w-full h-[calc(100vh-96px)] min-h-[500px] rounded-3xl overflow-hidden relative shadow-2xl border border-brand-border">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
            alt="Beautiful Modern Interior Design"
            className="w-full h-full object-cover"
          />
          {/* Subtle overlay shading */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Slogan details overlay */}
          <div className="absolute bottom-10 left-10 text-left text-white max-w-md space-y-2">
            <span className="text-[10px] font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 backdrop-blur-sm px-2.5 py-1 rounded uppercase tracking-wider">
              Smart Escrow Security
            </span>
            <h3 className="text-2xl font-extrabold tracking-tight leading-tight">
              Rent Smart. Live Beautifully.
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Verify your identity, sign automated rental agreements, pay via card or net banking, and track communications all in one dashboard.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
