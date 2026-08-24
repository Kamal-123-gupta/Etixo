import React, { useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppContextProvider, AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import AttendeePortal from './pages/AttendeePortal';
import EventDetails from './pages/EventDetails';
import OrganizerConsole from './pages/OrganizerConsole';
import AdminDashboard from './pages/AdminDashboard';
import SupportPortal from './pages/SupportPortal';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';

function AppRoutes() {
  const { userProfile, authLoading } = useContext(AppContext);

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#16171d] text-gray-400 font-mono text-xs py-20">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-purple-500 mr-2 mb-2" />
        Synchronizing profile permissions...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AttendeePortal />} />
      <Route path="/event/:id" element={<EventDetails />} />
      
      {/* Route Gating based on User Role */}
      <Route
        path="/organizer"
        element={
          (userProfile?.role === 'organizer' || userProfile?.role === 'admin') ? (
            <OrganizerConsole />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin"
        element={
          userProfile?.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      
      <Route path="/support" element={<SupportPortal />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      {/* Fallback to Discover */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AppContextProvider>
      <Router>
        <div className="min-h-screen bg-[#16171d] text-gray-200 flex flex-col font-sans selection:bg-purple-500/30 selection:text-white">
          <Navbar />
          <main className="flex-1 flex flex-col">
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AppContextProvider>
  );
}

export default App;
