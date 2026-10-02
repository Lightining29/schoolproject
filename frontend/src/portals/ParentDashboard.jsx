import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Smile, Award, Clock, HelpCircle, CreditCard, Clipboard, CheckCircle, FileText, Download, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ResultCardModal from '../components/ResultCardModal.jsx';
import StudentIdCardModal from '../components/StudentIdCardModal.jsx';
import { generateFeeReceiptPDF } from '../utils/pdfReceiptGenerator.js';

export default function ParentDashboard() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [child, setChild] = useState(null);
  
  // Fee states
  const [fees, setFees] = useState([]);
  const [payingFeeId, setPayingFeeId] = useState(null);
  const [activeResultCard, setActiveResultCard] = useState(null);
  const [activeIdCard, setActiveIdCard] = useState(null);

  useEffect(() => {
    // Parent profile children fetch
    if (profile && profile._id) {
      fetch('/api/portal/parent/children', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.children.length > 0) {
            setChild(data.children[0]); // Load first child
            fetchFees(data.children[0]._id);
          }
        })
        .catch(err => console.error(err));
    }
  }, [profile]);

  const fetchFees = (childId) => {
    fetch(`/api/portal/parent/child/${childId}/fees`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFees(data.fees);
        }
      })
      .catch(err => console.error(err));
  };

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'submit',
    onConfirm: () => {}
  });

  const triggerConfirm = (title, message, type, onConfirm) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handlePayFee = (feeId) => {
    triggerConfirm(
      "Are you sure you want to submit?",
      "This will process the tuition fee payment from your portal wallet.",
      "submit",
      async () => {
        setPayingFeeId(feeId);
        try {
          const res = await fetch(`/api/portal/parent/child/${child._id}/pay-fee/${feeId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ paymentMethod: 'Parent Portal Wallet' })
          });
          const data = await res.json();
          setPayingFeeId(null);
          if (data.success) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
            fetchFees(child._id);
          } else {
            alert('Simulated payment failed.');
          }
        } catch (err) {
          console.error(err);
          setPayingFeeId(null);
        }
      }
    );
  };

  const [activeReceipt, setActiveReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Payment modal state (Full vs Partial / Installment)
  const [payModalFee, setPayModalFee] = useState(null);
  const [payType, setPayType] = useState('full'); // 'full' or 'custom'
  const [customPayAmount, setCustomPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('razorpay'); // 'razorpay' or 'wallet'
  const [isProcessingPay, setIsProcessingPay] = useState(false);

  const handleViewReceipt = async (feeId) => {
    setReceiptLoading(true);
    try {
      const res = await fetch(`/api/portal/parent/receipt/${feeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setReceiptLoading(false);
      if (data.success) {
        setActiveReceipt(data);
      } else {
        alert(data.message || 'Receipt not found');
      }
    } catch (err) {
      console.error(err);
      setReceiptLoading(false);
      alert('Error fetching receipt');
    }
  };

  const handleDownloadPDF = async (feeId) => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/portal/parent/receipt/${feeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setDownloadingPdf(false);
      if (data.success) {
        generateFeeReceiptPDF(data);
      } else {
        alert(data.message || 'Could not download receipt');
      }
    } catch (err) {
      console.error(err);
      setDownloadingPdf(false);
      alert('Failed to generate PDF receipt');
    }
  };

  const openPayModal = (fee) => {
    const bal = fee.balanceAmount !== undefined ? fee.balanceAmount : fee.amount;
    setPayModalFee(fee);
    setPayType('full');
    setCustomPayAmount(bal.toString());
    setPayMethod('razorpay');
  };

  const submitPayment = async () => {
    if (!payModalFee) return;
    const balance = payModalFee.balanceAmount !== undefined ? payModalFee.balanceAmount : payModalFee.amount;
    const amountToPay = payType === 'full' ? balance : Number(customPayAmount);

    if (!amountToPay || amountToPay <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }
    if (amountToPay > balance) {
      alert(`Amount cannot exceed the remaining balance of ₹${balance.toLocaleString('en-IN')}`);
      return;
    }

    setIsProcessingPay(true);
    try {
      if (payMethod === 'razorpay') {
        // Step 1: Create Razorpay Order
        const orderRes = await fetch(`/api/portal/parent/create-order/${payModalFee._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ customAmount: amountToPay })
        });
        const orderData = await orderRes.json();

        if (!orderData.success) {
          alert(orderData.message || 'Failed to initiate payment gateway');
          setIsProcessingPay(false);
          return;
        }

        // Step 2: Verify & Record Payment
        const verifyRes = await fetch('/api/portal/parent/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            feeId: payModalFee._id,
            studentId: child._id,
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: `pay_${Date.now()}`,
            razorpay_signature: 'sig_verified_demo',
            paidAmount: amountToPay,
            paymentMethod: 'Razorpay UPI/Cards'
          })
        });

        const verifyData = await verifyRes.json();
        setIsProcessingPay(false);
        setPayModalFee(null);

        if (verifyData.success) {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
          fetchFees(child._id);
          // Automatically trigger receipt modal
          handleViewReceipt(payModalFee._id);
        } else {
          alert(verifyData.message || 'Payment verification failed');
        }
      } else {
        // Direct Portal Wallet / Cash Payment
        const res = await fetch(`/api/portal/parent/child/${child._id}/pay-fee/${payModalFee._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            paymentMethod: 'Parent Portal Wallet',
            customAmount: amountToPay
          })
        });
        const data = await res.json();
        setIsProcessingPay(false);
        setPayModalFee(null);

        if (data.success) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          fetchFees(child._id);
          handleViewReceipt(payModalFee._id);
        } else {
          alert(data.message || 'Payment failed');
        }
      }
    } catch (err) {
      console.error(err);
      setIsProcessingPay(false);
      alert('Error connecting to payment service');
    }
  };



  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-quicksand font-medium">Fetching parent credentials...</p>
      </div>
    );
  }

  // Calculate Attendance Percentage
  const getAttendancePercent = () => {
    if (!child || !child.attendance || child.attendance.length === 0) return 100;
    const presents = child.attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    return Math.round((presents / child.attendance.length) * 100);
  };

  return (
    <div className="clay-bg min-h-screen -m-4 md:-m-8 p-4 md:p-8 space-y-6">
      
      {/* Top Welcome Bar */}
      <div className="clay-card-purple p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brandYellow to-yellow-400 border-4 border-white shadow flex items-center justify-center text-slate-800 text-xl font-bold font-quicksand">
            {profile.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="text-[#9F92EC] font-bold text-xs uppercase tracking-wider block">PARENT HUB</span>
            <h1 className="text-3xl font-quicksand font-bold text-slate-800 leading-tight">Hello, {profile.name}! 👋</h1>
            <p className="text-xs text-slate-500 mt-0.5">Review your child's schedule, daily logs, and teacher notes.</p>
          </div>
        </div>
        {child && (
          <div className="bg-white border-2 border-white/60 px-4 py-3.5 rounded-2xl shadow-sm flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#9F92EC] flex items-center justify-center text-white shrink-0 font-bold font-quicksand">
              {child.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h4 className="font-quicksand font-bold text-xs text-slate-800 leading-none">{child.name}</h4>
              <span className="text-[10px] text-slate-400 font-bold mt-1 inline-block">{child.class} Program</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 clay-sidebar p-6 space-y-2 text-white">
          <div className="flex flex-col items-center pb-4 border-b border-white/20 mb-4 space-y-2">
            <div className="w-16 h-16 rounded-full bg-white/25 border-4 border-white shadow-sm flex items-center justify-center font-bold text-lg font-quicksand text-white">
              PA
            </div>
            <span className="font-quicksand font-bold text-sm text-white block">Hi, Parent! 👋</span>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left font-quicksand font-bold text-xs p-3 flex items-center space-x-3 transition-all ${
              activeTab === 'profile' ? 'clay-sidebar-item-active' : 'rounded-2xl text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Smile className="w-4.5 h-4.5" />
            <span>Child Profile</span>
          </button>
          
          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full text-left font-quicksand font-bold text-xs p-3 flex items-center space-x-3 transition-all ${
              activeTab === 'attendance' ? 'clay-sidebar-item-active' : 'rounded-2xl text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clipboard className="w-4.5 h-4.5" />
            <span>Attendance Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('activities')}
            className={`w-full text-left font-quicksand font-bold text-xs p-3 flex items-center space-x-3 transition-all ${
              activeTab === 'activities' ? 'clay-sidebar-item-active' : 'rounded-2xl text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Clock className="w-4.5 h-4.5" />
            <span>Daily Activities</span>
          </button>

          <button
            onClick={() => setActiveTab('progress')}
            className={`w-full text-left font-quicksand font-bold text-xs p-3 flex items-center space-x-3 transition-all ${
              activeTab === 'progress' ? 'clay-sidebar-item-active' : 'rounded-2xl text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Award className="w-4.5 h-4.5" />
            <span>Progress Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`w-full text-left font-quicksand font-bold text-xs p-3 flex items-center space-x-3 transition-all ${
              activeTab === 'fees' ? 'clay-sidebar-item-active' : 'rounded-2xl text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <CreditCard className="w-4.5 h-4.5" />
            <span>Fee Ledger</span>
          </button>
        </div>

        {/* Contents Column */}
        <div className="lg:col-span-9 clay-card p-6 md:p-8 min-h-[350px]">
          
          {!child ? (
            <div className="text-center py-12">
              <p className="text-xs text-slate-500 font-quicksand">No child student linked to this parent account.</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Child Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-orange-50 pb-3">
                    <h3 className="font-quicksand font-bold text-lg text-slate-800">Student Profile</h3>
                    <button
                      type="button"
                      onClick={() => setActiveIdCard(child)}
                      className="px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-quicksand font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] flex items-center space-x-1.5"
                    >
                      <span>🪪 View Official ID Card</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-500">
                    <p>Name: <span className="text-slate-800">{child.name}</span></p>
                    <p>Date of Birth: <span className="text-slate-800">{new Date(child.dateOfBirth).toLocaleDateString()}</span></p>
                    <p>Gender: <span className="text-slate-800">{child.gender}</span></p>
                    <p>Class: <span className="text-slate-800">{child.class}</span></p>
                    <p>Enrollment Date: <span className="text-slate-800">{new Date(child.createdAt).toLocaleDateString()}</span></p>
                    <p>Class Teacher: <span className="text-slate-800">{child.teacherId?.name || 'Miss Emily Stone'}</span></p>
                  </div>
                </div>
              )}

              {/* Tab 2: Attendance Logs */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-orange-50 pb-3">
                    <h3 className="font-quicksand font-bold text-lg text-slate-800">Attendance Tracker</h3>
                    <span className="text-xs font-bold text-brandCoral">Percentage: {getAttendancePercent()}%</span>
                  </div>
                  
                  {child.attendance && child.attendance.length > 0 ? (
                    <div className="space-y-2">
                      {child.attendance.map((att, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                           <span className="font-bold text-slate-600">{new Date(att.date).toLocaleDateString()}</span>
                           <span className={`px-3 py-1 text-[10px] font-bold uppercase ${
                             att.status === 'present' ? 'clay-badge-blue' : 'clay-badge-pink'
                           }`}>
                             {att.status}
                           </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No attendance logs found yet.</p>
                  )}
                </div>
              )}

              {/* Tab 3: Daily Activities */}
              {activeTab === 'activities' && (
                <div className="space-y-6">
                  <h3 className="font-quicksand font-bold text-lg text-slate-800 border-b border-orange-50 pb-3">Daily Activity Log</h3>
                  {child.activities && child.activities.length > 0 ? (
                    <div className="space-y-4">
                      {child.activities.map((act, idx) => (
                        <div key={idx} className="bg-brandCream border border-orange-100 p-4 rounded-2xl text-xs space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-brandCoral uppercase tracking-wider text-[10px]">{act.category}</span>
                            <span className="text-slate-400">{act.time}</span>
                          </div>
                          <h4 className="font-quicksand font-bold text-slate-800 text-sm">{act.title}</h4>
                          <p className="text-slate-600 leading-relaxed font-medium">{act.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No activity logs recorded for today.</p>
                  )}
                </div>
              )}

              {/* Tab 4: Progress Reports */}
              {activeTab === 'progress' && (
                <div className="space-y-6">
                  <h3 className="font-quicksand font-bold text-lg text-slate-800 border-b border-orange-50 pb-3">Evaluation Progress Cards</h3>
                  {child.progressReports && child.progressReports.length > 0 ? (
                    <div className="space-y-4">
                      {child.progressReports.map((rep, idx) => {
                        const total = Number(rep.cognitive) + Number(rep.social) + Number(rep.creative) + Number(rep.motorSkills);
                        const percentage = (total / 4).toFixed(1);
                        return (
                          <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
                            <div className="flex justify-between items-center border-b border-slate-50 pb-2.5">
                              <div>
                                <h4 className="font-quicksand font-bold text-slate-800 text-sm">{rep.term}</h4>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Student: {child.name} | Class: {child.class}</p>
                              </div>
                              <span className="text-[10px] bg-[#EAE8FC] text-[#7C3AED] font-bold px-3 py-0.5 rounded-full">Official Report Card</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                              <div className="bg-slate-50 border p-3 rounded-xl space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">English</span>
                                <span className="text-base font-extrabold text-slate-800">{rep.cognitive} / 100</span>
                              </div>
                              <div className="bg-slate-50 border p-3 rounded-xl space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Mathematics</span>
                                <span className="text-base font-extrabold text-slate-800">{rep.social} / 100</span>
                              </div>
                              <div className="bg-slate-50 border p-3 rounded-xl space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Science</span>
                                <span className="text-base font-extrabold text-slate-800">{rep.creative} / 100</span>
                              </div>
                              <div className="bg-slate-50 border p-3 rounded-xl space-y-0.5">
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Arts & Crafts</span>
                                <span className="text-base font-extrabold text-slate-800">{rep.motorSkills} / 100</span>
                              </div>
                            </div>

                            {/* Summary Metrics */}
                            <div className="grid grid-cols-2 gap-4 text-center pt-1">
                              <div className="bg-[#E0F2FE] p-3 rounded-xl border border-sky-100">
                                <span className="text-[9px] font-bold text-sky-600 block uppercase">Total Score</span>
                                <span className="text-base font-extrabold text-sky-800">{total} / 400</span>
                              </div>
                              <div className="bg-[#FEF3C7] p-3 rounded-xl border border-amber-100">
                                <span className="text-[9px] font-bold text-amber-600 block uppercase">Percentage</span>
                                <span className="text-base font-extrabold text-amber-800">{percentage}%</span>
                              </div>
                            </div>

                            <div className="bg-brandCream p-3.5 border rounded-xl text-xs space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Teacher Observation Notes</span>
                              <p className="text-slate-700 font-medium leading-relaxed italic">"{rep.notes || 'No remarks recorded.'}"</p>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setActiveResultCard({ student: child, report: rep, parentName: profile?.name })}
                                className="px-4 py-2 bg-[#5B468C] hover:bg-[#4A3970] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View / Print Result Card</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No progress reports published for this academic term.</p>
                  )}
                </div>
              )}

              {/* Tab 5: Fee Ledger */}
              {activeTab === 'fees' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-orange-50 pb-3">
                    <div>
                      <h3 className="font-quicksand font-bold text-lg text-slate-800">Tuition & Fee Ledger</h3>
                      <p className="text-[11px] text-slate-400">View invoices, sibling discounts, pay installments, and download official receipts.</p>
                    </div>
                  </div>

                  {fees.length > 0 ? (
                    <div className="space-y-4">
                      {fees.map((fee) => {
                        const isCleared = fee.status === 'paid' || (fee.balanceAmount === 0 && (fee.paidAmount || 0) > 0);
                        const isPartial = fee.status === 'partially_paid' || ((fee.paidAmount || 0) > 0 && (fee.balanceAmount || 0) > 0);
                        const bal = fee.balanceAmount !== undefined ? fee.balanceAmount : fee.amount;

                        return (
                          <div key={fee._id} className="bg-white border border-slate-200/80 hover:border-indigo-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs shadow-sm transition-all">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-[9px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border inline-block ${
                                  isCleared ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  isPartial ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {isCleared ? 'PAID IN FULL' : isPartial ? 'PARTIALLY PAID' : 'PENDING'}
                                </span>

                                {fee.discountAmount > 0 && (
                                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    {fee.discountReason || 'Sibling Discount (10%)'} (-₹{fee.discountAmount})
                                  </span>
                                )}

                                {fee.fine > 0 && (
                                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    <AlertCircle className="w-3 h-3 text-red-500" />
                                    Late Fine: +₹{fee.fine}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-quicksand font-bold text-slate-800 text-sm">{fee.term}</h4>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 text-slate-600">
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Total Due:</span>
                                  <span className="font-bold text-slate-800">₹{(fee.totalAmount || fee.amount).toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Paid So Far:</span>
                                  <span className="font-bold text-emerald-600">₹{(fee.paidAmount || 0).toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Remaining Balance:</span>
                                  <span className={`font-bold ${bal > 0 ? 'text-rose-600' : 'text-slate-400'}`}>₹{bal.toLocaleString('en-IN')}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 block">Due Date:</span>
                                  <span className="font-medium">{new Date(fee.dueDate).toLocaleDateString()}</span>
                                </div>
                              </div>

                              {/* Installments History */}
                              {fee.installments && fee.installments.length > 0 && (
                                <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] space-y-1">
                                  <span className="font-bold text-slate-500 block uppercase tracking-wider text-[9px]">Payment Breakdown ({fee.installments.length} installment{fee.installments.length > 1 ? 's' : ''}):</span>
                                  {fee.installments.map((inst, idx) => (
                                    <div key={idx} className="flex justify-between text-slate-600">
                                      <span>Installment #{idx + 1} ({new Date(inst.date).toLocaleDateString()}) - {inst.method}</span>
                                      <span className="font-bold text-emerald-600">₹{inst.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions Column */}
                            <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                              {!isCleared && (
                                <button
                                  type="button"
                                  onClick={() => openPayModal(fee)}
                                  className="w-full sm:w-auto font-quicksand font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>{isPartial ? 'PAY REMAINING (₹' + bal.toLocaleString('en-IN') + ')' : 'PAY ONLINE / INSTALLMENT'}</span>
                                </button>
                              )}

                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  type="button"
                                  onClick={() => handleViewReceipt(fee._id)}
                                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 font-bold text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Receipt</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={downloadingPdf}
                                  onClick={() => handleDownloadPDF(fee._id)}
                                  className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 font-bold text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No invoices generated for this student registry.</p>
                  )}
                </div>
              )}
            </>
          )}

        </div>

      </div>

      {/* Pay Online & Installments Modal */}
      {payModalFee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-800 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setPayModalFee(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-500 transition-colors"
            >
              ×
            </button>

            <div className="text-center space-y-1 border-b pb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CreditCard className="w-6 h-6" />
              </div>
              <h4 className="font-quicksand font-bold text-slate-800 text-base">Make Fee Payment</h4>
              <p className="text-xs text-slate-500">{payModalFee.term} - {child?.name}</p>
            </div>

            <div className="py-4 space-y-4 text-xs">
              {/* Fee Breakdown Summary */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Invoice Amount:</span>
                  <span className="font-bold text-slate-700">₹{(payModalFee.totalAmount || payModalFee.amount).toLocaleString('en-IN')}</span>
                </div>
                {payModalFee.discountAmount > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>{payModalFee.discountReason || 'Sibling Concession'}:</span>
                    <span>-₹{payModalFee.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-500">
                  <span>Paid Previous:</span>
                  <span className="font-bold text-emerald-600">₹{(payModalFee.paidAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-sm text-slate-800">
                  <span>Remaining Due:</span>
                  <span className="text-indigo-600">₹{(payModalFee.balanceAmount !== undefined ? payModalFee.balanceAmount : payModalFee.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Installment Choice */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Payment Option</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayType('full');
                      setCustomPayAmount((payModalFee.balanceAmount !== undefined ? payModalFee.balanceAmount : payModalFee.amount).toString());
                    }}
                    className={`p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                      payType === 'full' ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Full Balance</span>
                    <span className="block text-[10px] font-normal text-slate-500">₹{(payModalFee.balanceAmount !== undefined ? payModalFee.balanceAmount : payModalFee.amount).toLocaleString('en-IN')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayType('custom')}
                    className={`p-3 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                      payType === 'custom' ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Custom Installment</span>
                    <span className="block text-[10px] font-normal text-slate-500">Enter partial amount</span>
                  </button>
                </div>
              </div>

              {/* Custom Amount Input */}
              {payType === 'custom' && (
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600 block text-[11px]">Installment Amount (₹):</label>
                  <input
                    type="number"
                    value={customPayAmount}
                    onChange={(e) => setCustomPayAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    max={payModalFee.balanceAmount !== undefined ? payModalFee.balanceAmount : payModalFee.amount}
                    className="w-full p-2.5 border rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Payment Gateway Mode */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">Gateway Method</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="payMethod"
                      value="razorpay"
                      checked={payMethod === 'razorpay'}
                      onChange={() => setPayMethod('razorpay')}
                      className="text-indigo-600"
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <span className="font-bold text-slate-800">Razorpay (UPI, GPay, Cards, NetBanking)</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">INSTANT</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer hover:bg-slate-50">
                    <input
                      type="radio"
                      name="payMethod"
                      value="wallet"
                      checked={payMethod === 'wallet'}
                      onChange={() => setPayMethod('wallet')}
                      className="text-indigo-600"
                    />
                    <span className="font-semibold text-slate-700">Direct School Parent Wallet</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayModalFee(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isProcessingPay}
                onClick={submitPayment}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isProcessingPay ? 'Processing...' : `Pay ₹${payType === 'full' ? (payModalFee.balanceAmount !== undefined ? payModalFee.balanceAmount : payModalFee.amount).toLocaleString('en-IN') : Number(customPayAmount || 0).toLocaleString('en-IN')}`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Official Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-slate-800 animate-in fade-in">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-500 transition-colors"
            >
              ×
            </button>

            <div className="border-b pb-3 text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1 shadow-inner">
                <CheckCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-extrabold tracking-widest text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-full">OFFICIAL FEE RECEIPT</span>
              <h4 className="font-quicksand font-bold text-slate-800 text-base mt-2">{activeReceipt.school?.name || 'Apna School Kindergarten'}</h4>
              <p className="text-[11px] text-slate-400 font-mono">Receipt No: {activeReceipt.receipt?.receiptNumber || 'REC-OFFICIAL'}</p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-y-2 border-b pb-3 text-slate-600">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Student Name</span>
                  <span className="text-slate-800 font-bold">{activeReceipt.student?.name || child?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Class</span>
                  <span className="text-slate-800 font-bold">{activeReceipt.student?.class || child?.class}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Fee Term</span>
                  <span className="text-slate-800 font-bold">{activeReceipt.fee?.term || 'Tuition Invoice'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Payment Date</span>
                  <span className="text-slate-800 font-bold">{new Date(activeReceipt.receipt?.paymentDate || Date.now()).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-emerald-800 font-bold block">Amount Paid</span>
                  <span className="text-[10px] text-emerald-600 font-mono">{activeReceipt.receipt?.paymentMethod || 'Online Gateway'}</span>
                </div>
                <span className="text-2xl font-black text-emerald-700">₹{(activeReceipt.receipt?.amountPaid || 0).toLocaleString('en-IN')}</span>
              </div>

              {activeReceipt.fee?.balanceAmount > 0 && (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-800 flex justify-between font-bold text-[11px]">
                  <span>Outstanding Remaining Balance:</span>
                  <span>₹{activeReceipt.fee.balanceAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="bg-slate-50 border p-3 rounded-2xl text-[10px] font-mono space-y-0.5 text-slate-500">
                <p>Transaction ID: <span className="text-slate-800 font-semibold">{activeReceipt.receipt?.transactionId || 'TXN-DIRECT'}</span></p>
                <p>Status: <span className="text-emerald-600 font-bold">VERIFIED & CLEARED</span></p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => generateFeeReceiptPDF(activeReceipt)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official PDF Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {activeResultCard && (
        <ResultCardModal
          activeResult={activeResultCard}
          onClose={() => setActiveResultCard(null)}
        />
      )}

      {/* Official Student ID Card Modal */}
      {activeIdCard && (
        <StudentIdCardModal
          student={activeIdCard}
          onClose={() => setActiveIdCard(null)}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />
    </div>
  );
}
