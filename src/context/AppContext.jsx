import React, { createContext, useState, useEffect } from 'react';

export const AppContext = createContext();

const initialEvents = [
  {
    id: 'ev-1',
    title: 'SustainTech Hackathon 2026',
    description: 'A 48-hour global hackathon focused on building open-source AI solutions for carbon offset tracking and renewable energy distribution.',
    date: '2026-08-20',
    time: '09:00 AM',
    location: 'Bengaluru, Tech Park',
    category: 'Tech',
    basePrice: 20,
    price: 25,
    totalTickets: 200,
    ticketsSold: 145,
    demand: 'High',
    riskFactor: 'Low',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60',
    faqs: [
      { question: 'Who can participate?', answer: 'Anyone interested in sustainability and coding! Developers, designers, and domain experts are welcome.' },
      { question: 'Is food provided?', answer: 'Yes, full catering is provided for all 48 hours of the event.' }
    ],
    terms: [
      'Participants must bring their own laptops.',
      'All code must be open-sourced on GitHub.',
      'Refunds are available up to 7 days before the event.'
    ]
  },
  {
    id: 'ev-2',
    title: 'Neon Pulse: Electronic Music Festival',
    description: 'An immersive audio-visual electronic music experience featuring top international synthwave and techno artists with interactive laser grids.',
    date: '2026-08-22',
    time: '06:00 PM',
    location: 'Mumbai, Dome Arena',
    category: 'Music',
    basePrice: 80,
    price: 95,
    totalTickets: 1000,
    ticketsSold: 912,
    demand: 'Surge',
    riskFactor: 'Medium',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60',
    faqs: [
      { question: 'Is there an age limit?', answer: 'Yes, this event is strictly 18+.' },
      { question: 'Will there be lockers available?', answer: 'Yes, locker rentals are available at the entrance.' }
    ],
    terms: [
      'Valid physical ID required for entry.',
      'No professional cameras allowed without a press pass.',
      'Zero tolerance policy for illicit substances.'
    ]
  },
  {
    id: 'ev-3',
    title: 'Improv Comedy Night: Unfiltered',
    description: 'A hilarious evening of unscripted stand-up and games powered entirely by audience prompts and physical comedy.',
    date: '2026-08-15',
    time: '08:00 PM',
    location: 'Delhi, The Laugh Club',
    category: 'Comedy',
    basePrice: 30,
    price: 30,
    totalTickets: 120,
    ticketsSold: 45,
    demand: 'Low',
    riskFactor: 'Low',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=800&auto=format&fit=crop&q=60',
    faqs: [
      { question: 'Are drinks included?', answer: 'No, but drinks can be purchased at the venue bar.' }
    ],
    terms: [
      'Seats are allocated on a first-come, first-served basis.',
      'Please keep phones on silent during the show.'
    ]
  },
  {
    id: 'ev-4',
    title: 'Global AI Summit 2026',
    description: 'The premier annual gathering of AI researchers, developers, and tech executives discussing the future of agentic ecosystems and cognitive modeling.',
    date: '2026-09-05',
    time: '10:00 AM',
    location: 'Bengaluru, Convention Center',
    category: 'Tech',
    basePrice: 150,
    price: 150,
    totalTickets: 500,
    ticketsSold: 280,
    demand: 'Medium',
    riskFactor: 'Low',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60',
    faqs: [
      { question: 'Will talks be recorded?', answer: 'Yes, all keynotes will be uploaded online post-summit.' }
    ],
    terms: [
      'Badges must be worn at all times.',
      'Registration transfers are allowed up to 48h prior.'
    ]
  },
  {
    id: 'ev-5',
    title: 'Chiaroscuro: Modern Art Exhibition',
    description: 'A showcase of high-contrast painting, light installations, and digital canvas displays by emerging contemporary visual artists.',
    date: '2026-08-25',
    time: '11:00 AM',
    location: 'Pune, Creative Spaces',
    category: 'Arts',
    basePrice: 15,
    price: 13,
    totalTickets: 150,
    ticketsSold: 30,
    demand: 'Low',
    riskFactor: 'Low',
    image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop&q=60',
    faqs: [
      { question: 'Can I buy the artwork?', answer: 'Yes, catalog purchases can be coordinated with the gallery staff.' }
    ],
    terms: [
      'Do not touch any of the physical art pieces.',
      'Flash photography is prohibited.'
    ]
  }
];

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
  const [events, setEvents] = useState(initialEvents);
  const [bookings, setBookings] = useState([]);
  const [userProfile, setUserProfile] = useState({
    name: 'Jane Doe',
    email: 'jane.doe@gmail.com',
    location: 'Bengaluru',
    preferences: ['Tech', 'Music'],
    budget: 120,
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

  // Dynamic Pricing Agent Simulation: Periodically fluctuates prices slightly to make UI feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prevEvents) =>
        prevEvents.map((evt) => {
          if (evt.demand === 'Surge') {
            // Price rises
            const multiplier = 1 + (Math.random() * 0.05); // 0-5% increase
            const newPrice = Math.round(evt.price * multiplier * 100) / 100;
            if (newPrice !== evt.price) {
              triggerSystemNotification(`Dynamic Pricing: "${evt.title}" price increased to $${newPrice} due to high demand.`, 'pricing');
              return { ...evt, price: newPrice };
            }
          } else if (evt.demand === 'Low') {
            // Price drops slightly to clear inventory
            const multiplier = 1 - (Math.random() * 0.03); // 0-3% decrease
            const newPrice = Math.max(evt.basePrice * 0.8, Math.round(evt.price * multiplier * 100) / 100);
            if (newPrice !== evt.price) {
              return { ...evt, price: newPrice };
            }
          }
          return evt;
        })
      );
    }, 45000); // Check every 45 seconds

    return () => clearInterval(interval);
  }, []);

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
