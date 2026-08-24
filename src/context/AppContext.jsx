import React, { createContext, useState, useEffect } from 'react';
import { fetchEvents, ApiError } from '../lib/api';

export const AppContext = createContext();

const initialCampaigns = [
  {
    id: 'camp-1',
    title: 'Neon Pulse Final Push',
    targetEvent: 'Neon Pulse: Electronic Music Festival',
    channel: 'WhatsApp & Instagram',
    status: 'Active',
    sentCount: 1500,
    engagementRate: '12.4%',
    content: '🔥 Only 88 tickets left for the Neon Pulse Festival! Get 10% off using code SYNTH10 before prices surge again tonight!'
  },
  {
    id: 'camp-2',
    title: 'SustainTech Dev Outreach',
    targetEvent: 'SustainTech Hackathon 2026',
    channel: 'Email Newsletter',
    status: 'Completed',
    sentCount: 3000,
    engagementRate: '8.2%',
    content: '🌿 Build AI for the planet. Join developers at SustainTech Hackathon 2026. Top prize: $10,000 grant.'
  }
];

const initialFraudLogs = [
  {
    id: 'fraud-1',
    timestamp: '2026-08-05 14:22:10',
    type: 'Bulk Bot Booking',
    severity: 'High',
    ip: '198.51.100.42',
    user: 'bot-handler-77',
    eventTitle: 'Neon Pulse: Electronic Music Festival',
    details: 'Blocked booking request for 25 tickets in 0.4 seconds from a single IP.'
  },
  {
    id: 'fraud-2',
    timestamp: '2026-08-05 16:05:44',
    type: 'Card Fingerprint Anomaly',
    severity: 'Medium',
    ip: '203.0.113.88',
    user: 'anonymous_user_99',
    eventTitle: 'Global AI Summit 2026',
    details: 'Transaction flagged: 3 card authentication failures using card brand from differing origin country.'
  }
];

const initialNotifications = [
  {
    id: 'notif-1',
    message: 'Dynamic Pricing Agent: Price for Neon Pulse increased by $5 due to high demand velocity.',
    type: 'pricing',
    timestamp: '10 mins ago',
    unread: true
  },
  {
    id: 'notif-2',
    message: 'Fraud Detection Agent: Blocked suspicious bulk ticket booking from IP 198.51.100.42.',
    type: 'fraud',
    timestamp: '2 hours ago',
    unread: false
  },
  {
    id: 'notif-3',
    message: 'Event Operations Agent: QR Code check-in system successfully deployed for SustainTech Hackathon.',
    type: 'ops',
    timestamp: '4 hours ago',
    unread: false
  }
];

