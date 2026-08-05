import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, MapPin, Calendar, Clock, AlertTriangle, CheckCircle, Shield, X, CreditCard } from 'lucide-react';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, createBooking } = useContext(AppContext);

  const event = events.find(e => e.id === id);

  // States
  const [quantity, setQuantity] = useState(1);
  const [cardName, setCardName] = useState('John Doe');
  const [cardNumber, setCardNumber] = useState('4532 7150 8821 9904');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('321');

  // Checkout flows
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState(null); // { success: boolean, reason?: string, booking?: object }

  // Countdown timer for Locked Dynamic Pricing (simulates Dynamic Pricing Agent)
  const [priceLockTime, setPriceLockTime] = useState(300); // 5 mins
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPriceLockTime(prev => {
        if (prev <= 1) {
          // Reset timer and slightly adjust lock
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!event) {
    return (
      <div className="flex-1 bg-[#16171d] text-gray-100 flex flex-col items-center justify-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <p className="text-gray-400 mt-2 text-sm">The event you are looking for has been unscheduled or does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 bg-purple-600 hover:bg-purple-700 text-white text-xs px-4 py-2 rounded-xl"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    setBookingResult(null);
    setShowRazorpay(true);
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);

    // Simulate short gateway handshaking latency
    setTimeout(() => {
      const result = createBooking(event.id, quantity, {
        cardName,
        cardNumber,
        expiry,
        cvv
      });

      setIsProcessing(false);
      setBookingResult(result);
    }, 2000);
  };

  return (
    <div className="flex-1 bg-[#16171d] text-gray-200 min-h-screen">
      {/* Event Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden bg-slate-900">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#16171d] via-transparent to-black/30" />
        
        {/* Navigation Back */}
        <div className="absolute top-6 left-6 z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16171d]/80 hover:bg-[#16171d] border border-white/10 text-xs text-gray-300 hover:text-white font-medium backdrop-blur-md transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Discover
          </button>
        </div>

        {/* Floating title block */}
        <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="bg-purple-600 text-white text-[10px] uppercase font-mono tracking-widest px-3 py-1 rounded-full border border-purple-500/30">
              {event.category} Event
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white m-0 tracking-tight leading-none">
              {event.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-[#1f2028]/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl self-start md:self-auto font-mono text-xs">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400">Dynamic Lock:</span>
            <span className="text-purple-400 font-bold">{formatTime(priceLockTime)}</span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Event details */}
        <div className="lg:col-span-2 space-y-8 text-left">
          
          {/* Logistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#1f2028] border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block">VENUE</span>
                <span className="text-xs font-semibold text-gray-200">{event.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block">DATE</span>
                <span className="text-xs font-semibold text-gray-200">{event.date}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/5 pt-3 sm:pt-0 sm:pl-4">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] text-gray-500 font-mono block">TIMING</span>
                <span className="text-xs font-semibold text-gray-200">{event.time}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-2">Event Description</h2>
            <p className="text-gray-400 text-sm leading-relaxed">{event.description}</p>
          </div>

          {/* FAQs */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-2">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {event.faqs.map((faq, i) => (
                <div key={i} className="bg-[#1f2028]/50 border border-white/5 p-4 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-gray-200 font-mono uppercase tracking-wider">{faq.question}</h4>
                  <p className="text-gray-400 text-sm leading-normal">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-2">Terms & Conditions</h2>
            <ul className="list-disc list-inside text-gray-400 text-sm space-y-1.5 pl-1">
              {event.terms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Checkout Panel */}
        <div className="space-y-6">
          
          {/* Dynamic Pricing alert widget */}
          <div className="bg-[#1f2028] border border-purple-500/10 rounded-2xl p-5 space-y-4 text-left shadow-lg">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <span className="text-xs font-semibold text-gray-300 font-mono tracking-wider uppercase">Dynamic Price Panel</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                event.demand === 'Surge' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                event.demand === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {event.demand} Velocity
              </span>
            </div>

            <div className="flex justify-between items-baseline">
              <div className="space-y-0.5">
                <span className="text-[10px] text-gray-500 block uppercase font-mono">Current dynamic rate</span>
                <span className="text-3xl font-extrabold text-white font-mono">${event.price}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block uppercase font-mono">Base reference</span>
                <span className="text-sm text-gray-400 font-mono font-semibold">${event.basePrice}</span>
              </div>
            </div>

            <div className="bg-[#16171d] p-3 rounded-xl border border-white/5 space-y-1 text-xs text-gray-400 leading-normal">
              <div className="flex items-center gap-1.5 font-bold text-gray-300 font-mono text-[10px] uppercase text-purple-400 mb-1">
                <Shield className="w-3.5 h-3.5" /> Pricing Intelligence Agent
              </div>
              {event.demand === 'Surge' && (
                <p>Demand triggers are highly active. Pricing increased by 15% due to inventory sales velocity surpassing curves.</p>
              )}
              {event.demand === 'High' && (
                <p>Steady booking traffic detected. Moderate surcharge applied matching regional event interest logs.</p>
              )}
              {event.demand === 'Medium' && (
                <p>Sales volume matches standard projections. Dynamic index stabilized.</p>
              )}
              {event.demand === 'Low' && (
                <p>Clearing inventory. Pricing agent applied promo discounts to drive registration.</p>
              )}
            </div>
          </div>

          {/* Ticket Booking Card Form */}
          <div className="bg-[#1f2028] border border-white/5 rounded-2xl p-5 space-y-4 text-left shadow-lg">
            <h3 className="font-bold text-sm text-gray-300 border-b border-white/5 pb-2.5 m-0 uppercase tracking-wider font-mono">
              Secure Checkout
            </h3>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              
              {/* Quantity selection */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-mono block">Ticket Quantity</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(quantity - 1)}
                    className="w-10 h-10 rounded-xl bg-[#16171d] border border-white/5 text-gray-400 hover:text-white flex items-center justify-center font-bold text-lg disabled:opacity-50 select-none"
                  >
                    -
                  </button>
                  <div className="flex-1 h-10 bg-[#16171d] border border-white/5 rounded-xl flex items-center justify-center font-bold font-mono text-white text-sm">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-[#16171d] border border-white/5 text-gray-400 hover:text-white flex items-center justify-center font-bold text-lg select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Spoof Form Elements */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono block">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-mono block">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-mono block">Expiry</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors font-mono text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-mono block">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength="3"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      className="w-full bg-[#16171d] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Price Calculation */}
              <div className="flex justify-between items-center pt-3 border-t border-white/5 text-xs font-semibold">
                <span className="text-gray-400">Total Price:</span>
                <span className="text-lg font-bold text-white font-mono">${(event.price * quantity).toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-purple-500/10 hover:shadow-purple-500/20 active:translate-y-0.5"
              >
                Proceed to Payment
              </button>
            </form>

            {/* Fraud Agent Demo Alert Tips */}
            <div className="bg-[#16171d] p-3.5 rounded-xl border border-rose-500/10 space-y-2 text-[11px] text-gray-400">
              <span className="text-rose-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Simulation Sandbox Tips
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>Change ticket quantity <span className="text-purple-400 font-semibold">&gt; 10</span> to test bot fraud logic.</li>
                <li>Enter card number <span className="text-purple-400 font-mono font-semibold">4111 1111 1111 1111</span> to test card anomalies.</li>
                <li>Include <span className="text-purple-400 font-semibold">"Bot"</span> or <span className="text-purple-400 font-semibold">"Fraud"</span> in the card name field.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* Razorpay Gateway Modal Overlay */}
      {showRazorpay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#1f2028] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-left relative flex flex-col">
            
            {/* Header */}
            <div className="bg-[#16171d] px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#0070e0] flex items-center justify-center font-bold text-white text-xs font-mono">
                  R
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-200 m-0 leading-none">Razorpay Secure</h4>
                  <span className="text-[9px] text-gray-500 font-mono">Payment Gateway Simulator</span>
                </div>
              </div>
              {!isProcessing && !bookingResult && (
                <button
                  onClick={() => setShowRazorpay(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              
              {/* If result is null (Payment Screen) */}
              {!bookingResult && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center bg-[#16171d] p-3 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase font-mono block">Order ID</span>
                      <span className="text-xs font-semibold text-gray-300 font-mono">order_{Date.now().toString().substring(6)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase font-mono block">Amount</span>
                      <span className="text-sm font-bold text-white font-mono">${(event.price * quantity).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                      <span className="text-xs font-semibold text-gray-300">Simulating Card Routing Gateway</span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1.5 font-medium leading-relaxed pl-8">
                      <p>Cardholder Name: <span className="text-gray-200">{cardName}</span></p>
                      <p>Card Brand: <span className="text-indigo-400 font-mono font-semibold">Visa / Mastercard</span></p>
                      <p>Card Number: <span className="text-gray-300 font-mono">XXXX XXXX XXXX {cardNumber.slice(-4)}</span></p>
                    </div>
                  </div>

                  {isProcessing ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-purple-400 font-mono animate-pulse">Running Fraud Detection Engine Checks...</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleCompletePayment}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-blue-500/10"
                    >
                      Complete Secure Payment
                    </button>
                  )}
                </div>
              )}

              {/* If booking result is present (Success/Failed) */}
              {bookingResult && (
                <div className="text-center py-4 space-y-5">
                  {bookingResult.success ? (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
                        <h4 className="text-base font-extrabold text-white">Payment Successful!</h4>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Verified by Operations Agent
                        </span>
                      </div>

                      {/* Ticket Receipt detail */}
                      <div className="bg-[#16171d] p-4 rounded-xl border border-white/5 space-y-3.5 text-left font-mono">
                        <div className="border-b border-dashed border-white/10 pb-2 flex justify-between items-center text-xs">
                          <span className="text-gray-500">TICKET RECEIPT</span>
                          <span className="text-purple-400 text-[10px] font-bold">{bookingResult.booking.id}</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-gray-300">
                          <p>Event: <span className="text-white font-sans font-semibold">{bookingResult.booking.eventTitle}</span></p>
                          <p>Qty: <span className="text-white font-bold">{bookingResult.booking.quantity} ticket(s)</span></p>
                          <p>Total Paid: <span className="text-white font-bold">${bookingResult.booking.pricePaid}</span></p>
                          <p>Holder: <span className="text-white font-sans">{bookingResult.booking.attendeeName}</span></p>
                        </div>
                        <div className="flex flex-col items-center pt-3 border-t border-dashed border-white/10">
                          {/* Simple Mock QR Code style */}
                          <div className="w-28 h-28 bg-white p-2 rounded-lg flex items-center justify-center shadow-lg">
                            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center p-1.5 text-[8px] text-center text-white break-all">
                              <span className="font-bold text-[7px] text-purple-400 mb-1">SMART PASS</span>
                              {bookingResult.booking.qrCode}
                            </div>
                          </div>
                          <span className="text-[8px] text-gray-500 mt-2">Check-in system initialized</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setShowRazorpay(false);
                          navigate('/');
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors"
                      >
                        Return to Discover
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
                        <h4 className="text-base font-extrabold text-white">Payment Declined</h4>
                        <span className="text-[10px] text-rose-400 font-mono bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          Intercepted by Fraud Detection Agent
                        </span>
                      </div>

                      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-left text-xs text-rose-300 leading-relaxed font-mono">
                        <span className="font-bold block text-[10px] text-rose-400 mb-1 uppercase">Block Reason:</span>
                        {bookingResult.reason}
                        <p className="mt-2 text-gray-400 text-[10px]">Your transaction profile triggered platform threshold safety rules. The incident has been logged for admin review.</p>
                      </div>

                      <button
                        onClick={() => {
                          setBookingResult(null);
                          setShowRazorpay(false);
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors"
                      >
                        Adjust Booking details
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
