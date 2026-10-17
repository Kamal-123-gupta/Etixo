import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, Shield, X, CreditCard, Sparkles } from 'lucide-react';
import { lockPriceApi, fetchEventById } from '../lib/api';
import { getCategoryFallbackImage, handleImageError } from '../lib/eventImages';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, createBooking, userProfile, formatPrice, theme } = useContext(AppContext);
  const isLight = theme === 'light';

  const contextEvent = events.find(e => e.id === id);

  const [fetchedEvent, setFetchedEvent] = useState(null);
  const [eventFetchStatus, setEventFetchStatus] = useState('idle');

  useEffect(() => {
    if (contextEvent) {
      setFetchedEvent(null);
      setEventFetchStatus('idle');
      return;
    }
    let cancelled = false;
    setEventFetchStatus('loading');
    fetchEventById(id)
      .then((data) => {
        if (cancelled) return;
        setFetchedEvent(data);
        setEventFetchStatus('done');
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Failed to load event', err);
        setEventFetchStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, contextEvent]);

  const event = contextEvent || fetchedEvent;

  // States
  const [quantity, setQuantity] = useState(1);
  const [cardName, setCardName] = useState('John Doe');
  const [cardNumber, setCardNumber] = useState('4532 7150 8821 9904');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('321');

  // Checkout flows
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const [priceLock, setPriceLock] = useState(null);
  const [priceLockStatus, setPriceLockStatus] = useState('idle');
  const [remainingSecs, setRemainingSecs] = useState(0);
  const tickRef = useRef(null);

  const acquireLock = async (eventId) => {
    setPriceLockStatus('loading');
    try {
      const data = await lockPriceApi(eventId);
      setPriceLock({ price: data.locked_price, expiresAt: new Date(data.expires_at) });
      setPriceLockStatus('locked');
    } catch (err) {
      console.error('Price lock failed', err);
      setPriceLock(null);
      setPriceLockStatus('error');
    }
  };

  useEffect(() => {
    if (!event || userProfile.isGuest) {
      setPriceLock(null);
      setPriceLockStatus('idle');
      return;
    }
    acquireLock(event.id);
  }, [event?.id, userProfile.isGuest]);

  useEffect(() => {
    if (!priceLock) {
      setRemainingSecs(0);
      return;
    }
    const tick = () => {
      const secs = Math.max(0, Math.round((priceLock.expiresAt.getTime() - Date.now()) / 1000));
      setRemainingSecs(secs);
      if (secs === 0 && event && !userProfile.isGuest) {
        acquireLock(event.id);
      }
    };
    tick();
    tickRef.current = setInterval(tick, 1000);
    return () => clearInterval(tickRef.current);
  }, [priceLock]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectivePrice = priceLock?.price ?? event?.price;

  if (!event) {
    if (eventFetchStatus === 'loading') {
      return (
        <div className={`flex-1 flex flex-col items-center justify-center p-8 ${
          isLight ? 'text-slate-800' : 'text-gray-100'
        }`}>
          <p className="text-slate-400 text-sm">Loading event details...</p>
        </div>
      );
    }

    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 ${
        isLight ? 'text-slate-800' : 'text-gray-100'
      }`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <p className="text-slate-400 mt-2 text-sm">The event you are looking for has been unscheduled or does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold shadow-xs"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();

    if (userProfile.isGuest) {
      navigate('/login', { state: { from: `/event/${event.id}` } });
      return;
    }

    setBookingResult(null);
    setShowRazorpay(true);
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const result = await createBooking(event.id, quantity, {
          cardName,
          cardNumber,
          expiry,
          cvv
        });

        setBookingResult(result);
      } catch (err) {
        setBookingResult({
          success: false,
          reason: err.message || 'Booking failed. Please try again.'
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className={`flex-1 min-h-screen transition-colors ${
      isLight ? 'text-slate-800' : 'text-gray-200'
    }`}>
      {/* Event Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900">
        <img
          src={event.image || getCategoryFallbackImage(event.category)}
          alt={event.title}
          onError={(e) => handleImageError(e, event.category)}
          className="w-full h-full object-cover opacity-70"
        />
        <div className={`absolute inset-0 ${
          isLight
            ? 'bg-gradient-to-t from-[#f8fafc] via-slate-900/40 to-black/30'
            : 'bg-gradient-to-t from-[#16171d] via-transparent to-black/30'
        }`} />
        
        {/* Navigation Back */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 hover:bg-black/80 border border-white/10 text-xs text-white font-medium backdrop-blur-md transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discover
          </button>
        </div>

        {/* Floating title block */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 text-left">
            <span className="bg-purple-600 text-white text-[10px] uppercase font-mono tracking-widest px-3 py-1 rounded-full border border-purple-400/30 font-bold shadow-xs">
              {event.category} Event
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white m-0 tracking-tight leading-none drop-shadow-md">
              {event.title}
            </h1>
          </div>
          <div className={`flex items-center gap-2 backdrop-blur-md px-4 py-2.5 rounded-2xl border shadow-xl self-start md:self-auto font-mono text-xs ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800'
              : 'bg-[#1f2028]/95 border-white/10 text-gray-200'
          }`}>
            <Clock className="w-4 h-4 text-purple-500" />
            {userProfile.isGuest ? (
              <>
                <span className="text-slate-400">Dynamic Lock:</span>
                <span className="text-purple-600 font-semibold">Sign in to lock rate</span>
              </>
            ) : priceLockStatus === 'error' ? (
              <span className="text-rose-500 font-semibold">Price lock unavailable</span>
            ) : priceLockStatus === 'loading' && !priceLock ? (
              <span className="text-slate-400">Locking price…</span>
            ) : (
              <>
                <span className="text-slate-400">Dynamic Lock:</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">{formatTime(remainingSecs)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Event details */}
        <div className="lg:col-span-2 space-y-8 text-left">
          
          {/* Logistics */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 border p-4 rounded-2xl transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#1f2028] border-white/5'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">VENUE</span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
                  {[event.venueName, event.location].filter(Boolean).join(' — ') || 'Location TBA'}
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-3 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">DATE</span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>{event.date}</span>
              </div>
            </div>
            <div className={`flex items-center gap-3 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">TIMING</span>
                <span className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>{event.time}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className={`text-lg font-bold border-b pb-2 ${
              isLight ? 'text-slate-900 border-slate-200' : 'text-white border-white/5'
            }`}>Event Description</h2>
            <p className={`text-sm leading-relaxed ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>
              {event.description}
            </p>
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            <h2 className={`text-lg font-bold border-b pb-2 ${
              isLight ? 'text-slate-900 border-slate-200' : 'text-white border-white/5'
            }`}>Frequently Asked Questions</h2>
            <div className="space-y-3">
              {(event.faqs && event.faqs.length > 0) ? (
                event.faqs.map((faq, i) => (
                  <div key={i} className={`border p-4 rounded-xl space-y-1 ${
                    isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#1f2028]/50 border-white/5'
                  }`}>
                    <h4 className={`text-xs font-bold font-mono uppercase tracking-wider ${
                      isLight ? 'text-slate-800' : 'text-gray-200'
                    }`}>{faq.question}</h4>
                    <p className={`text-sm leading-normal ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>{faq.answer}</p>
                  </div>
                ))
              ) : (
                <div className={`p-4 rounded-xl border text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#1f2028]/50 border-white/5 text-gray-400'
                }`}>
                  Digital smart check-in and automated refunds apply to all verified tickets.
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-3">
            <h2 className={`text-lg font-bold border-b pb-2 ${
              isLight ? 'text-slate-900 border-slate-200' : 'text-white border-white/5'
            }`}>Terms & Conditions</h2>
            <ul className={`list-disc list-inside text-sm space-y-1.5 pl-1 ${
              isLight ? 'text-slate-600' : 'text-gray-400'
            }`}>
              {(event.terms && event.terms.length > 0) ? (
                event.terms.map((term, i) => (
                  <li key={i}>{term}</li>
                ))
              ) : (
                <>
                  <li>Strictly digital tickets; no printouts required.</li>
                  <li>Full automated refunds are supported up to 48 hours prior to start.</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Checkout Panel */}
        <div className="space-y-6">
          
          {/* Dynamic Pricing alert widget */}
          <div className={`border rounded-2xl p-5 space-y-4 text-left shadow-lg transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#1f2028] border-purple-500/10'
          }`}>
            <div className={`flex justify-between items-center pb-2.5 border-b ${
              isLight ? 'border-slate-100' : 'border-white/5'
            }`}>
              <span className={`text-xs font-bold font-mono tracking-wider uppercase ${
                isLight ? 'text-slate-700' : 'text-gray-300'
              }`}>Dynamic Pricing Index</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                event.demand === 'Surge' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                event.demand === 'High' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              }`}>
                {event.demand} Velocity
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Current dynamic rate</span>
                <span className={`text-3xl font-extrabold font-mono ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>{formatPrice(effectivePrice)}</span>
                {priceLock && priceLock.price !== event.price && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-mono font-semibold">
                    Locked for you at {formatPrice(priceLock.price)} until {formatTime(remainingSecs)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Base reference</span>
                <span className={`text-sm font-mono font-semibold ${
                  isLight ? 'text-slate-500' : 'text-gray-400'
                }`}>{formatPrice(event.basePrice)}</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border space-y-1 text-xs leading-normal ${
              isLight ? 'bg-purple-50/50 border-purple-100 text-purple-900' : 'bg-[#16171d] border-white/5 text-gray-400'
            }`}>
              <div className="flex items-center gap-1.5 font-bold font-mono text-[10px] uppercase text-purple-600 mb-1">
                <Shield className="w-3.5 h-3.5" /> Pricing Intelligence Agent
              </div>
              {event.demand === 'Surge' && (
                <p className="m-0">Demand velocity is peaking. Pricing increased due to inventory selling faster than baseline projections.</p>
              )}
              {event.demand === 'High' && (
                <p className="m-0">Steady booking traffic detected. Moderate dynamic rate matching regional interest.</p>
              )}
              {event.demand === 'Medium' && (
                <p className="m-0">Sales volume matches standard projections. Dynamic index stabilized.</p>
              )}
              {event.demand === 'Low' && (
                <p className="m-0">Standard allocation rate. Early bird pricing active.</p>
              )}
            </div>
          </div>

          {/* Ticket Booking Card Form */}
          <div className={`border rounded-2xl p-5 space-y-4 text-left shadow-lg transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#1f2028] border-white/5'
          }`}>
            <h3 className={`font-bold text-sm border-b pb-2.5 m-0 uppercase tracking-wider font-mono ${
              isLight ? 'text-slate-800 border-slate-100' : 'text-gray-300 border-white/5'
            }`}>
              Secure Checkout
            </h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              
              {/* Quantity selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono block">Ticket Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(quantity - 1)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-lg disabled:opacity-50 select-none transition-colors ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-[#16171d] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    -
                  </button>
                  <div className={`flex-1 h-10 border rounded-xl flex items-center justify-center font-bold font-mono text-sm ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-white'
                  }`}>
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-lg select-none transition-colors ${
                      isLight ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200' : 'bg-[#16171d] border-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Spoof Form Elements */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono block">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-purple-500 transition-colors ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                    }`}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-mono block">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-purple-500 transition-colors ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono block">Expiry</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono text-center focus:outline-none focus:border-purple-500 transition-colors ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                      }`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-mono block">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength="3"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-xs font-mono text-center focus:outline-none focus:border-purple-500 transition-colors ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#16171d] border-white/5 text-gray-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Price Calculation */}
              <div className={`flex justify-between items-center pt-3 border-t text-xs font-semibold ${
                isLight ? 'border-slate-100' : 'border-white/5'
              }`}>
                <span className="text-slate-400">Total Price:</span>
                <span className={`text-lg font-bold font-mono ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>{formatPrice(effectivePrice * quantity)}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-500/20 active:translate-y-0.5"
              >
                {userProfile.isGuest ? 'Sign In to Book' : 'Proceed to Payment'}
              </button>
            </form>

            {/* Fraud Agent Demo Alert Tips */}
            <div className={`p-3.5 rounded-xl border space-y-2 text-[11px] ${
              isLight ? 'bg-rose-50/60 border-rose-200 text-rose-800' : 'bg-[#16171d] border-rose-500/10 text-gray-400'
            }`}>
              <span className="text-rose-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Simulation Sandbox Tips
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Change ticket quantity <span className="text-purple-600 font-semibold">&gt; 10</span> to test bot fraud logic.</li>
                <li>Enter card number <span className="text-purple-600 font-mono font-semibold">4111 1111 1111 1111</span> to test card anomalies.</li>
                <li>Include <span className="text-purple-600 font-semibold">"Bot"</span> or <span className="text-purple-600 font-semibold">"Fraud"</span> in the card name field.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Razorpay Gateway Modal Overlay */}
      {showRazorpay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md border rounded-2xl shadow-2xl overflow-hidden text-left relative flex flex-col ${
            isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1f2028] border-white/10 text-gray-200'
          }`}>
            
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between border-b ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16171d] border-white/5'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#0070e0] flex items-center justify-center font-bold text-white text-xs font-mono">
                  R
                </div>
                <div>
                  <h4 className={`text-xs font-bold m-0 leading-none ${
                    isLight ? 'text-slate-900' : 'text-gray-200'
                  }`}>Razorpay Secure</h4>
                  <span className="text-[9px] text-slate-400 font-mono">Payment Gateway Simulator</span>
                </div>
              </div>
              {!isProcessing && !bookingResult && (
                <button
                  onClick={() => setShowRazorpay(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              
              {!bookingResult && (
                <div className="space-y-5">
                  <div className={`flex justify-between items-center p-3 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16171d] border-white/5'
                  }`}>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Order ID</span>
                      <span className="text-xs font-semibold font-mono">order_{Date.now().toString().substring(6)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Amount</span>
                      <span className={`text-sm font-bold font-mono ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>{formatPrice(effectivePrice * quantity)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold">Card Routing Gateway Simulator</span>
                    </div>
                    <div className="text-xs space-y-1.5 font-medium leading-relaxed pl-8 text-slate-500 dark:text-gray-400">
                      <p>Cardholder Name: <span className="font-semibold text-slate-800 dark:text-gray-200">{cardName}</span></p>
                      <p>Card Brand: <span className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">Visa / Mastercard</span></p>
                      <p>Card Number: <span className="font-mono text-slate-700 dark:text-gray-300">XXXX XXXX XXXX {cardNumber.slice(-4)}</span></p>
                    </div>
                  </div>

                  {isProcessing ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-mono animate-pulse">Running Fraud Detection Engine Checks...</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleCompletePayment}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-blue-500/20"
                    >
                      Complete Secure Payment ({formatPrice(effectivePrice * quantity)})
                    </button>
                  )}
                </div>
              )}

              {/* Result State */}
              {bookingResult && (
                <div className="text-center py-4 space-y-5">
                  {bookingResult.success ? (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
                        <h4 className={`text-base font-extrabold ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>Payment Successful!</h4>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                          Verified by Operations Agent
                        </span>
                      </div>

                      {/* Ticket Receipt detail */}
                      <div className={`p-4 rounded-xl border space-y-3.5 text-left font-mono ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16171d] border-white/5'
                      }`}>
                        <div className={`border-b border-dashed pb-2 flex justify-between items-center text-xs ${
                          isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-gray-500'
                        }`}>
                          <span>TICKET RECEIPT</span>
                          <span className="text-purple-600 font-bold text-[10px]">{bookingResult.booking.id}</span>
                        </div>
                        <div className={`space-y-1.5 text-xs ${
                          isLight ? 'text-slate-700' : 'text-gray-300'
                        }`}>
                          <p>Event: <span className="font-sans font-semibold text-slate-900 dark:text-white">{bookingResult.booking.eventTitle}</span></p>
                          <p>Qty: <span className="font-bold text-slate-900 dark:text-white">{bookingResult.booking.quantity} ticket(s)</span></p>
                          <p>Total Paid: <span className="font-bold text-slate-900 dark:text-white">{formatPrice(bookingResult.booking.pricePaid)}</span></p>
                          <p>Holder: <span className="font-sans text-slate-900 dark:text-white">{bookingResult.booking.attendeeName}</span></p>
                        </div>
                        <div className={`flex flex-col items-center pt-3 border-t border-dashed ${
                          isLight ? 'border-slate-200' : 'border-white/10'
                        }`}>
                          <div className="w-32 h-32 bg-white p-2 rounded-xl flex flex-col items-center justify-center shadow-lg border border-slate-100">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(bookingResult.booking.qrCode)}`}
                              alt="Ticket QR Code"
                              className="w-24 h-24 object-contain"
                            />
                            <span className="font-mono text-[8px] text-gray-500 font-bold truncate max-w-[110px] text-center mt-1">
                              {bookingResult.booking.qrCode}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                            ✓ Operations Agent Checkpoint Activated
                          </span>
                        </div>

                      </div>

                      <button
                        onClick={() => {
                          setShowRazorpay(false);
                          navigate('/');
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs"
                      >
                        Return to Discover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
                        <h4 className={`text-base font-extrabold ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>Payment Declined</h4>
                        <span className="text-[10px] text-rose-500 font-mono bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 font-bold">
                          Intercepted by Fraud Detection Agent
                        </span>
                      </div>

                      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-left text-xs text-rose-600 dark:text-rose-300 leading-relaxed font-mono">
                        <span className="font-bold block text-[10px] mb-1 uppercase">Block Reason:</span>
                        {bookingResult.reason}
                      </div>

                      <button
                        onClick={() => {
                          setBookingResult(null);
                          setShowRazorpay(false);
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors"
                      >
                        Adjust Booking Details
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}