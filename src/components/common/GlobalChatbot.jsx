import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, ShieldCheck, Loader2 } from 'lucide-react';

const QUICK_REPLIES = [
  { text: 'What are the platform fees?', query: 'fees' },
  { text: 'How does escrow work?', query: 'escrow' },
  { text: 'What is the cancellation policy?', query: 'cancellation' },
  { text: 'How do I verify my account?', query: 'verify' }
];

export default function GlobalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Hi! I am the RentEase Platform Assistant. Ask me anything about how RentEase works, our fees, safety escrows, or cancellation policies!',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const getAIResponse = (input) => {
    const text = input.toLowerCase();
    
    if (text.includes('fee') || text.includes('charge') || text.includes('percent') || text.includes('cost')) {
      return 'RentEase charges a flat 3% platform escrow fee on all lease payments to cover security and billing costs. There are no hidden signup or listing fees!';
    }
    if (text.includes('escrow') || text.includes('deposit') || text.includes('hold') || text.includes('safety')) {
      return 'To protect both parties, RentEase secures your safety deposit in a neutral escrow account. The deposit is held safely during the lease and only released to the landlord 24 hours after tenant move-in confirmation.';
    }
    if (text.includes('cancel') || text.includes('refund') || text.includes('policy')) {
      return 'Our cancellation policy allows a 100% refund if cancelled 48+ hours before the lease start date. If cancelled within 48 hours of lease start, a 50% refund is issued.';
    }
    if (text.includes('verify') || text.includes('document') || text.includes('active') || text.includes('verification')) {
      return 'Landlords upload verification documents (government ID & property ownership proof) in their dashboard. Our admin team manually reviews and approves these documents within 24 hours to ensure platform trust.';
    }
    if (text.includes('role') || text.includes('account') || text.includes('landlord') || text.includes('tenant')) {
      return 'RentEase has two roles: Tenants (who search, book, and chat) and Landlords (who list properties, manage bookings, and receive payouts). You select your role during signup!';
    }
    if (text.includes('contact') || text.includes('support') || text.includes('help') || text.includes('email')) {
      return 'If you need help or have a dispute, you can contact our 24/7 support team directly at support@rentease.com.';
    }
    
    return 'I can answer questions about platform fees (3%), our safety escrow system, profile verification, or cancellation refunds. Feel free to click any of the quick-reply buttons below!';
  };

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    const newMsg = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const replyText = getAIResponse(textToSend);
      const botReply = {
        id: 'reply-' + Date.now(),
        sender: 'bot',
        text: replyText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
    }, 1000);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-brand-green hover:bg-brand-green-deep text-brand-dark p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 border border-brand-green/35 animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          <MessageSquare size={24} />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-brand-green"></span>
          </span>
        </button>
      )}

      {/* Expanded Support Chat Widget */}
      {isOpen && (
        <div className="w-[340px] sm:w-[360px] h-[460px] bg-brand-section border border-brand-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-brand-bg border-b border-brand-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-green/10 text-brand-green rounded-lg border border-brand-green/20">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="font-bold text-xs text-brand-text">RentEase Assistant</h4>
                <div className="flex items-center gap-1 text-[10px] text-brand-green font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  <span>Online Platform Support</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-brand-secondary hover:text-brand-text p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-brand-border">
            {messages.map(msg => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} className={`flex items-start gap-2 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                  {isBot && (
                    <div className="p-1 bg-brand-bg border border-brand-border rounded-full text-brand-green flex-shrink-0 mt-0.5">
                      <Bot size={12} />
                    </div>
                  )}
                  <div className={`p-2.5 rounded-xl text-xs leading-relaxed ${isBot ? 'bg-brand-bg/60 border border-brand-border text-brand-text rounded-tl-none' : 'bg-brand-green text-brand-dark rounded-tr-none'}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 mr-auto text-brand-secondary text-[10px] bg-brand-bg/40 px-3 py-1.5 rounded-xl border border-brand-border/40 w-fit">
                <Loader2 className="animate-spin text-brand-green" size={10} />
                <span>Assistant is typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-4 py-2 border-t border-brand-border/40 bg-brand-bg/20 space-y-1.5">
            <span className="text-[9px] text-brand-secondary uppercase font-bold tracking-wider block">Suggested Questions</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((reply, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSendMessage(reply.query)}
                  className="text-[10px] font-semibold bg-brand-bg hover:bg-brand-border border border-brand-border hover:border-brand-green/30 text-brand-secondary hover:text-brand-text px-2 py-1 rounded-full transition-all"
                >
                  {reply.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input field */}
          <form onSubmit={onSubmit} className="bg-brand-bg border-t border-brand-border p-3 flex gap-2">
            <input
              type="text"
              placeholder="Ask a question..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-brand-bg border border-brand-border rounded-lg text-brand-text px-3 py-2 text-xs focus:outline-none focus:border-brand-green"
            />
            <button
              type="submit"
              disabled={isTyping}
              className="p-2 bg-brand-green hover:bg-brand-green-deep text-brand-dark disabled:bg-brand-border disabled:text-brand-secondary rounded-lg flex items-center justify-center transition-colors"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
