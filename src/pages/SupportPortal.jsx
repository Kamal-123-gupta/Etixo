import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Send, MessageSquare, LifeBuoy, ArrowRight, Sparkles, Bot } from 'lucide-react';

export default function SupportPortal() {
  const { supportChat, supportChatLoading, isSupportSending, sendSupportMessage, userProfile, theme } = useContext(AppContext);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef(null);
  const navigate = useNavigate();
  const isLight = theme === 'light';

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
      <div className={`flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full flex flex-col items-center justify-center gap-4 text-center ${
        isLight ? 'text-slate-800' : 'text-gray-200'
      }`}>
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600">
          <Bot className="w-8 h-8" />
        </div>
        <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-gray-100'}`}>
          Sign in to chat with Etix
        </h2>
        <p className={`text-sm max-w-md ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
          Etix is your personal AI support concierge. It inspects your actual verified bookings, solves pricing & QR code inquiries, and processes instant refunds.
        </p>
        <button
          onClick={() => navigate('/login', { state: { from: '/support' } })}
          className="mt-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-purple-500/20 active:translate-y-0.5"
        >
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div className={`flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full space-y-6 text-left flex flex-col md:flex-row gap-6 ${
      isLight ? 'text-slate-800' : 'text-gray-200'
    }`}>
      
      {/* Left panel: Info */}
      <div className={`w-full md:w-80 shrink-0 border p-5 rounded-2xl space-y-4 h-fit transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#1f2028] border-white/5'
      }`}>
        <div className={`flex items-center gap-2 pb-2.5 border-b ${
          isLight ? 'border-slate-100' : 'border-white/5'
        }`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            E
          </div>
          <div>
            <h2 className={`text-sm font-bold font-mono uppercase tracking-wider m-0 ${
              isLight ? 'text-slate-900' : 'text-gray-200'
            }`}>
              Etix Assistant
            </h2>
            <span className="text-[10px] text-purple-600 font-mono font-medium">Smart Support AI</span>
          </div>
        </div>

        <div className={`space-y-3.5 text-xs leading-relaxed font-medium ${
          isLight ? 'text-slate-600' : 'text-gray-400'
        }`}>
          <p>🤖 <strong className={isLight ? 'text-slate-900' : 'text-gray-200'}>Etix AI Support:</strong> Handles ticket check-in codes, instant cancellations, payment confirmations, and dynamic pricing questions.</p>
          
          <div className={`p-3 rounded-xl border space-y-1 ${
            isLight ? 'bg-purple-50/60 border-purple-100 text-purple-900' : 'bg-[#16171d] border-white/5'
          }`}>
            <span className="font-bold text-[9px] text-purple-600 font-mono uppercase block">Escalation Policy</span>
            <p className="text-[11px] m-0">Type "escalate" or ask for a human supervisor to transfer your conversation to Level-2 operator support.</p>
          </div>
        </div>

        {/* Quick Help Prompts */}
        <div className={`space-y-2 pt-2 border-t ${
          isLight ? 'border-slate-100' : 'border-white/5'
        }`}>
          <span className="text-[10px] text-slate-400 dark:text-gray-500 font-mono uppercase block mb-1 font-bold">
            Interactive Prompts
          </span>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleQuickQuestion('How can I refund my booking?')}
              className={`w-full text-left text-[11px] px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between font-medium ${
                isLight
                  ? 'bg-slate-50 hover:bg-purple-50 text-purple-700 border-slate-200/80 hover:border-purple-300'
                  : 'bg-[#16171d] hover:bg-[#16171d]/80 text-purple-400 border-white/5 hover:border-purple-500/20'
              }`}
            >
              <span>Refund Policy Details</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <button
              onClick={() => handleQuickQuestion('Why is the price changing?')}
              className={`w-full text-left text-[11px] px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between font-medium ${
                isLight
                  ? 'bg-slate-50 hover:bg-purple-50 text-purple-700 border-slate-200/80 hover:border-purple-300'
                  : 'bg-[#16171d] hover:bg-[#16171d]/80 text-purple-400 border-white/5 hover:border-purple-500/20'
              }`}
            >
              <span>Explain Dynamic Pricing</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <button
              onClick={() => handleQuickQuestion('Where is my QR ticket?')}
              className={`w-full text-left text-[11px] px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between font-medium ${
                isLight
                  ? 'bg-slate-50 hover:bg-purple-50 text-purple-700 border-slate-200/80 hover:border-purple-300'
                  : 'bg-[#16171d] hover:bg-[#16171d]/80 text-purple-400 border-white/5 hover:border-purple-500/20'
              }`}
            >
              <span>Check-in QR Pass Code</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <button
              onClick={() => handleQuickQuestion('I need to escalate to human agent')}
              className={`w-full text-left text-[11px] px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between font-medium ${
                isLight
                  ? 'bg-slate-50 hover:bg-rose-50 text-rose-700 border-slate-200/80 hover:border-rose-300'
                  : 'bg-[#16171d] hover:bg-[#16171d]/80 text-rose-400 border-white/5 hover:border-rose-500/20'
              }`}
            >
              <span>Escalate Thread</span>
              <ArrowRight className="w-3 h-3 shrink-0" />
            </button>
            <button
              onClick={() => handleQuickQuestion('What should I wear to an outdoor stadium event in October?')}
              className={`w-full text-left text-[11px] px-3 py-2.5 rounded-xl border transition-all flex items-center justify-between font-medium ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 border-emerald-200'
                  : 'bg-[#16171d] hover:bg-[#16171d]/80 text-emerald-400 border-emerald-500/15 hover:border-emerald-500/30'
              }`}
            >
              <span>Ask Etix Something Else</span>
              <Sparkles className="w-3 h-3 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Right panel: Chat UI */}
      <div className={`flex-1 border rounded-2xl flex flex-col h-[540px] shadow-xl overflow-hidden transition-colors ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#1f2028] border-white/5'
      }`}>
        
        {/* Chat Header */}
        <div className={`px-5 py-4 flex justify-between items-center shrink-0 border-b ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16171d] border-white/5'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-xs font-bold m-0 leading-none ${
                isLight ? 'text-slate-900' : 'text-gray-200'
              }`}>
                {hasEscalated ? 'Live Session: Sarah (Supervisor)' : 'Etix Support Desk'}
              </h3>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                {hasEscalated ? '🚨 Level-2 human session active' : '🤖 Etix AI Engine Active'}
              </span>
            </div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Online" />
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {supportChatLoading ? (
            <p className="text-xs text-slate-400 text-center py-8">Loading conversation history with Etix...</p>
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
                    isBot 
                      ? 'bg-purple-600 text-white shadow-xs' 
                      : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {isBot ? 'E' : 'ME'}
                  </div>

                  <div className="space-y-1">
                    {isBot && msg.intent && (
                      <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                        msg.intent === 'llm_general'
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10'
                      }`}>
                        {msg.intent === 'llm_general' ? '✨ LLM' : msg.intent === 'fallback' ? 'Template' : 'Etix Rule-based'}
                      </span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      isBot 
                        ? msg.isError
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300'
                          : msg.escalated 
                          ? 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300' 
                          : isLight
                          ? 'bg-slate-100 border border-slate-200 text-slate-800'
                          : 'bg-[#16171d] border border-white/5 text-gray-300' 
                        : 'bg-purple-600 text-white shadow-md shadow-purple-500/10'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono block px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })
          )}
          {isSupportSending && (
            <div className="flex gap-3 max-w-[85%] mr-auto text-left">
              <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold font-mono bg-purple-600 text-white">
                E
              </div>
              <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed italic ${
                isLight ? 'bg-slate-100 border border-slate-200 text-slate-500' : 'bg-[#16171d] border border-white/5 text-gray-500'
              }`}>
                Etix is typing...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input composer Form */}
        <form onSubmit={handleSubmit} className={`p-4 border-t flex gap-2 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16171d] border-white/5'
        }`}>
          <input
            type="text"
            placeholder={hasEscalated ? "Type message to Supervisor Sarah..." : "Ask Etix support assistant..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSupportSending}
            className={`flex-1 border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all disabled:opacity-50 ${
              isLight
                ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                : 'bg-[#1f2028] border-white/10 text-gray-200 placeholder-gray-500'
            }`}
          />
          <button
            type="submit"
            disabled={isSupportSending}
            className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-md shadow-purple-500/10"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
}