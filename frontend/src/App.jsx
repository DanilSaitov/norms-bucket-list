// Main App Component
// Sets up routing for the entire application

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Profile from './pages/Profile';
import CompletedTraditions from './pages/CompletedTraditions';
import PendingTraditions from './pages/PendingTraditions';
import StaffDashboard from './pages/StaffDashboard';
import Help from './pages/Help';
import Feedback from './pages/Feedback';
import AdminFeedback from './pages/AdminFeedback';
import AdminSuggestions from './pages/AdminSuggestions';
import SuggestTradition from './pages/SuggestTradition';
import Notifications from './pages/Notifications';
import ManageTraditions from './pages/ManageTraditions';

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/admin" element={<StaffDashboard />} />
        <Route path="/pending" element={<PendingTraditions />} />
        <Route path="/completed" element={<CompletedTraditions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/suggest" element={<SuggestTradition />} />
        <Route path="/admin/suggestions" element={<AdminSuggestions />} />
        <Route path="/admin/manage-traditions" element={<ManageTraditions />} />
        <Route path="/help" element={<Help />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/admin/feedback" element={<AdminFeedback />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Router>
  );
}

export default App;
