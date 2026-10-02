import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, BookOpen, Sparkles, Image, User, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNavbar() {
  const location = useLocation();
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'teacher') return '/dashboard/teacher';
    if (user.role === 'parent') return '/dashboard/parent';
    return '/login';
  };

  const navItems = [
    {
      name: 'Home',
      path: '/',
      icon: Home
    },
    {
      name: 'Programs',
      path: '/programs',
      icon: BookOpen
    },
    {
      name: 'Apply',
      path: '/contact',
      icon: Sparkles,
      isAction: true
    },
    {
      name: 'Gallery',
      path: '/gallery',
      icon: Image
    },
    {
      name: user ? 'Portal' : 'Login',
      path: getDashboardPath(),
      icon: user ? LayoutDashboard : User
    }
  ];

  // Don't show bottom nav on desktop, or inside full print view
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-1 pointer-events-none print:hidden">
      <nav className="pointer-events-auto max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_12px_35px_rgba(91,70,140,0.18),0_2px_8px_rgba(0,0,0,0.06)] rounded-full px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path.startsWith('/dashboard') && location.pathname.startsWith('/dashboard'));

          if (item.isAction) {
            return (
              <Link
                key={item.name}
                to={item.path}
                className="relative -top-3.5 flex flex-col items-center group focus:outline-none"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF7043] to-[#FFA000] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(255,112,67,0.45),inset_1px_1px_2px_rgba(255,255,255,0.5)] border-4 border-white"
                >
                  <item.icon className="w-5 h-5 fill-current animate-pulse" />
                </motion.div>
                <span className="text-[9.5px] font-extrabold font-quicksand text-[#FF7043] mt-0.5 tracking-tight uppercase">
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              to={item.path}
              className="relative flex flex-col items-center py-1 px-3 rounded-2xl transition-all focus:outline-none"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavPill"
                  className="absolute inset-0 bg-[#EAE8FC] rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 transition-all duration-200 ${
                  isActive
                    ? 'text-[#7C3AED] stroke-[2.5px] scale-110'
                    : 'text-slate-500 stroke-[1.8px] group-hover:text-slate-700'
                }`}
              />
              <span
                className={`text-[9.5px] font-quicksand font-bold tracking-tight mt-0.5 ${
                  isActive ? 'text-[#7C3AED]' : 'text-slate-500'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
