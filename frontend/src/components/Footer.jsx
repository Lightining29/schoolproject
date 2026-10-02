import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Smile, Send } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative pt-16 pb-8 mt-16 border-t-8 bg-brandNavy text-slate-300 border-brandYellow print:hidden">
      {/* Curved Decorative wave at top */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-brandCoral" />

      <div className="grid grid-cols-1 gap-8 px-4 mx-auto max-w-7xl md:px-8 md:grid-cols-2 lg:grid-cols-4">

        {/* Info Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-8 h-8 text-orange-600 rounded-full shadow-inner bg-brandYellow">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-white font-quicksand">Apna School</span>
              <p className="text-[9px] text-brandCoral font-semibold tracking-wider mt-[-2px]">KINDERGARTEN</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Nurturing young minds through play, creativity, and customized childhood education methodologies since 2018.
          </p>
          {/* Quick Inquiry Button */}
          <Link
            to="/contact"
            className="inline-flex items-center space-x-2 font-quicksand font-bold text-xs bg-brandCoral hover:bg-brandCoral-dark text-white px-4 py-2 rounded-full transition-all shadow-md transform hover:-translate-y-0.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Online Inquiry</span>
          </Link>
        </div>

        {/* Quick Links Column */}
        <div className="space-y-4">
          <h4 className="inline-block pb-2 font-bold text-white border-b-2 font-quicksand text-md border-brandCoral/30">Quick Links</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            <li><Link to="/" className="transition-colors hover:text-brandYellow">Home</Link></li>
            <li><Link to="/about" className="transition-colors hover:text-brandYellow">About Us</Link></li>
            <li><Link to="/programs" className="transition-colors hover:text-brandYellow">Programs</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-brandYellow">Contact Desk</Link></li>
            <li><Link to="/facilities" className="transition-colors hover:text-brandYellow">Facilities</Link></li>
            <li><Link to="/gallery" className="transition-colors hover:text-brandYellow">Gallery</Link></li>
            <li><Link to="/calendar" className="transition-colors hover:text-brandYellow">Calendar</Link></li>
            <li><Link to="/fees" className="transition-colors hover:text-brandYellow">Fee Structure</Link></li>
          </ul>
        </div>

        {/* Contact Us Column */}
        <div className="space-y-4">
          <h4 className="inline-block pb-2 font-bold text-white border-b-2 font-quicksand text-md border-brandCoral/30">Contact Us</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-brandYellow shrink-0" />
              <span>info@apnaschool.edu</span>
            </li>
          </ul>
        </div>

        {/* Newsletter / PWA Column */}
        <div className="space-y-4">
          <h4 className="inline-block pb-2 font-bold text-white border-b-2 font-quicksand text-md border-brandCoral/30">Our Motto</h4>
          <p className="text-sm italic text-slate-400">
            "Where little minds do big things. Play. Grow. Learn. Thrive."
          </p>
          <div className="pt-2">
            <span className="inline-block px-3 py-1 text-xs border rounded-full bg-slate-800 text-slate-400 border-slate-700">
              ✓ Accessibility Compliant
            </span>
          </div>
          <div>
            <span className="inline-block px-3 py-1 mt-1 text-xs border rounded-full bg-slate-800 text-slate-400 border-slate-700">
              ✓ Progressive Web App (PWA)
            </span>
          </div>
        </div>

      </div>

      <hr className="mx-auto my-8 border-slate-800 max-w-7xl" />

      {/* Copyright */}
      <div className="flex flex-col items-center justify-between px-4 mx-auto space-y-2 text-xs max-w-7xl md:px-8 md:flex-row text-slate-500 md:space-y-0">
        <p>© {currentYear} Apna School. All rights reserved.</p>
        <p className="flex items-center space-x-1">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-brandCoral fill-current" />
          <span>for early childhood development.</span>
        </p>
      </div>
    </footer>
  );
}
