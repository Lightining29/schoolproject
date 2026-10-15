import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Send, Instagram, Facebook, Youtube } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative pt-16 pb-8 mt-16 border-t-8 bg-brandNavy text-slate-300 border-brandYellow print:hidden">
      {/* Curved Decorative wave at top */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-brandCoral" />

      <div className="grid grid-cols-1 gap-8 px-4 mx-auto max-w-7xl md:px-8 md:grid-cols-2 lg:grid-cols-4">

        {/* Info Column */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-brandYellow shadow-md flex items-center justify-center bg-white shrink-0">
              <img src="/logo.png" alt="The Landmark School Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-lg font-bold text-white font-quicksand capitalize">the landmark school</span>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Nurturing young minds through play, creativity, and customized childhood education methodologies since 2018.
          </p>

          {/* Social Links */}
          <div className="pt-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-quicksand mb-2.5">Follow Us</h5>
            <div className="flex items-center space-x-3">
              <a
                href="https://www.instagram.com/school.landmark?psln=ZGUxMnh1MmY3N2pt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#E4405F] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-110"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://www.facebook.com/share/1KHPnVivNJ/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#1877F2] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-110"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@thelandmarkschool?si=eLDyrx7OoRIS6jMp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-[#FF0000] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-sm hover:scale-110"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Inquiry Button */}
          <div className="pt-1">
            <Link
              to="/contact"
              className="inline-flex items-center space-x-2 font-quicksand font-bold text-xs bg-brandCoral hover:bg-brandCoral-dark text-white px-4 py-2 rounded-full transition-all shadow-md transform hover:-translate-y-0.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Online Inquiry</span>
            </Link>
          </div>
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
            <li className="flex items-start space-x-2.5">
              <Phone className="w-4 h-4 text-brandYellow shrink-0 mt-0.5" />
              <a href="tel:9990290914" className="hover:text-brandYellow transition-colors font-medium">
                +91 99902 90914
              </a>
            </li>
            <li className="flex items-start space-x-2.5">
              <Mail className="w-4 h-4 text-brandYellow shrink-0 mt-0.5" />
              <a href="mailto:thelandmarkschoolgzb@gmail.com" className="hover:text-brandYellow transition-colors break-all font-medium">
                thelandmarkschoolgzb@gmail.com
              </a>
            </li>
            <li className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-brandYellow shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed text-slate-300">
                F-4, f block, F-4 hig, Duplex, Block F, Sector 23, Sanjay Nagar, Ghaziabad, Uttar Pradesh 201017
              </span>
            </li>
          </ul>
        </div>

        {/* Motto & PWA Column */}
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
        <p>© {currentYear} the landmark school. All rights reserved.</p>
        <p className="flex items-center space-x-1">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-brandCoral fill-current" />
          <span>for early childhood development.</span>
        </p>
      </div>
    </footer>
  );
}