export const AppContextProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [bookings, setBookings] = useState([]);
  // STILL MOCK: there's no login page yet (blocked on Kamal's auth work),
  // so this is a placeholder profile, not a real logged-in user -- there's
  // no real `id`, so personalized search/recommendations fall back to
  // popularity ranking (see the `userProfile.id ?? undefined` check in
  // AttendeePortal's search effect). `preferences`/`location` are updated
  // here to match REAL catalog values (old ones were 'Tech'/'Music'/
  // 'Bengaluru', none of which exist in the real sports dataset -- that
  // silently made "Recommended for You" always empty).
  const [userProfile, setUserProfile] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@gmail.com',
    location: 'Arlington',
    preferences: ['football'],
    budget: 200,
    ticketTier: 'Gold'
  });
  const [fraudLogs, setFraudLogs] = useState(initialFraudLogs);
  const [marketingCampaigns, setMarketingCampaigns] = useState(initialCampaigns);
  const [notifications, setNotifications] = useState(initialNotifications);
  
  // Chat History with initial Welcome Message from Support Agent
  const [supportChat, setSupportChat] = useState([
    {
      sender: 'bot',
      message: 'Hello! I am your AI Support Agent. 🤖 I can assist you with ticket purchases, refunds, cancellations, and venue details. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Real backend wiring: load the actual event catalog from the DB instead
  // of the hardcoded mock array. Deliberately does NOT fall back to mock
  // data on failure -- the whole point of wiring is that what's shown is
  // real DB state; silently falling back to fake data on an error would
  // make backend outages invisible instead of surfacing them.
  useEffect(() => {
    let cancelled = false;
    setEventsLoading(true);
    fetchEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data);
          setEventsError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEventsError(err instanceof ApiError ? err.message : 'Could not reach the backend.');
        }
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // DISABLED: this used to randomly perturb prices client-side every 45s to
  // make the old mock-only prototype feel "alive". Now that events come
  // from the real backend/DB, this would silently overwrite real prices
  // with fake random ones on every tick -- fighting the actual Dynamic
  // Pricing Agent instead of reflecting it. Real price changes should come
  // from the backend (re-fetching events, or a future live-update channel),
  // not a client-side random walk. Left commented rather than deleted so
  // the original simulation logic isn't lost if it's useful reference.
  //
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setEvents((prevEvents) =>
  //       prevEvents.map((evt) => {
  //         if (evt.demand === 'Surge') {
  //           const multiplier = 1 + (Math.random() * 0.05);
  //           const newPrice = Math.round(evt.price * multiplier * 100) / 100;
  //           if (newPrice !== evt.price) {
  //             triggerSystemNotification(`Dynamic Pricing: "${evt.title}" price increased to $${newPrice} due to high demand.`, 'pricing');
  //             return { ...evt, price: newPrice };
  //           }
  //         } else if (evt.demand === 'Low') {
  //           const multiplier = 1 - (Math.random() * 0.03);
  //           const newPrice = Math.max(evt.basePrice * 0.8, Math.round(evt.price * multiplier * 100) / 100);
  //           if (newPrice !== evt.price) {
  //             return { ...evt, price: newPrice };
  //           }
  //         }
  //         return evt;
  //       })
  //     );
  //   }, 45000);
  //   return () => clearInterval(interval);
  // }, []);

  const triggerSystemNotification = (message, type = 'info') => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      message,
      type,
      timestamp: 'Just now',
      unread: true
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Agent: Event Creation Assistant Agent
  const generateAICopy = (title, category, location) => {
    const cleanTitle = title || 'Awesome Event';
    return {
      description: `Step into the future with "${cleanTitle}". Held in the vibrant event hubs of ${location || 'Bengaluru'}, this premier ${category || 'Tech'} experience brings together top-tier experts, interactive panels, and hands-on sessions designed to accelerate learning and networking. Join us to explore state-of-the-art developments and discover how AI and creativity collaborate!`,
      faqs: [
        { question: 'What is the refund policy?', answer: 'Full refunds are processed automatically up to 48 hours prior to the event start.' },
        { question: 'Will there be certificates provided?', answer: 'Yes, all verified attendees will receive a digital smart certificate verified via blockchain.' },
        { question: 'Who should I contact for partnerships?', answer: 'Reach out to sponsor@ai-ticketbooking.com for booth bookings and sponsorship tiers.' }
      ],
      terms: [
        'Strictly digital tickets; no printouts required.',
        'Recording sessions is prohibited unless a media badge is issued.',
        'Doors close 15 minutes prior to the opening keynote.'
      ]
    };
  };

  // Agent: Marketing Campaign Agent
  const triggerMarketingCampaign = (event) => {
    const channels = ['WhatsApp Boost', 'Email Blast', 'X (Twitter) Campaign'];
    const selectedChannel = channels[Math.floor(Math.random() * channels.length)];
    const campaignId = `camp-${Date.now()}`;
    
    const messages = {
      'WhatsApp Boost': `⚡ AI Alert: Bookings for "${event.title}" are peaking! Demand is currently ${event.demand}. Secure your spot now at $${event.price}! 🎟️`,
      'Email Blast': `Subject: Exclusive AI Recommendation - ${event.title}\n\nDear Attendee, Based on your preference for ${event.category}, our Personalization Agent recommends securing tickets for "${event.title}" at $${event.price} before demand drives prices up!`,
      'X (Twitter) Campaign': `Trends show high demand for #${event.title.replace(/\s+/g, '')}! Live dynamic pricing is active ($${event.price}). Reserve your pass today! 🤖📈`
    };

    const newCampaign = {
      id: campaignId,
      title: `${event.title} Promo Push`,
      targetEvent: event.title,
      channel: selectedChannel,
      status: 'Active',
      sentCount: Math.floor(Math.random() * 2000) + 500,
      engagementRate: `${(Math.random() * 8 + 4).toFixed(1)}%`,
      content: messages[selectedChannel]
    };

    setMarketingCampaigns(prev => [newCampaign, ...prev]);
    triggerSystemNotification(`Marketing Agent: Created "${newCampaign.title}" campaign on ${selectedChannel}.`, 'marketing');
  };

  // Agent: Fraud Detection Agent Check & Ticket Booking
  const createBooking = (eventId, quantity, paymentDetails) => {
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return { success: false, reason: 'Event not found' };

    // Simulating Fraud Rules
    let fraudDetected = false;
    let fraudReason = '';
    let severity = 'Medium';

    if (quantity > 10) {
      fraudDetected = true;
      fraudReason = 'Bulk Bot Booking';
      severity = 'High';
    }
    else if (paymentDetails.cardName.toLowerCase().includes('bot') || paymentDetails.cardName.toLowerCase().includes('fraud')) {
      fraudDetected = true;
      fraudReason = 'Flagged Account Holder';
      severity = 'High';
    } 
    else if (paymentDetails.cardNumber.replace(/\s/g, '') === '4111111111111111') {
      fraudDetected = true;
      fraudReason = 'Card Fingerprint Anomaly';
      severity = 'High';
    }

    if (fraudDetected) {
      const newLog = {
        id: `fraud-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: fraudReason,
        severity,
        ip: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
        user: paymentDetails.cardName || 'Guest User',
        eventTitle: targetEvent.title,
        details: `Transaction blocked. Customer attempted buying ${quantity} tickets. Trigger: ${fraudReason}.`
      };

      setFraudLogs(prev => [newLog, ...prev]);
      triggerSystemNotification(`Fraud Warning: Transaction intercepted on "${targetEvent.title}". Reason: ${fraudReason}`, 'fraud');
      return { success: false, reason: `Booking Denied: Flagged by Fraud Agent as ${fraudReason}. Transaction aborted.` };
    }

    // Success booking: Decrement stock, increment sales
    setEvents(prevEvents =>
      prevEvents.map(evt => {
        if (evt.id === eventId) {
          const updatedSold = evt.ticketsSold + quantity;
          let updatedDemand = evt.demand;
          const ratio = updatedSold / evt.totalTickets;
          if (ratio > 0.85) updatedDemand = 'Surge';
          else if (ratio > 0.6) updatedDemand = 'High';
          else if (ratio > 0.3) updatedDemand = 'Medium';

          const newPrice = updatedDemand === 'Surge' ? Math.round(evt.price * 1.15) : evt.price;

          return {
            ...evt,
            ticketsSold: updatedSold,
            demand: updatedDemand,
            price: newPrice
          };
        }
        return evt;
      })
    );

    const bookingId = `tkt-${Date.now()}`;
    const newBooking = {
      id: bookingId,
      eventId,
      eventTitle: targetEvent.title,
      quantity,
      pricePaid: targetEvent.price * quantity,
      date: new Date().toLocaleDateString(),
      qrCode: `QR-TICKET-${bookingId}-${eventId}`,
      attendeeName: paymentDetails.cardName,
      status: 'Confirmed'
    };

    setBookings(prev => [newBooking, ...prev]);
    triggerSystemNotification(`Booking Confirmed: ${quantity} tickets purchased for "${targetEvent.title}".`, 'booking');

    setTimeout(() => {
      triggerSystemNotification(`Operations Agent: Smart ticket validation and QR code [${newBooking.qrCode}] activated.`, 'ops');
    }, 1500);

    return { success: true, booking: newBooking };
  };

  // Agent: Customer Support Agent Simulation Chatbot
  const sendSupportMessage = (userMsg) => {
    if (!userMsg.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessageObj = { sender: 'user', message: userMsg, timestamp };
    
    setSupportChat(prev => [...prev, userMessageObj]);

    setTimeout(() => {
      let botResponse = '';
      const text = userMsg.toLowerCase();

      if (text.includes('refund') || text.includes('cancel')) {
        botResponse = 'Our Policy Agent permits full refunds if canceled at least 48 hours before the event. To proceed, go to the Admin portal or type "escalate" to transfer to a human refunds clerk. 💸';
      } else if (text.includes('ticket') || text.includes('booking') || text.includes('qr')) {
        botResponse = 'Once a booking is successful, tickets are automatically emailed. The Operations Agent activates unique, secure QR codes. You can also view them in your Profile. 🎟️';
      } else if (text.includes('dynamic') || text.includes('price') || text.includes('surge')) {
        botResponse = 'Our Dynamic Pricing Agent monitors real-time sales velocity. Prices increase during periods of high demand to match inventory curves, and drop when sales slow down. 📈';
      } else if (text.includes('fraud') || text.includes('bot') || text.includes('blocked')) {
        botResponse = 'The Fraud Detection Agent blocks bots and suspicious card activities in real-time. If your transaction was blocked falsely, please request manual review via human escalation.';
      } else if (text.includes('escalate') || text.includes('human') || text.includes('operator') || text.includes('agent')) {
        botResponse = 'Understood. Transferring your ticket thread to our Level-2 Support Supervisor... 🚨 Connected to Agent Sarah. How can I help you?';
        setSupportChat(prev => [
          ...prev,
          { sender: 'bot', message: botResponse, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), escalated: true }
        ]);
        return;
      } else {
        botResponse = 'I can help explain any of the 9 backend AI agents (like Dynamic Pricing, Fraud Detection, Personalization, or Operations) or assist with ticket bookings. What would you like to know? 🤖';
      }

      setSupportChat(prev => [
        ...prev,
        { sender: 'bot', message: botResponse, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }, 1000);
  };

  const addCustomEvent = (eventData) => {
    const aiCopy = generateAICopy(eventData.title, eventData.category, eventData.location);
    const newEvent = {
      id: `ev-${Date.now()}`,
      title: eventData.title,
      description: aiCopy.description,
      date: eventData.date,
      time: eventData.time || '07:00 PM',
      location: eventData.location,
      category: eventData.category,
      basePrice: Number(eventData.basePrice),
      price: Number(eventData.basePrice),
      totalTickets: Number(eventData.totalTickets),
      ticketsSold: 0,
      demand: 'Low',
      riskFactor: 'Low',
      image: eventData.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=60',
      faqs: aiCopy.faqs,
      terms: aiCopy.terms
    };

    setEvents(prev => [newEvent, ...prev]);
    triggerSystemNotification(`Event Creator: Created event "${newEvent.title}". AI successfully auto-generated event description, FAQs, and T&Cs.`, 'creation');

    setTimeout(() => {
      triggerSystemNotification(`Operations Agent: Registered "${newEvent.title}". Automated event readiness checklist initialized.`, 'ops');
    }, 1000);

    return newEvent;
  };

  const clearUnreadNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  return (
    <AppContext.Provider
      value={{
        events,
        eventsLoading,
        eventsError,
        bookings,
        userProfile,
        fraudLogs,
        marketingCampaigns,
        notifications,
        supportChat,
        createBooking,
        sendSupportMessage,
        addCustomEvent,
        triggerMarketingCampaign,
        clearUnreadNotifications,
        setUserProfile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
