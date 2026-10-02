import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { CreditCard, CheckCircle, HelpCircle, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Fees() {
  const { user } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [term, setTerm] = useState('Term 1 (April - June)');
  const [amount, setAmount] = useState('12500');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txnId, setTxnId] = useState('');

  const feeStructure = [
    { program: 'Pre-Nursery (Infants)', termFee: '12,000', annualFee: '45,000', security: '5,000' },
    { program: 'Nursery (Toddlers)', termFee: '12,500', annualFee: '48,000', security: '5,000' },
    { program: 'Junior KG (Preschool)', termFee: '15,000', annualFee: '55,000', security: '6,000' },
    { program: 'Senior KG (Pre-K)', termFee: '16,000', annualFee: '58,000', security: '6,000' }
  ];

  const handleSimulatedPayment = (e) => {
    e.preventDefault();
    if (!studentName.trim()) return alert('Please enter student name to simulate');
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      const generatedTxn = `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
      setTxnId(generatedTxn);
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }, 2000);
  };

  const resetForm = () => {
    setSuccess(false);
    setStudentName('');
    setTxnId('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-12">
      
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <span className="text-brandCoral font-bold text-xs uppercase tracking-widest bg-brandCoral/10 px-3 py-1 rounded-full border border-brandCoral/20">FINANCES</span>
        <h1 className="text-4xl font-quicksand font-bold text-slate-800">Fee Structure & Online Payments</h1>
        <p className="text-sm text-slate-500">
          Clear outlines of tuition term fees, security deposits, and a simulated payment portal for instant online clearances.
        </p>
      </div>

      {/* Fee Structure Table */}
      <section className="bg-white border border-orange-50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-orange-50 pb-4">
          <div>
            <h3 className="font-quicksand font-bold text-xl text-slate-800">Fee Schedule (2026 - 2027)</h3>
            <p className="text-xs text-slate-500">All prices in INR (₹). Term payments due by the 10th of respective starting months.</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/brochure"
              className="inline-flex items-center space-x-1 font-quicksand font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full border border-slate-200 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Schedule PDF</span>
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brandCream border-b border-orange-100 text-slate-700 font-quicksand font-bold">
                <th className="p-4 rounded-l-xl">Class / Program</th>
                <th className="p-4">Term Tuition Fee</th>
                <th className="p-4">Annual Activity Fee</th>
                <th className="p-4 rounded-r-xl">Caution Deposit (Refundable)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
              {feeStructure.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-4 font-quicksand font-bold text-slate-800">{row.program}</td>
                  <td className="p-4">₹{row.termFee}</td>
                  <td className="p-4">₹{row.annualFee}</td>
                  <td className="p-4">₹{row.security}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Simulated Payment Portal */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Info Column */}
        <div className="lg:col-span-5 bg-brandCream border border-orange-100/50 rounded-3xl p-6 md:p-8 space-y-5">
          <h3 className="font-quicksand font-bold text-xl text-slate-800">Important Instructions</h3>
          <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <li className="flex space-x-2">
              <CheckCircle className="w-4 h-4 text-brandMint shrink-0 mt-0.5" />
              <span>Term tuition fees are billed four times a year: April, July, October, and January.</span>
            </li>
            <li className="flex space-x-2">
              <CheckCircle className="w-4 h-4 text-brandMint shrink-0 mt-0.5" />
              <span>Overdue fees accrue a late clearance fine of ₹1,000 per week past the deadline.</span>
            </li>
            <li className="flex space-x-2">
              <CheckCircle className="w-4 h-4 text-brandMint shrink-0 mt-0.5" />
              <span>For portal payments, please log in to the **Parent Portal** to view and clear actual outstanding child invoices automatically.</span>
            </li>
          </ul>

          <div className="bg-white border border-orange-100 p-4 rounded-2xl flex items-start space-x-3">
            <HelpCircle className="w-5 h-5 text-brandSky shrink-0 mt-0.5" />
            <div>
              <h4 className="font-quicksand font-bold text-slate-800 text-xs">Payment Support</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                Have questions or need customized installment timelines? Reach out to our billing desk at `billing@apnaschool.edu`.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form Simulator */}
        <div className="lg:col-span-7 bg-white border border-orange-50 rounded-3xl p-6 md:p-8 shadow-sm">
          <h3 className="font-quicksand font-bold text-xl text-slate-800 border-b border-orange-50 pb-4">
            Payment Simulator Gateway
          </h3>

          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-brandMint/10 rounded-full flex items-center justify-center text-brandMint mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="font-quicksand font-bold text-2xl text-slate-800">Payment Successful!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Your simulated payment of **₹{Number(amount).toLocaleString('en-IN')}** has been processed successfully.
              </p>
              <div className="bg-brandCream border border-orange-100 p-4 rounded-xl max-w-sm mx-auto text-left text-xs space-y-1 font-semibold text-slate-600">
                <p>Transaction ID: <span className="text-slate-800 font-mono">{txnId}</span></p>
                <p>Term: <span className="text-slate-800">{term}</span></p>
                <p>Gateway Mode: <span className="text-slate-800">Sandbox Test</span></p>
              </div>
              <button
                onClick={resetForm}
                className="font-quicksand font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-full transition-all"
              >
                PAY ANOTHER TERM
              </button>
            </div>
          ) : (
            <form onSubmit={handleSimulatedPayment} className="space-y-4 pt-4">
              {user && user.role === 'parent' ? (
                <div className="bg-brandSky/10 border border-brandSky/30 p-3.5 rounded-2xl text-xs text-brandSky-dark font-medium">
                  Parent account detected. To pay your child’s actual outstanding fees, please visit your **Parent Portal Dashboard** under "Fee Ledger" section!
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Guest checkout simulator. Log in to clear actual student invoices.
                </p>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Student Name</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Tommy Jenkins"
                  className="w-full bg-slate-50 border border-orange-100 focus:border-brandCoral rounded-xl p-3 text-xs outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Fee Term</label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-orange-100 focus:border-brandCoral rounded-xl p-3 text-xs outline-none transition-colors"
                  >
                    <option>Term 1 (April - June)</option>
                    <option>Term 2 (July - Sept)</option>
                    <option>Term 3 (Oct - Dec)</option>
                    <option>Term 4 (Jan - March)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Payment Amount (₹)</label>
                  <select
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-orange-100 focus:border-brandCoral rounded-xl p-3 text-xs outline-none transition-colors"
                  >
                    <option value="12000">₹12,000 (Infants Term)</option>
                    <option value="12500">₹12,500 (Toddlers Term)</option>
                    <option value="15000">₹15,000 (Preschool Term)</option>
                    <option value="16000">₹16,000 (Pre-K Term)</option>
                  </select>
                </div>
              </div>

              <div className="bg-brandCream border border-orange-100 p-4 rounded-2xl flex items-center space-x-3 text-slate-500">
                <CreditCard className="w-5 h-5 shrink-0" />
                <span className="text-[10px] leading-relaxed font-semibold">
                  This is a sandbox environment. Entering credit card credentials is not required. Just click pay below to simulate processing.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-quicksand font-bold text-sm bg-brandCoral hover:bg-brandCoral-dark text-white py-3.5 rounded-xl shadow transition-all hover:shadow-md disabled:opacity-50"
              >
                {loading ? 'Processing Transaction...' : `PAY TUITION ₹${Number(amount).toLocaleString('en-IN')} NOW`}
              </button>
            </form>
          )}

        </div>

      </section>

    </div>
  );
}
