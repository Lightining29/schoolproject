import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Menu, X, Smile, LogOut, LayoutDashboard, LogIn, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './ConfirmModal.jsx';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowLogoutConfirm(false);
  };

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'ABOUT US', path: '/about' },
    { name: 'PROGRAMS', path: '/programs' },
    { name: 'FACILITIES', path: '/facilities' },
    { name: 'GALLERY', path: '/gallery' },
    { name: 'CALENDAR', path: '/calendar' },
    { name: 'FEES', path: '/fees' },
    { name: 'CONTACT', path: '/contact' }
  ];

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'teacher') return '/dashboard/teacher';
    if (user.role === 'parent') return '/dashboard/parent';
    return '/';
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b-2 border-slate-100/60 px-4 md:px-8 py-3.5 transition-all select-none print:hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: [0, -10, 10, 0] }}
            className="w-9 h-9 rounded-full bg-[#FEF3C7] border-2 border-white flex items-center justify-center text-amber-500 shadow-[0_3px_8px_rgba(251,191,36,0.12),inset_1px_1px_2px_white]"
          >
            <Smile className="w-5 h-5" />
          </motion.div>
          <div>
            <span className="font-quicksand font-extrabold text-lg text-[#5B468C] tracking-tight group-hover:text-[#7C3AED] transition-colors">Apna School</span>
            <p className="text-[8.5px] text-[#FF7043] font-extrabold tracking-wider mt-[-5px]">KINDERGARTEN</p>
          </div>
        </Link>

        {/* Desktop Links (Clean list with sliding active underline) */}
        <div className="hidden lg:flex items-center space-x-5">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`font-quicksand font-extrabold text-xs tracking-wider relative py-1 transition-colors duration-200 hover:text-[#7C3AED] ${
                  isActive ? 'text-[#7C3AED]' : 'text-slate-600'
                }`}
              >
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#9F92EC] rounded-full"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* CTA Buttons (Simple Flat Pastel Pills) */}
        <div className="hidden lg:flex items-center space-x-3">
          {user ? (
            <>
              <Link
                to={getDashboardPath()}
                className="flex items-center space-x-1.5 font-quicksand font-bold text-xs bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] px-5 py-2.5 rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>DASHBOARD</span>
              </Link>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center space-x-1.5 font-quicksand font-bold text-xs bg-[#FFE4E6] hover:bg-[#FCE7F3] text-[#E11D48] px-5 py-2.5 rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>LOGOUT</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center space-x-1.5 font-quicksand font-bold text-xs bg-[#EAE8FC] hover:bg-[#DED9FA] text-[#7C3AED] px-5 py-2.5 rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>PORTAL LOGIN</span>
              </Link>
              <Link
                to="/contact"
                className="font-quicksand font-bold text-xs bg-[#FEF3C7] hover:bg-[#FDE68A] text-amber-700 px-5 py-2.5 rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>BOOK A TOUR →</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-all outline-none cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer (Clean Dropdown Panel) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#FAF9F6] border-t border-slate-100 overflow-hidden shadow-lg z-40"
          >
            <div className="flex flex-col p-4 space-y-2.5">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`font-quicksand font-extrabold text-sm py-2 px-3 rounded-lg transition-all ${
                    location.pathname === link.path ? 'text-[#7C3AED] bg-[#EAE8FC]' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <hr className="border-slate-100 my-1.5" />

              {user ? (
                <div className="flex flex-col space-y-2 pt-1.5">
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center space-x-2 font-quicksand font-bold text-sm bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#0369A1] py-2.5 rounded-xl transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>DASHBOARD</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="flex items-center justify-center space-x-2 font-quicksand font-bold text-sm bg-[#FFE4E6] hover:bg-[#FCE7F3] text-[#E11D48] py-2.5 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>LOGOUT</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2 pt-1.5">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="font-quicksand font-bold text-sm text-center w-full bg-[#EAE8FC] hover:bg-[#DED9FA] text-[#7C3AED] py-2.5 rounded-xl transition-all"
                  >
                    PORTAL LOGIN
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsOpen(false)}
                    className="font-quicksand font-bold text-sm text-center w-full bg-[#FEF3C7] hover:bg-[#FDE68A] text-amber-700 py-2.5 rounded-xl transition-all"
                  >
                    BOOK A TOUR →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm to Logout"
        message="Are you sure you want to log out of your kindergarten portal account?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Log Out"
        type="logout"
      />
    </nav>
  );
}



