import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Send, MessageSquare, LifeBuoy, ArrowRight } from 'lucide-react';

export default function SupportPortal() {
  const { supportChat, supportChatLoading, isSupportSending, sendSupportMessage, userProfile } = useContext(AppContext);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [supportChat, isSupportSending]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSupportSending) return;
    sendSupportMessage(inputText);
    setInputText('');
  };

  const handleQuickQuestion = (q) => {
    if (isSupportSending) return;
    sendSupportMessage(q);
  };

  const hasEscalated = supportChat.some(msg => msg.escalated);

  if (userProfile.isGuest) {
    return (
      <div className="flex-1 bg-[#16171d] text-gray-200 p-6 md:p-10 max-w-3xl mx-auto w-full flex flex-col items-center justify-center gap-4 text-center">
        <LifeBuoy className="w-10 h-10 text-purple-400" />
        <h2 className="text-lg font-bold text-gray-100">Sign in to chat with Support</h2>
        <p className="text-sm text-gray-400 max-w-sm">
          The Support Agent looks at your actual bookings to help with refunds, tickets, and more -- so it needs you to be signed in.
        </p>
        <button
          onClick={() => navigate('/login', { state: { from: '/support' } })}
          className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#16171d] text-gray-200 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6 text-left flex flex-col md:flex-row gap-6">
      
      {/* Left panel: Info */}
      <div className="w-full md:w-80 shrink-0 bg-[#1f2028] border border-white/5 p-5 rounded-2xl space-y-4 h-fit">
        <div className="flex items-center gap-2 pb-2.5 border-b border-white/5">
          <LifeBuoy className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold text-gray-200 font-mono uppercase tracking-wider m-0">Support Assistant</h2>
        </div>

        <div className="space-y-3.5 text-xs text-gray-400 leading-relaxed font-medium">
          <p>🤖 <span className="text-gray-300 font-semibold">AI Support Agent:</span> Handles cancellations, payment verification, dynamic pricing explanation, and ticket/QR questions with rule-based answers, and falls back to a real LLM for anything else.</p>
          
          <div className="bg-[#16171d] p-3 rounded-xl border border-white/5 space-y-1">
            <span className="font-bold text-[9px] text-purple-400 font-mono uppercase">Escalation Policy</span>
            <p className="text-[11px]">Type "escalate" or request human operator to trigger Level-2 manual ticketing support routing.</p>
          </div>
        </div>

        {/* Quick Help Prompts */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-[10px] text-gray-500 font-mono uppercase block mb-1">Interactive Prompts</span>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleQuickQuestion('How can I refund my booking?')}
              className="w-full bg-[#16171d] hover:bg-[#16171d]/80 text-left text-[11px] text-purple-400 px-3 py-2 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all flex items-center justify-between"
            >
              <span>Refund Policy Details</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <button
              onClick={() => handleQuickQuestion('Why is the price changing?')}
              className="w-full bg-[#16171d] hover:bg-[#16171d]/80 text-left text-[11px] text-purple-400 px-3 py-2 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all flex items-center justify-between"
            >
              <span>Explain Dynamic Pricing</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <button
              onClick={() => handleQuickQuestion('Where is my QR ticket?')}
              className="w-full bg-[#16171d] hover:bg-[#16171d]/80 text-left text-[11px] text-purple-400 px-3 py-2 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all flex items-center justify-between"
            >
              <span>Check-in QR Pass Code</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <button
              onClick={() => handleQuickQuestion('I need to escalate to human agent')}
              className="w-full bg-[#16171d] hover:bg-[#16171d]/80 text-left text-[11px] text-purple-400 px-3 py-2 rounded-xl border border-white/5 hover:border-purple-500/15 transition-all flex items-center justify-between"
            >
              <span>Escalate Ticket Thread</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            {/* Deliberately avoids every rule-based trigger keyword (refund/
                cancel, ticket/qr, price/surge, fraud/blocked, escalate/human)
                so this one actually reaches the LLM branch instead of a
                canned template -- the other four prompts above all match a
                rule and never touch the LLM at all. */}
            <button
              onClick={() => handleQuickQuestion('What should I wear to an outdoor stadium event in October?')}
              className="w-full bg-[#16171d] hover:bg-[#16171d]/80 text-left text-[11px] text-emerald-400 px-3 py-2 rounded-xl border border-emerald-500/10 hover:border-emerald-500/25 transition-all flex items-center justify-between"
            >
              <span>Ask Something Else (uses AI)</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: Chat UI */}
      <div className="flex-1 bg-[#1f2028] border border-white/5 rounded-2xl flex flex-col h-[520px] shadow-xl overflow-hidden">
        
        {/* Chat Header */}
        <div className="bg-[#16171d] border-b border-white/5 px-5 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-200 m-0 leading-none">
                {hasEscalated ? 'Chat with Sarah (Supervisor)' : 'AI Support Sandbox'}
              </h3>
              <span className="text-[9px] text-gray-500 font-mono mt-0.5 block">
                {hasEscalated ? '🚨 Level-2 human session active' : '🤖 AI-driven responses'}
              </span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {supportChatLoading ? (
            <p className="text-xs text-gray-500 text-center py-8">Loading conversation history...</p>
          ) : (
            supportChat.map((msg, i) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={i}
                  className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto text-left' : 'ml-auto text-right flex-row-reverse'}`}
                >
                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold font-mono ${
                    isBot ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/15 text-indigo-400'
                  }`}>
                    {isBot ? 'AI' : 'ME'}
                  </div>

                  <div className="space-y-1">
                    {isBot && msg.intent && (
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                        msg.intent === 'llm_general'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}>
                        {msg.intent === 'llm_general' ? 'LLM' : msg.intent === 'fallback' ? 'Template (no LLM configured)' : 'Rule-based'}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isBot 
                        ? msg.isError
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
                          : msg.escalated 
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' 
                          : 'bg-[#16171d] border border-white/5 text-gray-300' 
                        : 'bg-purple-600 text-white shadow-md shadow-purple-500/10'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono block px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })
          )}
          {isSupportSending && (
            <div className="flex gap-3 max-w-[85%] mr-auto text-left">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold font-mono bg-purple-500/10 text-purple-400">
                AI
              </div>
              <div className="px-4 py-2.5 rounded-2xl text-xs leading-relaxed bg-[#16171d] border border-white/5 text-gray-500 italic">
                Typing...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input composer Form */}
        <form onSubmit={handleSubmit} className="p-4 bg-[#16171d] border-t border-white/5 flex gap-2 shrink-0">
          <input
            type="text"
            placeholder={hasEscalated ? "Type message to Supervisor Sarah..." : "Ask Support agent..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSupportSending}
            className="flex-1 bg-[#1f2028] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSupportSending}
            className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-md shadow-purple-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}