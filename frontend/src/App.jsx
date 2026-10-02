import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Public Pages
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Admissions from './pages/Admissions.jsx';
import Programs from './pages/Programs.jsx';
import Facilities from './pages/Facilities.jsx';
import Gallery from './pages/Gallery.jsx';
import Calendar from './pages/Calendar.jsx';
import Fees from './pages/Fees.jsx';
import Brochure from './pages/Brochure.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';

// Portal Dashboards
import ParentDashboard from './portals/ParentDashboard.jsx';
import TeacherDashboard from './portals/TeacherDashboard.jsx';
import AdminDashboard from './portals/AdminDashboard.jsx';

// Layout Components
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import BottomNavbar from './components/BottomNavbar.jsx';
import Chatbot from './components/Chatbot.jsx';

// Private Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brandCream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce font-quicksand font-bold text-3xl text-brandCoral">🧸</div>
          <p className="mt-2 text-slate-500 font-quicksand font-medium">Entering School gates...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/dashboard/teacher" replace />;
    if (user.role === 'parent') return <Navigate to="/dashboard/parent" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-brandCream-light text-slate-800">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/admissions" element={<Admissions />} />
              <Route path="/apply" element={<Admissions />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/facilities" element={<Facilities />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/brochure" element={<Brochure />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Portal Dashboards */}
              <Route 
                path="/dashboard/parent" 
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/teacher" 
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/admin" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
          <BottomNavbar />
          <Chatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
