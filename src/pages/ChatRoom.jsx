import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isMockMode, triggerMockRealtimeMessage } from '../supabaseClient';
import { useAuth } from '../store/useAuth';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { Send, Image, CheckCheck, MapPin, Loader2, ArrowLeft, Bot } from 'lucide-react';

export default function ChatRoom() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const propId = searchParams.get('propId');
  const landlordId = searchParams.get('landlordId');

  const [messages, setMessages] = useState([]);
  const [property, setProperty] = useState(null);
  const [recipient, setRecipient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [landlordOnline, setLandlordOnline] = useState(true);

  const messagesEndRef = useRef(null);

  // Load chat profile and message logs
  useEffect(() => {
    if (!profile) {
      navigate('/login');
      return;
    }
    if (!propId || !landlordId) {
      setLoading(false);
      return;
    }

    async function loadChatDetails() {
      setLoading(true);
      try {
        // Fetch property details
        const { data: prop } = await supabase
          .from('properties')
          .select('*')
          .eq('id', propId)
          .single();
        setProperty(prop);

        // Fetch recipient profile (if user is landlord, recipient is tenant; else recipient is landlord)
        const recipientUserId = profile.id === landlordId ? 'mock-tenant-id' : landlordId; // fallback for mock
        const { data: rec } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', recipientUserId)
          .single();
        setRecipient(rec);

        // Fetch historical messages
        const { data: logs } = await supabase
          .from('messages')
          .select('*')
          .eq('property_id', propId)
          .order('created_at', { ascending: true });
        
        // Filter messages belonging to this thread
        const threadMessages = (logs || []).filter(msg => 
          (msg.sender_id === profile.id && msg.receiver_id === recipientUserId) ||
          (msg.sender_id === recipientUserId && msg.receiver_id === profile.id)
        );
        setMessages(threadMessages);
      } catch (err) {
        console.error('Error fetching chat details:', err.message);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    }
    loadChatDetails();
  }, [profile, propId, landlordId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!propId || !profile) return;

    const channel = supabase
      .channel(`chat-room-${propId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          // Verify message belongs to this thread
          if (
            newMsg.property_id === propId &&
            (newMsg.sender_id === profile.id || newMsg.receiver_id === profile.id)
          ) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [propId, profile]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !profile || !recipient) return;

    const text = inputText;
    setInputText('');

    const payload = {
      property_id: propId,
      sender_id: profile.id,
      receiver_id: recipient.id,
      message_text: text,
      is_read: false
    };

    try {
      const { data, error } = await supabase.from('messages').insert(payload);
      if (error) throw error;

      // Handle Auto-reply (either standard mock reply or offline landlord AI reply)
      const isSarahJenkins = recipient.id === 'd319e90d-141e-42d0-846e-bf5fcbea68e5' || recipient.id === 'mock-landlord-id';
      if (isMockMode || !landlordOnline || isSarahJenkins) {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          
          const replyText = landlordOnline ? getMockReply(text) : getLandlordAIResponse(text);
          const replyPayload = {
            id: 'msg-' + Math.random().toString(36).substr(2, 9),
            property_id: propId,
            sender_id: recipient.id,
            receiver_id: profile.id,
            message_text: replyText,
            is_read: false,
            created_at: new Date().toISOString()
          };

          if (isMockMode) {
            // Update messages in localStorage
            const msgs = JSON.parse(localStorage.getItem('rentease_messages') || '[]');
            msgs.push(replyPayload);
            localStorage.setItem('rentease_messages', JSON.stringify(msgs));

            // Trigger realtime event
            triggerMockRealtimeMessage(replyPayload);
          } else {
            // In live DB mode, append it locally for simulation since RLS blocks inserting as landlord
            setMessages(prev => {
              if (prev.some(m => m.id === replyPayload.id)) return prev;
              return [...prev, replyPayload];
            });
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to send message:', err.message);
    }
  };

  const getMockReply = (incoming) => {
    const text = incoming.toLowerCase();
    if (text.includes('view') || text.includes('visit') || text.includes('saturday') || text.includes('sunday')) {
      return "Viewing options are open! Saturday at 11:00 AM or Sunday at 2:00 PM works best. Let me know what fits your schedule!";
    }
    if (text.includes('price') || text.includes('deposit') || text.includes('cost')) {
      return "The rent is set as shown in the listing. The security deposit is fully refundable via platform escrow. Would you like me to hold the date ranges?";
    }
    return "Thank you for reaching out! Let me check this for you and get back to you shortly.";
  };

  const getLandlordAIResponse = (text) => {
    const query = text.toLowerCase();
    const pTitle = property?.title || 'this property';
    const pType = property?.type || 'space';
    const pRent = property?.monthly_rent ? `₹${Number(property.monthly_rent).toLocaleString('en-IN')}` : 'the listed price';
    const pDeposit = property?.security_deposit ? `₹${Number(property.security_deposit).toLocaleString('en-IN')}` : 'the listed amount';
    const pArea = property?.area_sqft ? `${property.area_sqft} sqft` : '';
    const pBeds = property?.bedrooms ? `${property.bedrooms} bedrooms` : '';
    const pBaths = property?.bathrooms ? `${property.bathrooms} bathrooms` : '';
    const pAmenities = property?.amenities?.join(', ') || 'standard utilities';
    
    if (query.includes('rent') || query.includes('cost') || query.includes('price') || query.includes('monthly')) {
      return `Hello! The monthly rent for ${pTitle} is ${pRent}. This is paid securely via RentEase escrow.`;
    }
    if (query.includes('deposit') || query.includes('security')) {
      return `The security deposit for ${pTitle} is ${pDeposit}. RentEase holds this deposit in escrow, and it is fully refundable after your lease ends.`;
    }
    if (query.includes('amenit') || query.includes('wifi') || query.includes('ac') || query.includes('gym') || query.includes('pool') || query.includes('parking')) {
      return `Yes, the ${pType} includes the following amenities: ${pAmenities}. Let me know if you have questions about any specific feature!`;
    }
    if (query.includes('size') || query.includes('area') || query.includes('sqft') || query.includes('big') || query.includes('bed') || query.includes('bath')) {
      return `The property offers a total area of ${pArea} with ${pBeds} and ${pBaths}. It is designed with a modern layout to maximize comfort.`;
    }
    if (query.includes('pet') || query.includes('dog') || query.includes('cat')) {
      const allowsPets = property?.amenities?.some(a => a.toLowerCase().includes('pet'));
      return allowsPets 
        ? `Yes, ${pTitle} is pet-friendly! Your pets are welcome here.`
        : `Currently, pets are not allowed in this ${pType} due to building regulations.`;
    }
    if (query.includes('view') || query.includes('visit') || query.includes('schedule') || query.includes('meet') || query.includes('saturday') || query.includes('sunday')) {
      return `I am currently offline, but you can request a viewing! Typically, viewings can be scheduled for Saturdays between 10 AM and 1 PM. Let me know what date works and I will confirm as soon as I am online!`;
    }
    
    return `Hello! I am offline right now, but as the AI Assistant for ${pTitle}, I can tell you that it is a ${pBeds || 'beautiful'} ${pType} renting for ${pRent}/month. What details can I help you check?`;
  };

  const handleImageSend = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile || !recipient) return;

    setSendingImage(true);
    try {
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(`chat-${Date.now()}-${file.name}`, file);

      if (error) throw error;

      // Create message with image URL
      const imgMsgPayload = {
        property_id: propId,
        sender_id: profile.id,
        receiver_id: recipient.id,
        message_text: 'Sent an image attachment',
        image_url: data.publicUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
        is_read: false
      };

      const { error: msgError } = await supabase.from('messages').insert(imgMsgPayload);
      if (msgError) throw msgError;

      if (isMockMode) {
        const mockImgMsg = {
          id: 'msg-' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          ...imgMsgPayload
        };
        triggerMockRealtimeMessage(mockImgMsg);
      }
    } catch (err) {
      console.error('Failed to upload/send image:', err.message);
    } finally {
      setSendingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-brand-bg font-sans">
        <SkeletonLoader type="chat" count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-64px)] flex flex-col font-sans text-brand-text">
      
      {/* Thread Header */}
      <div className="bg-brand-section border border-brand-border rounded-t-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-brand-secondary hover:text-brand-green">
            <ArrowLeft size={20} />
          </button>
          
          <img
            src={recipient?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={recipient?.full_name}
            className="w-10 h-10 rounded-full object-cover border border-brand-border"
          />

          <div>
            <h3 className="font-bold text-sm">{recipient?.full_name || 'Sarah Jenkins'}</h3>
            <button
              type="button"
              onClick={() => setLandlordOnline(!landlordOnline)}
              className={`flex items-center gap-1.5 text-[10px] px-2 py-0.5 mt-0.5 rounded-full font-bold transition-all ${landlordOnline ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20'}`}
              title="Click to toggle landlord online/offline status for demo"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${landlordOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{landlordOnline ? 'Online' : 'Offline'}</span>
            </button>
          </div>
        </div>

        {property && (
          <div className="hidden sm:flex items-center gap-2 text-xs bg-brand-bg/60 border border-brand-border rounded-lg p-2 max-w-xs">
            <MapPin size={12} className="text-brand-green" />
            <span className="truncate font-semibold">{property.title}</span>
          </div>
        )}
      </div>

      {/* Offline AI Alert Banner */}
      {!landlordOnline && (
        <div className="bg-brand-bg/95 border-x border-b border-brand-border px-4 py-2.5 text-center text-[10px] sm:text-xs text-brand-green font-semibold flex items-center justify-center gap-2 bg-emerald-950/10">
          <Bot size={14} className="animate-bounce text-brand-green" />
          <span>Sarah is offline. RentEase AI Assistant is active to answer questions about this listing.</span>
        </div>
      )}

      {/* Messages Logs Area */}
      <div className="flex-1 bg-brand-section/30 border-x border-brand-border p-4 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <MessageSquareIcon className="text-brand-secondary/40" size={36} />
            <h4 className="font-bold text-sm">Start the Conversation</h4>
            <p className="text-brand-secondary text-xs max-w-xs leading-normal">
              Ask questions about lease terms, amenities, security deposit arrangements, or schedule viewings.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === profile.id;
            return (
              <div key={msg.id} className={`flex items-start gap-2.5 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                {/* Bubble */}
                <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs sm:text-sm shadow-md leading-relaxed whitespace-pre-line ${isMe ? 'bg-brand-green text-brand-dark rounded-tr-none' : 'bg-brand-section text-brand-text border border-brand-border rounded-tl-none'}`}>
                    {msg.image_url ? (
                      <div className="space-y-2">
                        <img src={msg.image_url} alt="attachment" className="rounded-lg max-w-xs w-full object-cover aspect-[4/3]" />
                        <div className="text-[10px] text-brand-dark/85 font-medium">{msg.message_text}</div>
                      </div>
                    ) : (
                      msg.message_text
                    )}
                  </div>
                  
                  {/* Delivery metadata */}
                  <div className="flex items-center gap-1.5 text-[9px] text-brand-secondary px-1">
                    <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isMe && <CheckCheck size={11} className="text-brand-green-deep" />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Real-time typing feedback */}
        {typing && (
          <div className="flex items-center gap-2 mr-auto text-brand-secondary text-xs bg-brand-section/50 px-3 py-2 rounded-xl border border-brand-border/40">
            <Loader2 className="animate-spin text-brand-green" size={12} />
            <span>Sarah is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <div className="bg-brand-section border border-brand-border rounded-b-xl p-3 flex items-center gap-2">
        {/* Image upload trigger */}
        <input
          type="file"
          id="chat-img-input"
          accept="image/*"
          className="hidden"
          onChange={handleImageSend}
          disabled={sendingImage}
        />
        <label
          htmlFor="chat-img-input"
          className="p-2.5 bg-brand-bg hover:bg-brand-border border border-brand-border rounded-lg text-brand-secondary hover:text-brand-green cursor-pointer transition-colors"
        >
          {sendingImage ? <Loader2 className="animate-spin text-brand-green" size={16} /> : <Image size={16} />}
        </label>

        <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder="Type your message here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-brand-bg border border-brand-border rounded-lg text-brand-text px-4 py-2.5 text-xs sm:text-sm placeholder-brand-secondary/60 focus:outline-none focus:border-brand-green"
          />
          <button
            type="submit"
            className="p-2.5 bg-brand-green hover:bg-brand-green-deep text-brand-dark rounded-lg flex items-center justify-center transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

// Simple placeholder icon
function MessageSquareIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
