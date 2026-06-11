import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../store/useAuth';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { ArrowLeft, ArrowRight, Save, Trash, Plus, MapPin, Upload, CircleAlert } from 'lucide-react';

const AMENITIES_LIST = ['WiFi', 'AC', 'Parking', 'Pool', 'Gym', 'Pet-friendly', 'Elevator', 'Washing Machine'];

export default function ListingWizard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [autoSavedMsg, setAutoSavedMsg] = useState('');

  // Wizard Data State
  const [formData, setFormData] = useState({
    title: '',
    type: 'APARTMENT',
    description: '',
    area_sqft: '',
    bedrooms: '1',
    bathrooms: '1',
    amenities: [],
    image_urls: [],
    latitude: 12.9716,
    longitude: 77.5946,
    monthly_rent: '',
    security_deposit: '',
  });

  // Redirect if not landlord
  useEffect(() => {
    if (profile && profile.role !== 'LANDLORD') {
      navigate('/');
    }
  }, [profile, navigate]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('rentease_property_draft');
    if (draft) {
      setFormData(JSON.parse(draft));
    }
  }, []);

  // Autosave every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem('rentease_property_draft', JSON.stringify(formData));
      setAutoSavedMsg('Draft auto-saved at ' + new Date().toLocaleTimeString());
      setTimeout(() => setAutoSavedMsg(''), 3000);
    }, 60000);

    return () => clearInterval(interval);
  }, [formData]);

  const saveManualDraft = () => {
    localStorage.setItem('rentease_property_draft', JSON.stringify(formData));
    setAutoSavedMsg('Draft saved successfully!');
    setTimeout(() => setAutoSavedMsg(''), 3000);
  };

  const clearDraft = () => {
    localStorage.removeItem('rentease_property_draft');
    setFormData({
      title: '',
      type: 'APARTMENT',
      description: '',
      area_sqft: '',
      bedrooms: '1',
      bathrooms: '1',
      amenities: [],
      image_urls: [],
      latitude: 12.9716,
      longitude: 77.5946,
      monthly_rent: '',
      security_deposit: '',
    });
    setStep(1);
  };

  const handleInputChange = (field, val) => {
    setFormData({ ...formData, [field]: val });
  };

  const handleAmenitiesToggle = (amenity) => {
    const am = formData.amenities.includes(amenity)
      ? formData.amenities.filter(a => a !== amenity)
      : [...formData.amenities, amenity];
    setFormData({ ...formData, amenities: am });
  };

  const handleImageUpload = async (e) => {
    // Simulated upload to S3 / Supabase Storage returning random unsplash urls
    const urls = [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
    ];
    
    // Choose one at random
    const uploadedUrl = urls[Math.floor(Math.random() * urls.length)];
    
    setFormData(prev => ({
      ...prev,
      image_urls: [...prev.image_urls, uploadedUrl]
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, idx) => idx !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        landlord_id: profile.id,
        area_sqft: parseInt(formData.area_sqft),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        monthly_rent: parseFloat(formData.monthly_rent),
        security_deposit: parseFloat(formData.security_deposit),
        status: 'PUBLISHED'
      };

      const { error } = await supabase.from('properties').insert(payload);
      if (error) throw error;

      // Clear draft
      localStorage.removeItem('rentease_property_draft');
      navigate('/bookings'); // Redirect to bookings / properties panel
    } catch (err) {
      alert(err.message || 'Failed to publish listing');
    } finally {
      setSaving(false);
    }
  };

  // Step names
  const steps = ['Basic Info', 'Media Uploads', 'Location details', 'Pricing'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-brand-bg text-brand-text font-sans space-y-6">
      
      {/* Step Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-brand-secondary">
          <span className="uppercase font-semibold tracking-wider">Step {step} of 4: {steps[step - 1]}</span>
          {autoSavedMsg && <span className="text-brand-green font-medium transition-all">{autoSavedMsg}</span>}
        </div>
        <div className="w-full h-1.5 bg-brand-section rounded-full overflow-hidden border border-brand-border">
          <div
            className="h-full bg-brand-green transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-brand-section border border-brand-border rounded-xl p-5 sm:p-7 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Property Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gorgeous Luxury Beachfront Apartment"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Property Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="STUDIO">Studio</option>
                    <option value="VILLA">Villa</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Area (sqft)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1200"
                    value={formData.area_sqft}
                    onChange={(e) => handleInputChange('area_sqft', e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Bedrooms</label>
                  <select
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} Bed</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Bathrooms</label>
                  <select
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border text-brand-text rounded-lg p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num} Bath</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your property details, nearby transport, specifications, and house rules..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-2">Amenities Available</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AMENITIES_LIST.map(amenity => {
                    const active = formData.amenities.includes(amenity);
                    return (
                      <button
                        type="button"
                        key={amenity}
                        onClick={() => handleAmenitiesToggle(amenity)}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all duration-200 ${active ? 'bg-brand-green/20 text-brand-green border-brand-green' : 'bg-brand-bg text-brand-secondary border-brand-border hover:border-brand-green/35'}`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Media uploads */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-brand-border hover:border-brand-green/60 rounded-xl p-8 text-center bg-brand-bg/40 cursor-pointer transition-all">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="image-upload" className="cursor-pointer space-y-3 block">
                  <Upload size={36} className="text-brand-green mx-auto" />
                  <div className="text-sm font-semibold text-brand-text">Drag & drop images, or click to upload</div>
                  <div className="text-xs text-brand-secondary">Max 20 images. Accepted: JPG, PNG, WEBP. Max 5MB each.</div>
                </label>
              </div>

              {formData.image_urls.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider">Uploaded previews ({formData.image_urls.length} of 20)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.image_urls.map((url, idx) => (
                      <div key={idx} className="relative aspect-[16/10] bg-brand-bg rounded-lg overflow-hidden group border border-brand-border">
                        <img src={url} alt="property" className="w-full h-full object-cover" />
                        
                        {/* Thumbnail indicator */}
                        {idx === 0 && (
                          <div className="absolute top-2 left-2 bg-brand-green text-brand-dark px-1.5 py-0.5 text-[9px] font-bold rounded">
                            Thumbnail
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-2 right-2 bg-brand-error hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Location Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-brand-bg/40 border border-brand-border rounded-xl p-4 flex gap-3 items-start">
                <MapPin size={22} className="text-brand-green flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Geotagging & Maps</h4>
                  <p className="text-brand-secondary text-xs leading-normal">
                    Enter the coordinates or location details. In development mode, pins will register to these details instantly.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Property Location Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100 Pike St, Seattle, WA 98101"
                  defaultValue="Seattle, WA"
                  className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              {/* Map Click Selector Container */}
              <div className="space-y-2">
                <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider">Click map to adjust pin position</label>
                <div className="h-60 w-full rounded-xl overflow-hidden relative border border-brand-border">
                  <InteractiveMap
                    onMapClick={(latlng) => {
                      handleInputChange('latitude', parseFloat(latlng.lat.toFixed(6)));
                      handleInputChange('longitude', parseFloat(latlng.lng.toFixed(6)));
                    }}
                    selectedLatLng={{ lat: formData.latitude, lng: formData.longitude }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Pricing & Availability */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Monthly Rent (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 18000"
                    value={formData.monthly_rent}
                    onChange={(e) => handleInputChange('monthly_rent', e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div>
                  <label className="block text-brand-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">Security Deposit (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 50000"
                    value={formData.security_deposit}
                    onChange={(e) => handleInputChange('security_deposit', e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-lg text-brand-text p-2.5 text-sm focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-4 space-y-1.5">
                <div className="flex gap-2 items-center text-xs font-semibold text-brand-green uppercase tracking-wider">
                  <CircleAlert size={14} /> Note on publishing
                </div>
                <p className="text-brand-secondary text-xs leading-normal">
                  Completing this wizard publishes the property instantly onto the discoveries dashboard. You can draft/save it by using the local draft buttons at any time.
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center border-t border-brand-border/60 pt-4 mt-6">
            <button
              type="button"
              onClick={clearDraft}
              className="text-brand-error hover:underline text-xs font-semibold"
            >
              Discard Draft
            </button>

            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev - 1)}
                  className="bg-brand-bg text-brand-text border border-brand-border hover:border-brand-green/60 py-2 px-4 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              )}
              
              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev + 1)}
                  className="bg-brand-green hover:bg-brand-green-deep text-brand-dark py-2 px-5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  Next <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-green hover:bg-brand-green-deep text-brand-dark disabled:bg-brand-border disabled:text-brand-secondary py-2 px-5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  {saving ? 'Publishing...' : 'Publish Listing'}
                </button>
              )}
              
              <button
                type="button"
                onClick={saveManualDraft}
                className="bg-brand-bg border border-brand-border text-brand-secondary hover:text-brand-text py-2 px-3 rounded-lg text-xs font-semibold transition-colors"
                title="Save Draft to LocalStorage"
              >
                <Save size={14} />
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
