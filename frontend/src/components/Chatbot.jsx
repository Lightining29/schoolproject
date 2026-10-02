import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, PhoneCall, Calendar, CreditCard, BookOpen, Trash2, ArrowRight } from 'lucide-react';

const KNOWLEDGE_BASE = [
  {
    keywords: ['admission', 'apply', 'enroll', 'age', 'criteria', 'document', 'birth certificate'],
    answer: `**Admissions for Academic Year 2026-27 are currently open!**\n\n- **Classes**: Pre-Nursery, Nursery, Junior KG, Senior KG, and 1st to 8th Standard.\n- **Age Criteria**: Minimum 3+ years for Nursery, 4+ for Junior KG as of June 1st.\n- **Required Documents**:\n  1. Child's Birth Certificate\n  2. Passport-size Photographs\n  3. Parents' Aadhaar Cards\n  4. Previous Report Card / Transfer Certificate (for Grade 1+)\n\nYou can fill the online application directly from the **Admissions** page!`
  },
  {
    keywords: ['fee', 'fees', 'cost', 'tuition', 'charge', 'pay', 'cash', 'installment'],
    answer: `**School Fee Structure Overview (Monthly/Term):**\n\n- **Pre-Nursery & Nursery**: Approx. ₹1,200 – ₹1,250/mo\n- **Junior & Senior KG**: Approx. ₹1,400 – ₹1,500/mo\n- **1st to 4th Standard**: Approx. ₹1,800 – ₹2,100/mo\n- **5th to 8th Standard**: Approx. ₹2,200 – ₹2,500/mo\n\n*Cash payments can be paid directly at the school Admission Desk with an immediate computer-generated official receipt.*`
  },
  {
    keywords: ['timing', 'hours', 'time', 'schedule', 'open', 'close'],
    answer: `**School Timings:**\n\n- **Kindergarten (Nursery/KG)**: 8:30 AM to 12:30 PM (Mon – Fri)\n- **Primary & Middle School (1st to 8th)**: 8:00 AM to 2:00 PM (Mon – Sat)\n- **Admin & Accounts Office**: 8:00 AM to 3:30 PM daily.`
  },
  {
    keywords: ['facility', 'facilities', 'bus', 'transport', 'smart class', 'playground', 'safety', 'cctv'],
    answer: `**Campus Highlights & Facilities:**\n\n- **Smart Classrooms**: Interactive digital touch boards and visual learning kits.\n- **Safety & Security**: 24/7 CCTV surveillance across all corridors and play areas.\n- **Transport**: GPS-tracked buses with verified female attendants.\n- **Activity Studios**: Dedicated dance, painting, music, and indoor play zones.`
  },
  {
    keywords: ['event', 'events', 'holiday', 'calendar', 'ptm', 'summer camp', 'celebration'],
    answer: `**Upcoming School Events:**\n\n- **Parent-Teacher Meeting (PTM)**: Scheduled second Saturday of the month.\n- **Summer Camp Kickoff**: Outdoor games, theater, and science workshops.\n- **National Holidays**: Full calendar details are available on our **Calendar** page.`
  },
  {
    keywords: ['contact', 'phone', 'call', 'email', 'address', 'principal', 'location', 'office'],
    answer: `**Contact Apna School Administration:**\n\n- **Phone**: +91 98765 43210 / (011) 2345-6789\n- **Email**: info@apnaschool.edu\n- **Address**: 742 Evergreen Campus, Educational Enclave, City Center.\n- **Visiting Hours**: 9:00 AM to 1:00 PM with prior appointment.`
  }
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! 👋 I am Apna School's AI Assistant. How can I help you today with admissions, fees, timings, or events?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQueryPrompt, setShowQueryPrompt] = useState(false);
  const [ticketStatus, setTicketStatus] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let matchedAnswer = null;

      for (const item of KNOWLEDGE_BASE) {
        if (item.keywords.some(k => lower.includes(k))) {
          matchedAnswer = item.answer;
          break;
        }
      }

      if (!matchedAnswer) {
        matchedAnswer = `Thank you for your question! For specific student records or custom requests, our admin team is happy to assist you directly.\n\nWould you like me to create an inquiry ticket for our office desk to contact you?`;
        setShowQueryPrompt(true);
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: matchedAnswer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  const handleQuickSubmitTicket = async () => {
    setTicketStatus('sending');
    try {
      const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || 'Inquiry via AI Chatbot';
      const res = await fetch('/api/public/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Portal Visitor (AI Chat)',
          email: 'visitor@chat.school',
          subject: 'AI Chatbot Inquiry Ticket',
          message: lastUserMsg
        })
      });
      const data = await res.json();
      if (data.success) {
        setTicketStatus('sent');
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: `✅ **Inquiry Ticket Generated!** Our administration desk has received your note and will review it shortly.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setShowQueryPrompt(false);
      } else {
        setTicketStatus('error');
      }
    } catch {
      setTicketStatus('error');
    }
  };

  const quickPrompts = [
    { label: '🎒 Admissions & Age Rules', prompt: 'Tell me about the admission criteria and required documents.' },
    { label: '💳 School Fee Structure', prompt: 'What are the school fees and payment options?' },
    { label: '⏰ School Timings', prompt: 'What are the daily school timings?' },
    { label: '📅 Events & Holidays', prompt: 'What are the upcoming school calendar events and holidays?' },
    { label: '📞 Contact Details', prompt: 'How can I contact the school office or principal?' }
  ];

  return (
    <>
      {/* Floating Launcher Trigger */}
      <div className="fixed bottom-6 right-6 z-50 select-none print:hidden">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-2.5 bg-black hover:bg-slate-900 text-white px-4 py-3 rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 border border-white/20 cursor-pointer group"
            title="Chat with Apna School Assistant"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="text-left pr-1 hidden sm:block">
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider leading-tight">Need Help?</p>
              <p className="text-xs font-black font-quicksand leading-tight text-white flex items-center gap-1">
                Ask School AI <Sparkles className="w-3 h-3 text-amber-300 inline" />
              </p>
            </div>
          </button>
        )}
      </div>

      {/* Modern Chatbot Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[92vw] sm:w-[400px] h-[580px] max-h-[85vh] bg-white rounded-[2rem] shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 select-none">
          
          {/* Header */}
          <div className="bg-black text-white px-5 py-4 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-quicksand font-bold text-sm text-white flex items-center gap-1.5 leading-tight">
                  Apna School AI <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                </h3>
                <p className="text-[10px] font-semibold text-slate-400 leading-tight">Online • Instant 24/7 Answers</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setMessages([{
                  sender: 'bot',
                  text: "Hello! How can I assist you with school admissions, fees, or academics?",
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }])}
                title="Reset Conversation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(qp.prompt)}
                className="px-3 py-1 rounded-full bg-white hover:bg-slate-900 hover:text-white text-slate-700 font-bold border border-slate-200 shrink-0 transition-all cursor-pointer text-[10.5px]"
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-[#FBFBFE]">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    m.sender === 'user' ? 'bg-black text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-black text-white font-medium rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none font-normal'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs">{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1.5 font-mono ${
                      m.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-slate-400 text-[11px] font-semibold pl-9">
                <span className="animate-pulse">School AI is typing</span>
                <span className="inline-flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            )}

            {showQueryPrompt && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs">
                <p className="font-bold text-amber-900">Need admin to follow up with you?</p>
                <button
                  type="button"
                  onClick={handleQuickSubmitTicket}
                  disabled={ticketStatus === 'sending' || ticketStatus === 'sent'}
                  className="w-full py-2 bg-black hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                  <span>{ticketStatus === 'sending' ? 'Submitting...' : ticketStatus === 'sent' ? 'Ticket Submitted!' : 'Submit Inquiry to Office'}</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Ask anything about Apna School..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-black transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-black hover:bg-slate-800 disabled:opacity-40 text-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
