import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../store/useAuth';
import { useNotifications } from '../store/useNotifications';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Calendar, CreditCard, Clock, CheckCircle2, XCircle, Ban, MessageSquare, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BookingDashboard() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    async function loadDashboardData() {
      if (!profile) return;
      setLoading(true);
      try {
        // Fetch properties (for lookup / landlord owner checks)
        const { data: props } = await supabase.from('properties').select('*');
        setProperties(props || []);

        // Fetch bookings
        let data = [];
        if (profile.role === 'TENANT') {
          const { data: tenantBookings } = await supabase
            .from('bookings')
            .select('*')
            .eq('tenant_id', profile.id)
            .order('created_at', { ascending: false });
          data = tenantBookings || [];
        } else if (profile.role === 'LANDLORD') {
          // Find all properties owned by this landlord
          const ownedPropIds = (props || [])
            .filter(p => p.landlord_id === profile.id)
            .map(p => p.id);

          if (ownedPropIds.length > 0) {
            // Fetch bookings for these properties
            const { data: landlordBookings } = await supabase
              .from('bookings')
              .select('*')
              .order('created_at', { ascending: false });
            
            // Filter client-side in case ORM query limits. Basic simulation logic:
            data = (landlordBookings || []).filter(b => ownedPropIds.includes(b.property_id));
          }
        }
        setBookings(data);
      } catch (err) {
        console.error('Error loading dashboard data:', err.message);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    }
    loadDashboardData();
  }, [profile]);

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Update state locally
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );

      // Client-side availability update & notification fallback
      const booking = bookings.find(b => b.id === bookingId);
      if (booking) {
        const prop = properties.find(p => p.id === booking.property_id);
        if (prop) {
          const isNowAvailable = newStatus === 'CANCELLED' || newStatus === 'COMPLETED' || newStatus === 'EXPIRED';
          const updatedAvailability = { ...prop.availability, is_available: isNowAvailable };

          try {
            await supabase
              .from('properties')
              .update({ availability: updatedAvailability })
              .eq('id', prop.id);
          } catch (e) {
            console.warn('Could not update property availability status (this is normal if RLS prevents tenant updates; trigger will handle):', e.message);
          }

          if (isNowAvailable) {
            // Trigger availability notifications to all wishlisters in the local browser session
            useNotifications.getState().triggerAvailabilityNotification(prop.id, prop.title);
          }
        }
      }
    } catch (err) {
      alert('Failed to update booking: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">Confirmed</span>;
      case 'PENDING_PAYMENT':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">Pending Payment</span>;
      case 'ACTIVE':
        return <span className="bg-brand-surface text-brand-dark border border-brand-green/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">Active Lease</span>;
      case 'COMPLETED':
        return <span className="bg-brand-secondary/10 text-brand-secondary border border-brand-border text-xs px-2.5 py-0.5 rounded-full font-semibold">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">Cancelled</span>;
      default:
        return <span className="bg-brand-border text-brand-secondary text-xs px-2.5 py-0.5 rounded-full font-semibold">{status}</span>;
    }
  };

  const downloadInvoice = (booking) => {
    // Simulated CSV/PDF generation
    const csvContent = `data:text/csv;charset=utf-8,Invoice ID,Booking ID,Amount,Fee,Status,Dates\nINV-${booking.id.substr(0,8)},${booking.id},${booking.total_amount},${booking.platform_fee},${booking.status},${booking.start_date} to ${booking.end_date}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoice_${booking.id.substr(0, 8)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 bg-brand-bg font-sans">
        <SkeletonLoader type="kpi" count={4} />
        <SkeletonLoader type="table-row" count={5} />
      </div>
    );
  }

  // Filter bookings list
  const filteredBookings = filterStatus === 'ALL'
    ? bookings
    : bookings.filter(b => b.status === filterStatus);

  // Landlord financials summary
  const totalEarnings = bookings
    .filter(b => b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (Number(b.total_amount) - Number(b.platform_fee)), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-brand-bg text-brand-text font-sans space-y-8">
      {/* Dashboard Summary widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-section border border-brand-border rounded-xl p-5 space-y-1.5 shadow">
          <span className="text-brand-secondary text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">{bookings.length}</span>
            <Calendar className="text-brand-green" size={24} />
          </div>
        </div>

        <div className="bg-brand-section border border-brand-border rounded-xl p-5 space-y-1.5 shadow">
          <span className="text-brand-secondary text-xs font-semibold uppercase tracking-wider">
            {profile.role === 'LANDLORD' ? 'Net Revenue' : 'Total Spent'}
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-brand-green">
              ₹{(profile.role === 'LANDLORD' ? totalEarnings : bookings.reduce((sum, b) => sum + Number(b.total_amount), 0)).toLocaleString()}
            </span>
            <CreditCard className="text-brand-green" size={24} />
          </div>
        </div>

        <div className="bg-brand-section border border-brand-border rounded-xl p-5 space-y-1.5 shadow">
          <span className="text-brand-secondary text-xs font-semibold uppercase tracking-wider">Pending Leases</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">
              {bookings.filter(b => b.status === 'PENDING_PAYMENT').length}
            </span>
            <Clock className="text-brand-green" size={24} />
          </div>
        </div>

        <div className="bg-brand-section border border-brand-border rounded-xl p-5 space-y-1.5 shadow">
          <span className="text-brand-secondary text-xs font-semibold uppercase tracking-wider">Role Profile</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold text-brand-green uppercase tracking-wide">{profile.role}</span>
            <CheckCircle2 className="text-brand-green" size={24} />
          </div>
        </div>
      </div>

      {/* Main Reservation panel */}
      <div className="bg-brand-section border border-brand-border rounded-xl shadow-xl overflow-hidden">
        
        {/* Header and status filters */}
        <div className="p-5 border-b border-brand-border/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold">Reservations & Leases</h2>
          
          {/* Status buttons */}
          <div className="flex flex-wrap gap-1 bg-brand-bg p-1 rounded-lg border border-brand-border">
            {['ALL', 'CONFIRMED', 'PENDING_PAYMENT', 'ACTIVE', 'CANCELLED'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${filterStatus === status ? 'bg-brand-green text-brand-dark' : 'text-brand-secondary hover:text-brand-text'}`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table Body */}
        {filteredBookings.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <XCircle className="text-brand-secondary/60 mx-auto" size={48} />
            <h3 className="text-lg font-semibold text-brand-text">No bookings found</h3>
            <p className="text-brand-secondary text-sm max-w-md mx-auto">
              There are no reservation records under the selected category. Explore the listings to submit new booking orders.
            </p>
            {profile.role === 'TENANT' && (
              <Link to="/" className="inline-block bg-brand-green text-brand-dark hover:bg-brand-green-deep font-semibold py-2 px-6 rounded-lg">
                Find Properties
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-brand-bg/40 text-brand-secondary text-xs uppercase tracking-wider border-b border-brand-border/60">
                  <th className="p-4">Property</th>
                  <th className="p-4">Lease Dates</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredBookings.map(booking => {
                  const prop = properties.find(p => p.id === booking.property_id);
                  return (
                    <tr key={booking.id} className="hover:bg-brand-bg/20 transition-colors">
                      <td className="p-4 font-semibold text-brand-text">
                        <Link to={`/properties/${booking.property_id}`} className="hover:text-brand-green transition-colors">
                          {prop ? prop.title : 'Loading Property...'}
                        </Link>
                        <span className="block text-xs font-normal text-brand-secondary mt-0.5">ID: {booking.id.substr(0, 8)}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs">{booking.start_date}</span>
                        <span className="text-brand-secondary text-xs mx-1.5">to</span>
                        <span className="font-mono text-xs">{booking.end_date}</span>
                      </td>
                      <td className="p-4 text-brand-green font-semibold">
                        ₹{Number(booking.total_amount).toLocaleString()}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="p-4 text-right flex items-center justify-end gap-2.5">
                        
                        {/* Pending Stripe Payment Action */}
                        {booking.status === 'PENDING_PAYMENT' && profile.role === 'TENANT' && (
                          <Link
                            to={`/booking-checkout/${booking.id}`}
                            className="bg-brand-green text-brand-dark hover:bg-brand-green-deep text-xs font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            Pay Now
                          </Link>
                        )}

                        {/* Landlord Accept/Decline actions */}
                        {booking.status === 'PENDING_PAYMENT' && profile.role === 'LANDLORD' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                              className="bg-brand-green text-brand-dark hover:bg-brand-green-deep text-xs font-semibold py-1.5 px-2.5 rounded-lg"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                              className="bg-brand-error text-white hover:bg-red-600 text-xs font-semibold py-1.5 px-2.5 rounded-lg"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* Cancel actions */}
                        {booking.status === 'CONFIRMED' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                            className="text-brand-error hover:underline text-xs font-semibold flex items-center gap-1"
                          >
                            <Ban size={13} /> Cancel
                          </button>
                        )}

                        {/* Invoice download */}
                        {(booking.status === 'CONFIRMED' || booking.status === 'ACTIVE' || booking.status === 'COMPLETED') && (
                          <button
                            onClick={() => downloadInvoice(booking)}
                            className="text-brand-secondary hover:text-brand-green p-1 transition-colors"
                            title="Download CSV Invoice"
                          >
                            <Download size={15} />
                          </button>
                        )}

                        <Link
                          to={`/chat?propId=${booking.property_id}&landlordId=${prop?.landlord_id}`}
                          className="text-brand-secondary hover:text-brand-green p-1 transition-colors"
                          title="Chat with owner"
                        >
                          <MessageSquare size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
