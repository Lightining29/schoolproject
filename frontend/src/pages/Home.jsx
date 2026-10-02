import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  BookOpen,
  Star,
  Heart,
  Users,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Bell,
  Sparkles,
  ArrowRight,
  Clock,
  Play,
  Compass,
  Smile,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const autoPlayRef = useRef(null);

  const heroSlides = [
    {
      id: 1,
      programTab: '🧸 Playgroup & Toddlers',
      age: '1.5 - 2.5 Yrs',
      badge: 'Admissions Open for 2026-27 ✨',
      title: 'A Joyful Playground For',
      highlight: 'Curious Little Explorers',
      subtitle: 'Where laughter leads to learning! Nurturing emotional intelligence, creative arts, and sensory exploration through play.',
      mainImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=900',
      secondaryImage: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=500',
      badgeTop: { text: '⭐ 4.9/5 Parent Rating', sub: '500+ Happy Families' },
      badgeBottom: { text: '🧸 8:1 Child-Teacher Care', sub: 'Personalized Coaching' },
      themeGrad: 'from-[#FF7043] via-[#F59E0B] to-[#7C3AED]',
      btnGrad: 'from-[#FF7043] to-[#FFA000]',
      tagBg: 'bg-[#FF7043]/10 text-[#FF7043] border-[#FF7043]/20',
      floatingEmoji: '🎈',
      floatingEmoji2: '🎨'
    },
    {
      id: 2,
      programTab: '🎨 Nursery & Preschool',
      age: '2.5 - 3.5 Yrs',
      badge: '100% Safe & Child-First 🛡️',
      title: 'Safe, Nurturing & Caring',
      highlight: 'Early Childhood Haven',
      subtitle: 'Certified Montessori curriculum, organic sensory playrooms, live CCTV monitoring, and freshly cooked healthy daily meals.',
      mainImage: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=900',
      secondaryImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500',
      badgeTop: { text: '🛡️ 100% Monitored', sub: '24/7 CCTV & Security' },
      badgeBottom: { text: '🥗 Chef-Cooked Meals', sub: 'Daily Organic Nutrition' },
      themeGrad: 'from-[#10B981] via-[#0EA5E9] to-[#6366F1]',
      btnGrad: 'from-[#10B981] to-[#3B82F6]',
      tagBg: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20',
      floatingEmoji: '🚀',
      floatingEmoji2: '🧸'
    },
    {
      id: 3,
      programTab: '🚀 Junior & Senior KG',
      age: '3.5 - 6 Yrs',
      badge: 'Future-Ready Foundation 🌟',
      title: 'Smart STEM Discovery &',
      highlight: 'Confident Young Thinkers',
      subtitle: 'Hands-on robotics, phonics wonderland, bilingual speech labs, musical drama, and outdoor team sports.',
      mainImage: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=900',
      secondaryImage: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500',
      badgeTop: { text: '🔬 Smart STEM Labs', sub: 'Tactile Learning' },
      badgeBottom: { text: '🎭 Drama & Arts Studio', sub: 'Creative Expression' },
      themeGrad: 'from-[#7C3AED] via-[#EC4899] to-[#F59E0B]',
      btnGrad: 'from-[#7C3AED] to-[#EC4899]',
      tagBg: 'bg-[#7C3AED]/10 text-[#7C3AED] border-[#7C3AED]/20',
      floatingEmoji: '📚',
      floatingEmoji2: '🌟'
    }
  ];

  // Auto slide timer (6 seconds)
  useEffect(() => {
    if (!isHovered) {
      autoPlayRef.current = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % heroSlides.length);
      }, 6000);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isHovered, heroSlides.length]);

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  useEffect(() => {
    // Fetch latest announcements
    fetch('/api/public/announcements')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAnnouncements(data.data.slice(0, 3));
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const highlights = [
    { title: 'Safe & Caring Environment', text: 'A secure and loving space for every child.', icon: Shield, color: 'bg-brandMint text-brandMint-dark border-brandMint/30' },
    { title: 'Play-Based Learning', text: 'Hands-on learning that sparks curiosity.', icon: BookOpen, color: 'bg-brandYellow text-brandYellow-dark border-brandYellow/30' },
    { title: 'Experienced Teachers', text: 'Passionate educators dedicated to growth.', icon: Star, color: 'bg-brandSky text-brandSky-dark border-brandSky/30' },
    { title: 'Holistic Development', text: 'Supporting academic, social & emotional growth.', icon: Heart, color: 'bg-brandCoral text-brandCoral-dark border-brandCoral/30' },
    { title: 'Strong Parent Partnership', text: 'Together, we build a strong foundation for success.', icon: Users, color: 'bg-brandLavender text-brandLavender-dark border-brandLavender/30' }
  ];

  const programs = [
    { name: 'INFANTS', age: '6 Weeks - 18 Months', text: 'Loving care and early sensory learning in a nurturing environment.', color: 'bg-brandMint/10 border-brandMint/30 text-brandMint-dark' },
    { name: 'TODDLERS', age: '18 Months - 3 Years', text: 'Exploring the world through guided play, discovery, and imagination.', color: 'bg-brandYellow/10 border-brandYellow/30 text-brandYellow-dark' },
    { name: 'PRESCHOOL', age: '3 - 5 Years', text: 'Building foundational skills, confidence, and love for learning.', color: 'bg-brandSky/10 border-brandSky/30 text-brandSky-dark' },
    { name: 'PRE-K', age: '4 - 6 Years', text: 'Kindergarten readiness with hands-on phonics, math & social growth.', color: 'bg-brandCoral/10 border-brandCoral/30 text-brandCoral-dark' }
  ];

  const currentSlideData = heroSlides[activeSlide];

  return (
    <div className="overflow-hidden pb-16 lg:pb-0">
      
      {/* 1. ULTRA-ATTRACTIVE HERO SECTION WITH CUTOUT SLICE TRANSITION */}
      <section
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative px-4 sm:px-6 md:px-8 pt-5 md:pt-10 pb-16 md:pb-24 bg-gradient-to-b from-[#FFFDF9] via-[#FAF7F2] to-[#F5F0E8] overflow-hidden"
      >
        {/* Animated Playful Ambient Light Blobs */}
        <motion.div
          animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 12, ease: 'easeInOut' }}
          className="absolute -top-16 -left-16 w-96 h-96 rounded-full bg-gradient-to-br from-[#FFE8D6]/70 to-[#FEF3C7]/60 blur-3xl pointer-events-none -z-10"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 14, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-20 w-[420px] h-[420px] rounded-full bg-gradient-to-bl from-[#E0E7FF]/60 via-[#FCE7F3]/50 to-[#FEF3C7]/40 blur-3xl pointer-events-none -z-10"
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
          className="absolute -bottom-10 left-1/4 w-80 h-80 rounded-full bg-[#DCFCE7]/50 blur-3xl pointer-events-none -z-10"
        />

        <div className="max-w-7xl mx-auto">
          
          {/* Top Floating Announcement Bar & Interactive Program Tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-6 sm:mb-8">
            
            {/* Live Admissions Badge with Pulse */}
            <motion.div
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="inline-flex items-center space-x-2 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-orange-200/80 shadow-[0_4px_12px_rgba(255,112,67,0.1)] text-xs font-bold text-slate-800"
            >
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF7043] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF7043]"></span>
              </span>
              <span className="font-quicksand font-extrabold text-[#FF7043] uppercase tracking-wider text-[11px]">
                {currentSlideData.badge}
              </span>
            </motion.div>

            {/* Interactive Program Tabs (Clickable to switch themes on hero!) */}
            <div className="flex items-center gap-1.5 p-1 bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-full shadow-xs overflow-x-auto max-w-full">
              {heroSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-quicksand transition-all duration-300 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeSlide === idx
                      ? 'bg-gradient-to-r ' + slide.btnGrad + ' text-white shadow-md scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <span>{slide.programTab}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeSlide === idx ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {slide.age}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Main Hero Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Typography, Shimmer Title & Action Row */}
            <div className="lg:col-span-6 space-y-6 text-left relative z-10">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlide}
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Subtle Top Kicker */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold font-quicksand uppercase tracking-wider bg-white border border-slate-200/70 shadow-2xs text-[#7C3AED]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-current" />
                    <span>Best Kindergarten & Early Learning</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-slate-900 font-extrabold leading-[1.12] font-quicksand tracking-tight">
                    {currentSlideData.title} <br />
                    <span className={`bg-clip-text text-transparent bg-gradient-to-r ${currentSlideData.themeGrad}`}>
                      {currentSlideData.highlight}
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                    {currentSlideData.subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Action Buttons Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                {/* Primary Glowing Action Button */}
                <Link
                  to="/contact"
                  className="group relative inline-flex items-center justify-center space-x-2.5 font-quicksand font-extrabold text-sm sm:text-base text-white px-8 py-4 rounded-2xl bg-gradient-to-r from-[#FF7043] via-[#FF8A65] to-[#FFA000] shadow-[0_10px_25px_rgba(255,112,67,0.38)] hover:shadow-[0_14px_32px_rgba(255,112,67,0.48)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-center overflow-hidden"
                >
                  {/* Shimmer sweep effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <Sparkles className="w-4 h-4 text-amber-200 fill-current" />
                  <span>BOOK A CAMPUS TOUR</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Secondary Video / Campus Tour Trigger */}
                <button
                  type="button"
                  onClick={() => setShowVideoModal(true)}
                  className="inline-flex items-center justify-center space-x-2.5 font-quicksand font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 px-6 py-4 rounded-2xl border-2 border-slate-200/90 shadow-sm hover:shadow transition-all text-center cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-full bg-[#EAE8FC] text-[#7C3AED] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                  <span>WATCH 1-MIN TOUR</span>
                </button>
              </div>

              {/* Trust Metric Badges */}
              <div className="pt-5 border-t border-slate-200/70 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-orange-100/80 shadow-xs hover:border-[#FF7043]/30 transition-all">
                  <p className="text-lg font-black text-slate-800 font-quicksand">8:1</p>
                  <p className="text-[11px] text-slate-500 font-semibold leading-tight mt-0.5">Student Ratio</p>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-orange-100/80 shadow-xs hover:border-[#10B981]/30 transition-all">
                  <p className="text-lg font-black text-emerald-600 font-quicksand">100%</p>
                  <p className="text-[11px] text-slate-500 font-semibold leading-tight mt-0.5">CCTV Monitored</p>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-orange-100/80 shadow-xs hover:border-[#F59E0B]/30 transition-all">
                  <p className="text-lg font-black text-amber-500 font-quicksand">4.9 ★</p>
                  <p className="text-[11px] text-slate-500 font-semibold leading-tight mt-0.5">Parent Rating</p>
                </div>
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-orange-100/80 shadow-xs hover:border-[#7C3AED]/30 transition-all">
                  <p className="text-lg font-black text-[#7C3AED] font-quicksand">500+</p>
                  <p className="text-[11px] text-slate-500 font-semibold leading-tight mt-0.5">Happy Little Kids</p>
                </div>
              </div>

            </div>

            {/* Right Column: Multi-Cutout Sliced Layered Visual Showcase */}
            <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
              
              <div className="relative w-full max-w-[500px]">
                
                {/* Layered Paper-Cut Decorative Blobs */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FF7043]/30 via-[#FEF3C7]/40 to-[#A78BFA]/30 rounded-[3rem] rotate-3 transform scale-105 blur-md pointer-events-none" />
                <div className="absolute inset-0 bg-white/80 rounded-[3rem] -rotate-2 border-2 border-orange-100 shadow-lg pointer-events-none" />

                {/* Main Hero Card Container with Cutout Effect */}
                <div className="relative z-10 overflow-hidden rounded-[2.5rem] border-4 border-white shadow-2xl bg-white aspect-[4/3] sm:aspect-[16/11]">
                  
                  {/* Sliced Photo Transition */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide}
                      className="absolute inset-0 w-full h-full"
                      initial={{ opacity: 0, scale: 1.1 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <img
                        src={currentSlideData.mainImage}
                        alt="Apna School Kindergarten Moments"
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/20" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Corner Cutout Admission Ribbon */}
                  <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none overflow-hidden z-20">
                    <div className="absolute transform rotate-45 bg-gradient-to-r from-[#FF7043] to-[#FFA000] text-white text-[10px] font-black font-quicksand py-1.5 right-[-35px] top-[22px] w-[140px] text-center shadow-lg uppercase tracking-wider">
                      ADMISSION 2026
                    </div>
                  </div>

                  {/* Top Floating Badge with Social Proof Avatars */}
                  <motion.div
                    key={`badgeTop-${activeSlide}`}
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 120 }}
                    className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-white/90 flex items-center space-x-2.5 z-20"
                  >
                    <div className="flex -space-x-2 overflow-hidden">
                      <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80" alt="Parent" />
                      <img className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80" alt="Parent" />
                      <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[9px] flex items-center justify-center ring-2 ring-white">★</div>
                    </div>
                    <div>
                      <p className="text-xs font-black font-quicksand text-slate-800 leading-tight">
                        {currentSlideData.badgeTop.text}
                      </p>
                      <p className="text-[9.5px] font-semibold text-slate-500 leading-none mt-0.5">
                        {currentSlideData.badgeTop.sub}
                      </p>
                    </div>
                  </motion.div>

                  {/* Bottom Floating Badge */}
                  <motion.div
                    key={`badgeBottom-${activeSlide}`}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25, type: 'spring', stiffness: 120 }}
                    className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-white/90 flex items-center space-x-2.5 z-20"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-inner">
                      🌱
                    </div>
                    <div>
                      <p className="text-xs font-black font-quicksand text-slate-800 leading-tight">
                        {currentSlideData.badgeBottom.text}
                      </p>
                      <p className="text-[9.5px] font-semibold text-slate-500 leading-none mt-0.5">
                        {currentSlideData.badgeBottom.sub}
                      </p>
                    </div>
                  </motion.div>

                  {/* Secondary Circular Lens Cutout (Overlapping Bottom Right) */}
                  <motion.div
                    key={`lens-${activeSlide}`}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 140 }}
                    className="hidden sm:block absolute bottom-3 right-3 w-20 h-20 rounded-full border-3 border-white shadow-2xl overflow-hidden z-20"
                  >
                    <img
                      src={currentSlideData.secondaryImage}
                      alt="Kindergarten Activity"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  {/* Floating 3D Emoji 1 */}
                  <motion.div
                    animate={{ y: [0, -10, 0], rotate: [0, 8, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                    className="absolute top-1/2 -right-3 w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-white flex items-center justify-center text-2xl z-20 select-none"
                  >
                    {currentSlideData.floatingEmoji}
                  </motion.div>

                  {/* Floating 3D Emoji 2 */}
                  <motion.div
                    animate={{ y: [0, 8, 0], rotate: [0, -6, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                    className="absolute -top-3 left-1/2 w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl border border-white flex items-center justify-center text-lg z-20 select-none"
                  >
                    {currentSlideData.floatingEmoji2}
                  </motion.div>

                  {/* Slide Prev/Next Arrows */}
                  <div className="absolute inset-y-0 left-2 right-2 flex items-center justify-between pointer-events-none z-30">
                    <button
                      onClick={handlePrevSlide}
                      className="pointer-events-auto w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#FF7043] flex items-center justify-center shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                      aria-label="Previous Slide"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleNextSlide}
                      className="pointer-events-auto w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-[#FF7043] flex items-center justify-center shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                      aria-label="Next Slide"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                </div>

                {/* Progress Indicators & Slide Counter */}
                <div className="flex items-center justify-between mt-4 px-3">
                  <div className="flex items-center space-x-2">
                    {heroSlides.map((slide, idx) => (
                      <button
                        key={slide.id}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                          activeSlide === idx
                            ? 'w-9 bg-gradient-to-r from-[#FF7043] to-[#FFA000] shadow-sm'
                            : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <span className="text-xs font-extrabold font-quicksand text-slate-500">
                    0{activeSlide + 1} <span className="text-slate-300 font-normal">/</span> 0{heroSlides.length}
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* VIDEO TOUR MODAL POPUP */}
      <AnimatePresence>
        {showVideoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl border-4 border-white"
            >
              <div className="p-4 bg-gradient-to-r from-[#FF7043] to-[#FFA000] text-white flex items-center justify-between">
                <div className="flex items-center space-x-2 font-quicksand font-bold">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Welcome to Apna School Kindergarten Life</span>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                  <img
                    src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=900"
                    alt="Campus Virtual Tour"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center p-4 space-y-3">
                    <div className="w-16 h-16 rounded-full bg-white text-[#FF7043] flex items-center justify-center shadow-xl animate-pulse">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                    <p className="font-quicksand font-bold text-sm">Experience our joyful classrooms, sensory garden & active play zones!</p>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                  <p className="text-xs text-slate-500 font-medium">Want to visit in person? Our counselors are available 6 days a week.</p>
                  <Link
                    to="/contact"
                    onClick={() => setShowVideoModal(false)}
                    className="font-quicksand font-bold text-xs bg-[#FF7043] hover:bg-[#E65100] text-white px-5 py-2.5 rounded-full shadow-md transition-all"
                  >
                    Schedule Physical Visit →
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. HIGHLIGHTS GRID */}
      <section className="bg-white py-12 px-4 md:px-8 border-y border-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {highlights.map((hl, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="bg-[#FAF8F5] border border-orange-50 hover:border-brandCoral/20 hover:shadow-md rounded-2xl p-6 text-center shadow-sm space-y-3 flex flex-col items-center transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border shadow-inner ${hl.color}`}>
                  <hl.icon className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="font-quicksand font-bold text-sm text-slate-800 leading-snug">{hl.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{hl.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. WELCOME SECTION */}
      <section className="py-16 px-4 md:px-8 bg-brandCream-light">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-5">
            <span className="font-quicksand font-bold text-xs text-brandCoral tracking-widest uppercase">Welcome to Apna School</span>
            <h2 className="text-3xl md:text-4xl text-slate-800 font-extrabold leading-tight">
              Where Every Child Feels <br />Seen, Heard, and Valued ❤️
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              At Apna School, we believe every child is unique. Our program syllabus is custom-tailored to inspire a lifelong love of learning while building confidence, social collaboration skills, and natural emotional intelligence.
            </p>
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-brandMint" />
                <span>Modern CCTV security coverage in all rooms</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-brandMint" />
                <span>Freshly cooked nutritious hot meals provided</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-brandMint" />
                <span>Daily interactive logs shared via Parent Portal</span>
              </div>
            </div>
            <div className="pt-4">
              <Link
                to="/about"
                className="inline-flex items-center space-x-1 font-quicksand font-bold text-sm bg-white hover:bg-orange-50/50 text-slate-700 border border-orange-100 shadow-sm px-6 py-2.5 rounded-full transition-all"
              >
                <span>LEARN MORE ABOUT US</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Right Photo Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img
                src="https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=500"
                alt="Toddlers playing block games"
                className="w-full h-[220px] object-cover rounded-2xl shadow-md"
              />
              <div className="bg-brandYellow/10 border border-brandYellow/30 p-4 rounded-2xl text-center space-y-1">
                <h4 className="font-quicksand font-bold text-brandYellow-dark text-lg">1:8 Ratio</h4>
                <p className="text-xs text-slate-600">Teacher to child ensures personalized coaching</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="bg-brandSky/10 border border-brandSky/30 p-4 rounded-2xl text-center space-y-1">
                <h4 className="font-quicksand font-bold text-brandSky-dark text-lg">A+ Smart Labs</h4>
                <p className="text-xs text-slate-600">Smart screens and play boards for tech exploration</p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=500"
                alt="Kids playing arts"
                className="w-full h-[220px] object-cover rounded-2xl shadow-md"
              />
            </div>
          </div>

        </div>
      </section>

      {/* 4. PROGRAMS PREVIEW */}
      <section className="py-16 bg-white px-4 md:px-8 border-t border-orange-50">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <span className="font-quicksand font-bold text-xs text-brandSky-dark tracking-widest uppercase">Our Programs</span>
          <h2 className="text-3xl md:text-4xl text-slate-800 font-extrabold">Programs for Every Stage of Growth</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Explore our thoughtfully curated academic tracks designed to grow as your child's capabilities expand.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 text-left">
            {programs.map((prog, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -8, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`border rounded-3xl p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${prog.color}`}
              >
                <div className="space-y-3">
                  <span className="font-bold text-xs tracking-wider">{prog.name}</span>
                  <h3 className="font-quicksand font-extrabold text-xl text-slate-800 leading-tight">{prog.age}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{prog.text}</p>
                </div>
                <div className="pt-6">
                  <Link
                    to="/programs"
                    className="inline-flex items-center space-x-1 text-xs font-bold font-quicksand hover:underline"
                  >
                    <span>LEARN MORE</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. ANNOUNCEMENTS DRAWER */}
      {announcements.length > 0 && (
        <section className="bg-orange-50/50 py-12 px-4 md:px-8 border-y border-orange-100">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-quicksand font-bold text-xl text-slate-800 flex items-center space-x-2">
                <Bell className="w-5 h-5 text-brandCoral animate-bounce" />
                <span>Latest Announcements</span>
              </h3>
              <Link to="/calendar" className="text-xs font-bold text-brandCoral hover:underline font-quicksand">
                VIEW ALL NOTICE BOARD →
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  className="bg-white border border-orange-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                >
                  <div>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block mb-1 ${
                      ann.category === 'emergency' ? 'bg-red-50 text-red-600 border border-red-100' :
                      ann.category === 'circular' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      'bg-orange-50 text-orange-600 border border-orange-100'
                    }`}>
                      {ann.category}
                    </span>
                    <h4 className="font-quicksand font-bold text-slate-800 text-sm">{ann.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{ann.content}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                    {new Date(ann.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. TESTIMONIAL & CTA BANNER */}
      <section className="py-16 px-4 md:px-8 bg-brandCream-light">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Testimonial */}
          <div className="lg:col-span-6 bg-white border border-orange-50 rounded-3xl p-8 flex flex-col justify-between shadow-md">
            <div className="space-y-4">
              <span className="text-4xl text-brandYellow-dark font-serif">“</span>
              <p className="text-sm md:text-base italic text-slate-600 leading-relaxed font-medium">
                Apna School has been the best decision for our family. The teachers truly care and our child looks forward to school every single day! The Parent Portal updates (with photos and nap records) keep us totally connected.
              </p>
            </div>
            
            <div className="flex items-center space-x-3 pt-6 border-t border-orange-50">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
                alt="Sarah Jenkins Parent"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h4 className="font-quicksand font-bold text-slate-800 text-sm">Sarah Jenkins</h4>
                <p className="text-[10px] text-slate-500 font-medium">Mother of Tommy Jenkins (Preschool)</p>
              </div>
            </div>
          </div>

          {/* CTA Banner */}
          <div className="lg:col-span-6 bg-gradient-to-r from-[#9F92EC] to-[#A78BFA] text-white rounded-[2rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden border-4 border-white">
            {/* Background shape */}
            <div className="absolute bottom-[-20px] right-[-20px] w-40 h-40 bg-white/20 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <h3 className="font-quicksand font-extrabold text-3xl md:text-4xl leading-tight">Ready to Get Started?</h3>
              <p className="text-sm text-purple-100 max-w-sm leading-relaxed font-semibold">
                We would love to welcome you and your child to our school family. Book a personalized private tour or apply today.
              </p>
            </div>

            <div className="pt-8 relative z-10">
              <Link
                to="/contact"
                className="font-quicksand font-bold text-sm bg-brandYellow hover:bg-brandYellow-dark text-slate-800 px-6 py-3 rounded-full transition-all inline-block shadow-md hover:shadow-lg"
              >
                BOOK A TOUR TODAY →
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 7. QUICK ADVANTAGES FOOTER BAR */}
      <section className="bg-white py-8 border-t border-orange-50 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-around gap-6 text-slate-500 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4 text-brandCoral fill-current" />
            <span>Clean, Safe & Secure environment</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-brandYellow-dark fill-current" />
            <span>Nutritious Meals provided daily</span>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-brandSky" />
            <span>Daily updates sent to parents</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-brandMint" />
            <span>Flexible pick-up timetables</span>
          </div>
        </div>
      </section>

    </div>
  );
}
