import React, { useRef } from 'react';
import { Printer, X, Phone, Award } from 'lucide-react';

export default function StudentIdCardModal({ student, onClose }) {
  const cardRef = useRef(null);

  if (!student) return null;

  // Formatting helper for Date of Birth (DD/MM/YYYY)
  const formatDob = (dob) => {
    if (!dob) return '15/01/2021';
    try {
      const d = new Date(dob);
      if (isNaN(d.getTime())) return '15/01/2021';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '15/01/2021';
    }
  };

  // Resolve father & mother names
  const fatherName =
    student.fatherName ||
    student.parentId?.fatherName ||
    student.parentDetails?.fatherName ||
    (student.parentId?.name && !student.parentId?.name.toLowerCase().startsWith('mrs') ? student.parentId?.name : '') ||
    'Mr. Rajesh Kumar';

  const motherName =
    student.motherName ||
    student.parentId?.motherName ||
    student.parentDetails?.motherName ||
    'Mrs. Sunita Kumar';

  const mobileNo =
    student.phone ||
    student.parentId?.phone ||
    student.parentDetails?.phone ||
    '9876543210';

  const address =
    student.address ||
    student.parentId?.address ||
    student.parentDetails?.address ||
    'Main Road, City Center';

  const studentPhoto =
    student.photo ||
    (student.gender === 'Female'
      ? 'https://images.unsplash.com/photo-1595454223600-91fbdd77ae58?w=300'
      : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300');

  const currentYear = new Date().getFullYear();
  const sessionString = `${currentYear}-${String(currentYear + 1).slice(-2)}`;

  // Dedicated print trigger that prints the exact live rendered DOM element with 100% color & style fidelity
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print Stylesheet to guarantee exact colors, borders, SVGs, and real card dimensions in print */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          /* Hide all surrounding app chrome, header, sidebars, and modals */
          body * {
            visibility: hidden !important;
          }
          /* Show ONLY the printable ID card root */
          #printable-id-card-root,
          #printable-id-card-root * {
            visibility: visible !important;
          }
          #printable-id-card-root {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 99999999 !important;
          }
          /* Strip screen shadow and keep crisp real-card border */
          .id-card-holder-box {
            box-shadow: none !important;
            border: 3px solid #cbd5e1 !important;
            background-color: #f8fafc !important;
          }
          .no-print-element {
            display: none !important;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-transparent print:static print:inset-auto">
        <div className="relative w-full max-w-md bg-white border-[5px] border-white rounded-[2.5rem] p-4 sm:p-6 shadow-2xl space-y-4 my-auto print:border-none print:shadow-none print:p-0 print:m-0">
          
          {/* Modal Top Bar (Hidden on print) */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 no-print-element">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-quicksand font-bold text-slate-800 text-sm">Official Student ID Card</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* LANYARD BADGE CASING & INNER CARD CONTAINER */}
          <div id="printable-id-card-root" className="flex justify-center">
            <div
              ref={cardRef}
              className="id-card-holder-box w-[320px] sm:w-[340px] rounded-[2rem] border-[4px] border-slate-300 shadow-2xl relative p-3 pt-4 select-none overflow-hidden"
              style={{
                backgroundColor: '#ffffff',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.9)'
              }}
            >
              {/* Lanyard Punch Slot Hole */}
              <div
                className="w-16 h-3.5 mx-auto mb-2 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: '#e2e8f0',
                  border: '1px solid #cbd5e1'
                }}
              >
                <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: '#94a3b8' }}></div>
              </div>

              {/* Inner ID Card Body */}
              <div
                className="relative rounded-[1.5rem] overflow-hidden"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                }}
              >
                
                {/* Subtle Geometric Background Watermark */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.04]"
                  style={{
                    backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
                    backgroundSize: '12px 12px'
                  }}
                ></div>

                {/* Top-Right Red Session Pill */}
                <div className="absolute top-2 right-2 z-20">
                  <span
                    className="font-extrabold text-[9px] px-2.5 py-0.5 rounded-sm shadow-sm tracking-wider uppercase inline-block"
                    style={{
                      backgroundColor: '#B91C1C',
                      color: '#ffffff'
                    }}
                  >
                    {sessionString}
                  </span>
                </div>

                {/* Top-Right Origami Paper Plane Graphic */}
                <div className="absolute top-7 right-3 z-10 select-none pointer-events-none">
                  <svg width="46" height="38" viewBox="0 0 46 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M44 2L2 22L18 26L44 2Z" fill="#FACC15" stroke="#EAB308" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M44 2L26 36L18 26L44 2Z" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M18 26L26 36L24 28L18 26Z" fill="#0369A1" />
                  </svg>
                </div>

                {/* Top-Center School Emblem & Name Header */}
                <div className="pt-3 pb-2 px-3 text-center relative z-10 flex flex-col items-center">
                  
                  {/* Circular Gold Seal Emblem */}
                  <div
                    className="w-16 h-16 rounded-full p-0.5 shadow-md flex items-center justify-center relative mb-1.5"
                    style={{
                      background: 'linear-gradient(to bottom, #fef3c7, #fde68a)',
                      border: '2px solid #D4AF37'
                    }}
                  >
                    <div
                      className="w-full h-full rounded-full flex flex-col items-center justify-center"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #fbbf24'
                      }}
                    >
                      <Award className="w-6 h-6" style={{ color: '#9A3412' }} />
                      <span
                        className="text-[5.5px] font-black uppercase tracking-tighter leading-none mt-0.5"
                        style={{ color: '#9A3412' }}
                      >
                        EXCELLENCE
                      </span>
                    </div>
                  </div>

                  {/* Main School Heading */}
                  <h2
                    className="text-[20px] font-black tracking-tight uppercase leading-tight"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      color: '#881337'
                    }}
                  >
                    APNA SCHOOL
                  </h2>

                  {/* Subtitle Location */}
                  <p
                    className="text-[10px] font-extrabold tracking-wide uppercase leading-none mt-0.5"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      color: '#0369A1'
                    }}
                  >
                    CAMPUS EXCELLENCE HUB (C.G.)
                  </p>
                </div>

                {/* Student Portrait Photograph */}
                <div className="flex justify-center relative z-10 mt-1">
                  <div
                    className="w-[110px] h-[125px] rounded-2xl p-1 shadow-md overflow-hidden flex items-center justify-center"
                    style={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #cbd5e1'
                    }}
                  >
                    <img
                      src={studentPhoto}
                      alt={student.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                </div>

                {/* Student Name */}
                <div className="text-center mt-2 px-2 relative z-10">
                  <h3
                    className="text-[15px] font-black uppercase tracking-wide leading-tight"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      color: '#1D4ED8'
                    }}
                  >
                    {student.name}
                  </h3>

                  {/* Class Badge */}
                  <div className="inline-block mt-1">
                    <span
                      className="font-extrabold text-[11px] px-4 py-0.5 rounded-md shadow-sm uppercase tracking-wider inline-block"
                      style={{
                        backgroundColor: '#881337',
                        color: '#ffffff'
                      }}
                    >
                      CLASS – {student.class}
                    </span>
                  </div>
                </div>

                {/* Student Information Details Table */}
                <div className="px-5 py-3 text-[10px] relative z-10 font-bold" style={{ color: '#1e293b' }}>
                  <table className="w-full border-collapse">
                    <tbody>
                      <tr className="align-middle">
                        <td className="w-[85px] py-1 font-extrabold" style={{ color: '#334155' }}>Father Name</td>
                        <td className="w-[15px] py-1 text-center font-extrabold" style={{ color: '#b45309' }}>-</td>
                        <td className="py-1 font-bold font-sans truncate" style={{ color: '#0f172a' }}>{fatherName}</td>
                      </tr>
                      <tr className="align-middle">
                        <td className="py-1 font-extrabold" style={{ color: '#334155' }}>Mother Name</td>
                        <td className="py-1 text-center font-extrabold" style={{ color: '#b45309' }}>-</td>
                        <td className="py-1 font-bold font-sans truncate" style={{ color: '#0f172a' }}>{motherName}</td>
                      </tr>
                      <tr className="align-middle">
                        <td className="py-1 font-extrabold" style={{ color: '#334155' }}>Date of Birth</td>
                        <td className="py-1 text-center font-extrabold" style={{ color: '#b45309' }}>-</td>
                        <td className="py-1 font-bold font-mono" style={{ color: '#0f172a' }}>{formatDob(student.dateOfBirth)}</td>
                      </tr>
                      <tr className="align-middle">
                        <td className="py-1 font-extrabold" style={{ color: '#334155' }}>Mobile No.</td>
                        <td className="py-1 text-center font-extrabold" style={{ color: '#b45309' }}>-</td>
                        <td className="py-1 font-bold font-mono" style={{ color: '#0f172a' }}>{mobileNo}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="py-1 font-extrabold" style={{ color: '#334155' }}>Address</td>
                        <td className="py-1 text-center font-extrabold" style={{ color: '#b45309' }}>-</td>
                        <td className="py-1 font-bold font-sans leading-tight text-[9.5px]" style={{ color: '#0f172a' }}>
                          {address}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* CARD FOOTER WITH PRINCIPAL SIGNATURE, PHONE PILL & RED FLUID ACCENTS */}
                <div
                  className="relative pt-2 pb-3 px-4 mt-1 flex items-center justify-between overflow-hidden"
                  style={{
                    backgroundColor: '#f8fafc',
                    borderTop: '1px solid #f1f5f9'
                  }}
                >
                  
                  {/* Background Dynamic Red Ribbon Graphic */}
                  <div className="absolute right-0 bottom-0 pointer-events-none z-0">
                    <svg width="110" height="48" viewBox="0 0 110 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 48L110 0V48H20Z" fill="#991B1B" />
                      <path d="M0 48L110 14V48H0Z" fill="#DC2626" opacity="0.8" />
                      <circle cx="85" cy="20" r="1.5" fill="white" opacity="0.6" />
                      <circle cx="95" cy="15" r="1.5" fill="white" opacity="0.6" />
                      <circle cx="75" cy="25" r="1.5" fill="white" opacity="0.6" />
                    </svg>
                  </div>

                  {/* Principal Signature */}
                  <div className="flex flex-col items-center relative z-10 pl-1">
                    <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4 14C12 6 22 2 28 8C34 14 42 12 56 4M10 16L40 7" stroke="#0369a1" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <span
                      className="text-[6.5px] font-black uppercase tracking-widest leading-none mt-0.5"
                      style={{ color: '#64748b' }}
                    >
                      PRINCIPAL
                    </span>
                  </div>

                  {/* Gold School Phone Pill */}
                  <div
                    className="relative z-10 font-extrabold text-[11px] px-3 py-1 rounded-full shadow-sm flex items-center space-x-1.5"
                    style={{
                      background: 'linear-gradient(to right, #f59e0b, #d97706)',
                      color: '#ffffff',
                      border: '1px solid #fcd34d'
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                    >
                      <Phone className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-mono tracking-tight">{mobileNo}</span>
                  </div>

                </div>

              </div>
            </div>
          </div>

          {/* Modal Action Buttons (Hidden on print) */}
          <div className="flex items-center gap-3 pt-2 no-print-element">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-quicksand font-bold text-xs shadow flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT OFFICIAL ID CARD</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-quicksand font-bold text-xs cursor-pointer transition-all active:scale-[0.98]"
            >
              CLOSE
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
