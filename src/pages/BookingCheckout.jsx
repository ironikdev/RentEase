import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ShieldCheck, ArrowLeft, Loader2, Lock, HelpCircle } from 'lucide-react';

export default function BookingCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Payment states
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Stripe Checkout Form State
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    async function loadCheckoutDetails() {
      try {
        const { data: b, error: bErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', id)
          .single();

        if (bErr) throw bErr;
        setBooking(b);

        const { data: p, error: pErr } = await supabase
          .from('properties')
          .select('*')
          .eq('id', b.property_id)
          .single();

        if (pErr) throw pErr;
        setProperty(p);

        // Fetch user profile email if available
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmail(user.email);
          setCardName(user.user_metadata?.full_name || '');
        }
      } catch (err) {
        console.error('Error fetching checkout data:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCheckoutDetails();
  }, [id]);

  // Quick autofill for standard Stripe test credentials
  const autofillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/29');
    setCardCvc('123');
    setPaymentError('');
  };

  // Card formatting handlers
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = [];
    for (let i = 0; i < val.length; i += 4) {
      formatted.push(val.slice(i, i + 4));
    }
    setCardNumber(formatted.join(' ').slice(0, 19));
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 2) {
      val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
    }
    setCardExpiry(val.slice(0, 5));
  };

  const handleCvcChange = (e) => {
    setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentError('');

    if (!email) {
      setPaymentError('Email address is required.');
      return;
    }
    
    const rawCard = cardNumber.replace(/\D/g, '');
    if (rawCard.length < 15) {
      setPaymentError('Please enter a valid card number.');
      return;
    }

    if (!cardExpiry || cardExpiry.length < 5) {
      setPaymentError('Please enter a valid expiration date (MM/YY).');
      return;
    }

    if (cardCvc.length < 3) {
      setPaymentError('Please enter a valid CVC.');
      return;
    }

    setProcessing(true);

    try {
      // Transition booking status to CONFIRMED in database
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'CONFIRMED',
          payment_intent_id: 'pi_stripe_' + Math.random().toString(36).substr(2, 9)
        })
        .eq('id', id);

      if (error) throw error;
      
      // Simulate Stripe payment success redirection delay
      setTimeout(() => {
        setProcessing(false);
        navigate('/bookings');
      }, 2000);
    } catch (err) {
      setPaymentError(err.message || 'Payment failed.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!booking || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <AlertTriangle className="text-red-500 mx-auto" size={48} />
          <h2 className="text-xl font-bold text-slate-800">Transaction Failed</h2>
          <p className="text-slate-500 text-sm">We could not retrieve the booking context.</p>
          <button onClick={() => navigate('/bookings')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold text-xs uppercase transition-colors">
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col md:grid md:grid-cols-2">
      
      {/* LEFT COLUMN: Checkout Info / Pricing Summary */}
      <div className="bg-slate-50 border-r border-slate-200 p-8 md:p-16 flex flex-col justify-between">
        <div className="space-y-8">
          
          {/* Brand header */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/bookings')} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-200/50 transition-colors">
              <ArrowLeft size={16} />
            </button>
            <span className="font-bold text-sm text-slate-600 tracking-wide">RentEase Escrow Checkout</span>
          </div>

          {/* Pricing display */}
          <div className="space-y-1">
            <span className="text-sm text-slate-500 font-medium">Pay RentEase</span>
            <div className="text-4xl font-extrabold tracking-tight text-slate-900">
              ₹{Number(booking.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Booking Summary */}
          <div className="space-y-6 pt-4">
            <div className="flex gap-4">
              <img
                src={property.image_urls?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150'}
                alt={property.title}
                className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=150';
                }}
              />
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-slate-900">{property.title}</h4>
                <p className="text-xs text-slate-500 font-medium">{property.type} • {property.bedrooms} Bed • {property.bathrooms} Bath</p>
                <p className="text-xs text-slate-500 font-mono font-medium">{booking.start_date} to {booking.end_date}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Lease Amount</span>
                <span>₹{(Number(booking.total_amount) - Number(booking.platform_fee)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Escrow Fee (3%)</span>
                <span>₹{Number(booking.platform_fee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm font-bold text-slate-900">
                <span>Total Amount Due</span>
                <span>₹{Number(booking.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

        </div>

        <div className="text-[11px] text-slate-400 mt-8 leading-normal flex items-center gap-1">
          <Lock size={12} className="text-slate-400" />
          <span>Powered by Stripe. PCI-DSS compliant secure socket layer.</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Payment Form */}
      <div className="p-8 md:p-16 flex flex-col justify-center max-w-lg mx-auto w-full">
        <div className="space-y-6">
          
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Pay with card</h2>
            
            {/* Autofill Helper */}
            <button
              type="button"
              onClick={autofillTestCard}
              className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 hover:underline bg-indigo-50 hover:bg-indigo-100/70 px-2.5 py-1 rounded transition-colors"
            >
              <HelpCircle size={13} /> Autofill Test Card
            </button>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-5">
            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Email address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg text-slate-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Card Information */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Card information</label>
              <div className="border border-slate-300 rounded-lg overflow-hidden divide-y divide-slate-300">
                <input
                  type="text"
                  required
                  placeholder="1234 5678 1234 5678"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  className="w-full text-slate-900 p-2.5 text-sm focus:outline-none placeholder-slate-400 font-mono"
                />
                <div className="grid grid-cols-2 divide-x divide-slate-300">
                  <input
                    type="text"
                    required
                    placeholder="MM / YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    className="w-full text-slate-900 p-2.5 text-sm focus:outline-none placeholder-slate-400 font-mono"
                  />
                  <input
                    type="password"
                    required
                    placeholder="CVC"
                    value={cardCvc}
                    onChange={handleCvcChange}
                    className="w-full text-slate-900 p-2.5 text-sm focus:outline-none placeholder-slate-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Cardholder Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Name on card</label>
              <input
                type="text"
                required
                placeholder="Sarah Jenkins"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg text-slate-900 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600">Country or region</label>
              <select className="w-full border border-slate-300 rounded-lg text-slate-900 p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="SG">Singapore</option>
              </select>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg font-medium">
                {paymentError}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-[#635BFF] hover:bg-[#534BEB] disabled:bg-[#8680FF] text-white font-semibold text-sm py-3 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Pay ₹{Number(booking.total_amount).toLocaleString('en-IN')}</span>
              )}
            </button>
          </form>

        </div>
      </div>

      {/* Stripe Secure Modal Redirect simulation overlay */}
      {processing && (
        <div className="fixed inset-0 z-[1020] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
            <div className="relative w-14 h-14 mx-auto">
              <Loader2 className="animate-spin text-[#635BFF] w-full h-full" size={56} />
              <ShieldCheck className="text-emerald-500 absolute inset-0 m-auto" size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-lg">Authorizing Card Payment</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Communicating securely with your issuing bank via Stripe 3D-Secure protocols. Please do not close this window.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
