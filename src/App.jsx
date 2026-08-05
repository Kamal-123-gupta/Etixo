import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppContextProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import AttendeePortal from './pages/AttendeePortal';
import EventDetails from './pages/EventDetails';
import OrganizerConsole from './pages/OrganizerConsole';
import AdminDashboard from './pages/AdminDashboard';
import SupportPortal from './pages/SupportPortal';

function App() {
  return (
    <AppContextProvider>
      <Router>
        <div className="min-h-screen bg-[#16171d] text-gray-200 flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<AttendeePortal />} />
              <Route path="/event/:id" element={<EventDetails />} />
              <Route path="/organizer" element={<OrganizerConsole />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/support" element={<SupportPortal />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppContextProvider>
  );
}

export default App;
