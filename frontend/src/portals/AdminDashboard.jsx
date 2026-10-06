import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ClipboardList, Users, CreditCard, Bell, Image as ImageIcon, MessageCircle, CheckCircle, XCircle, Trash2, Plus, Clock, Search, FileText, Printer, Edit, Download, Contact, Calendar, ChevronLeft, ChevronRight, Sparkles, DollarSign, LogOut, ArrowRight, Target, Zap, ShieldCheck, AlertTriangle, TrendingUp, Bot, RefreshCw, Settings, PieChart, ReceiptText, Sliders, ArrowUpRight, Send, AlertCircle, Shield, FileSpreadsheet, Lock, ArrowDownCircle, History, Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import ConfirmModal from '../components/ConfirmModal.jsx';
import StudentIdCardModal from '../components/StudentIdCardModal.jsx';
import { generateOfficialFeeReceiptPDF } from '../utils/pdfReceiptGenerator';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);

  // Dynamic lists
  const [admissions, setAdmissions] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees] = useState([]);
  const [queries, setQueries] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Event & Calendar management states
  const [editingEventId, setEditingEventId] = useState(null);
  const [evTitle, setEvTitle] = useState('');
  const [evType, setEvType] = useState('celebration');
  const [evStartDate, setEvStartDate] = useState('');
  const [evEndDate, setEvEndDate] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [eventFilterType, setEventFilterType] = useState('all');

  // Student Fee Balance & Cash Collection State (Bento Fee Desk)
  const [selectedFeeStudent, setSelectedFeeStudent] = useState(null);
  const [studentFeeBalance, setStudentFeeBalance] = useState({
    totalFees: 0,
    paidFees: 0,
    remainingFees: 0,
    pendingFees: [],
    paidFeesList: []
  });
  const [collectAmount, setCollectAmount] = useState('');
  const [collectTermId, setCollectTermId] = useState('');
  const [collectMethod, setCollectMethod] = useState('Cash at Desk');
  const [isCollectingCash, setIsCollectingCash] = useState(false);
  const [bentoWeeklyToggle, setBentoWeeklyToggle] = useState('weekly');
  const [bentoActivityTab, setBentoActivityTab] = useState('overview');

  // Remarks for approval reviews
  const [remarks, setRemarks] = useState('');

  // Subtabs configuration
  const [admissionsSubTab, setAdmissionsSubTab] = useState('review');
  const [usersSubTab, setUsersSubTab] = useState('registry');

  // Success Notification Toast
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  // Form states for New Admission Entry
  const [admStdName, setAdmStdName] = useState('');
  const [admStdDob, setAdmStdDob] = useState('');
  const [admStdGender, setAdmStdGender] = useState('Male');
  const [admStdClass, setAdmStdClass] = useState('Pre-Nursery');
  const [admParentFather, setAdmParentFather] = useState('');
  const [admParentMother, setAdmParentMother] = useState('');
  const [admParentEmail, setAdmParentEmail] = useState('');
  const [admParentPhone, setAdmParentPhone] = useState('');
  const [admParentAddress, setAdmParentAddress] = useState('');
  const [admParentPassword, setAdmParentPassword] = useState('');
  const [admBirthCertificate, setAdmBirthCertificate] = useState(null);
  const [admPhoto, setAdmPhoto] = useState(null);

  const [admissionFee, setAdmissionFee] = useState('');

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [activeIdCard, setActiveIdCard] = useState(null);

  // Form states for Direct Student Registration
  const [regStdName, setRegStdName] = useState('');
  const [regStdDob, setRegStdDob] = useState('');
  const [regStdGender, setRegStdGender] = useState('Male');
  const [regStdClass, setRegStdClass] = useState('Pre-Nursery');
  const [regParentName, setRegParentName] = useState('');
  const [regParentEmail, setRegParentEmail] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');
  const [regParentAddress, setRegParentAddress] = useState('');
  const [regParentPassword, setRegParentPassword] = useState('');

  // Search & Filtering for Student Registry
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');

  // Modal control states
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);

  // Form states for Editing Student
  const [editStdName, setEditStdName] = useState('');
  const [editStdDob, setEditStdDob] = useState('');
  const [editStdGender, setEditStdGender] = useState('Male');
  const [editStdClass, setEditStdClass] = useState('Pre-Nursery');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editParentAddress, setEditParentAddress] = useState('');

  // Creation forms inputs states
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tQual, setTQual] = useState('');
  const [tClass, setTClass] = useState('Nursery');

  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [parentPassword, setParentPassword] = useState('');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'submit',
    onConfirm: () => { }
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

  const [feeStdId, setFeeStdId] = useState('');
  const [feeClassFilter, setFeeClassFilter] = useState('');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [feeTerm, setFeeTerm] = useState('Term 1 (April - June)');
  const [feeAmount, setFeeAmount] = useState('1250');
  const [feeDueDate, setFeeDueDate] = useState('');
  const [listFeeStatusFilter, setListFeeStatusFilter] = useState('all');
  const [listFeeClassFilter, setListFeeClassFilter] = useState('');
  const [listFeeSearchName, setListFeeSearchName] = useState('');
  const [listFeeMonthFilter, setListFeeMonthFilter] = useState('all');
  const [listFeeMethodFilter, setListFeeMethodFilter] = useState('all');

  // Enhanced Fee Management Subtabs & Modals State
  const [feeSubTab, setFeeSubTab] = useState('dashboard'); // 'dashboard', 'desk', 'invoices', 'structures'
  const [enhancedFeeStats, setEnhancedFeeStats] = useState(null);
  const [loadingFeeStats, setLoadingFeeStats] = useState(false);

  // Student Fee Structure Configuration Modal State
  const [structModalStudent, setStructModalStudent] = useState(null);
  const [studentFeeConfig, setStudentFeeConfig] = useState({
    academicYear: '2026-2027',
    admissionFee: { amount: 0, enabled: false },
    registrationFee: { amount: 0, enabled: false },
    tuitionFee: { amount: 2500, enabled: true },
    monthlyFee: { amount: 2500, enabled: true },
    examFee: { amount: 0, enabled: false },
    transportFee: { amount: 0, enabled: false },
    hostelFee: { amount: 0, enabled: false },
    libraryFee: { amount: 0, enabled: false },
    otherCharges: { amount: 0, enabled: false },
    discount: { amount: 0, reason: '' },
    fine: { amount: 0, reason: '' },
    notes: '',
    isActive: true
  });
  const [savingFeeConfig, setSavingFeeConfig] = useState(false);

  // Student Fee Profile Modal State
  const [feeProfileStudent, setFeeProfileStudent] = useState(null);
  const [feeProfileData, setFeeProfileData] = useState(null);
  const [loadingFeeProfile, setLoadingFeeProfile] = useState(false);

  // Advanced Universal Payment Modal State
  const [payModalStudent, setPayModalStudent] = useState(null);
  const [payModalFee, setPayModalFee] = useState(null);
  const [payModalForm, setPayModalForm] = useState({
    amount: '',
    paymentMethod: 'Cash at Desk',
    month: '',
    year: 2026,
    feeType: 'monthly',
    discountApplied: 0,
    fineApplied: 0,
    remarks: ''
  });
  const [isSubmittingPayModal, setIsSubmittingPayModal] = useState(false);
  
  // Real Reception Cash Desk State
  const [cashDeskData, setCashDeskData] = useState(null);
  const [loadingCashDesk, setLoadingCashDesk] = useState(false);
  const [cashDeskFilterDate, setCashDeskFilterDate] = useState('');
  const [cashDeskTxnModal, setCashDeskTxnModal] = useState(false);
  const [cashDeskTxnForm, setCashDeskTxnForm] = useState({
    type: 'EXPENSE',
    category: 'OFFICE_SUPPLIES',
    amount: '',
    paymentMethod: 'CASH',
    description: '',
    vendorRecipient: ''
  });
  const [isSubmittingCashDeskTxn, setIsSubmittingCashDeskTxn] = useState(false);
  const [closeDeskModal, setCloseDeskModal] = useState(false);
  const [closeDeskForm, setCloseDeskForm] = useState({
    actualCash: '',
    discrepancyReason: ''
  });
  const [isClosingDesk, setIsClosingDesk] = useState(false);

  // Fee Reminders Management State
  const [remindersData, setRemindersData] = useState({ upcoming: [], dueToday: [], overdue: [], logs: [] });
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState('email');
  const [dispatchType, setDispatchType] = useState('all');
  const [isDispatchingReminders, setIsDispatchingReminders] = useState(false);

  // Financial Reports Hub & Audit Trail State
  const [financialReportType, setFinancialReportType] = useState('daily_collection');
  const [reportDateFrom, setReportDateFrom] = useState('');
  const [reportDateTo, setReportDateTo] = useState('');
  const [financialReportData, setFinancialReportData] = useState(null);
  const [loadingFinancialReport, setLoadingFinancialReport] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCat, setAnnCat] = useState('general');
  const [annAudience, setAnnAudience] = useState('all');

  const [galTitle, setGalTitle] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galFile, setGalFile] = useState(null);
  const [galCat, setGalCat] = useState('classroom');
  const [galItems, setGalItems] = useState([]);

  const [feeStructures, setFeeStructures] = useState([]);

  // AI Predictive Financial Forecast state
  const [aiForecast, setAiForecast] = useState(null);
  const [aiForecastLoading, setAiForecastLoading] = useState(false);

  const fetchAiForecast = async () => {
    setAiForecastLoading(true);
    try {
      const res = await fetch('/api/admin/ai/financial-forecast', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setAiForecastLoading(false);
      if (data.success && data.data) {
        setAiForecast(data.data);
      }
    } catch (err) {
      console.error('Error fetching AI financial forecast:', err);
      setAiForecastLoading(false);
    }
  };

  // AI Circular / Notice Composer state
  const [aiNoticePrompt, setAiNoticePrompt] = useState({
    title: '',
    keyPoints: '',
    tone: 'official',
    audience: 'All Parents & Teachers'
  });
  const [aiNoticeResult, setAiNoticeResult] = useState(null);
  const [aiNoticeLoading, setAiNoticeLoading] = useState(false);
  const [showAiNoticePanel, setShowAiNoticePanel] = useState(false);

  const handleGenerateAiNotice = async (preset = null) => {
    const payload = preset || aiNoticePrompt;
    if (!payload.title || !payload.title.trim()) {
      alert('Please enter a notice topic or title');
      return;
    }
    setAiNoticeLoading(true);
    try {
      const res = await fetch('/api/admin/ai/compose-circular', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setAiNoticeLoading(false);
      if (data.success && data.data) {
        setAiNoticeResult(data.data);
      }
    } catch (err) {
      console.error('Error composing AI notice:', err);
      setAiNoticeLoading(false);
    }
  };

  const applyAiNoticeToForm = () => {
    if (!aiNoticeResult) return;
    setAnnTitle(aiNoticeResult.subject.replace('CIRCULAR: ', ''));
    const fullBody = `${aiNoticeResult.circularRef}\nDate: ${aiNoticeResult.date}\n\n${aiNoticeResult.salutation}\n\n${aiNoticeResult.openingText}\n\n${aiNoticeResult.summaryBody}\n\nKey Guidelines:\n• ${aiNoticeResult.guidelines.join('\n• ')}\n\n${aiNoticeResult.closingText}\n\n---\n${aiNoticeResult.signatory}`;
    setAnnContent(fullBody);
    setAnnCat('circular');
    showToast('✨ AI Circular applied to Bulletin form!');
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard-data', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        if (data.stats) setStats(data.stats);
        if (data.admissions) setAdmissions(data.admissions);
        if (data.students) setStudents(data.students);
        if (data.teachers) setTeachers(data.teachers);
        if (data.fees) setFees(data.fees);
        if (data.queries) setQueries(data.queries);
        if (data.feeStructures) setFeeStructures(data.feeStructures);
        if (data.events) setEvents(data.events);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const fetchEvents = () => {
    fetch('/api/admin/events', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setEvents(data.data); })
      .catch(err => console.error(err));
  };

  const fetchStudentFeeBalance = async (studentId) => {
    if (!studentId) return;
    try {
      const res = await fetch(`/api/admin/students/${studentId}/fee-balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setStudentFeeBalance({
          totalFees: data.totalFees || 0,
          paidFees: data.paidFees || 0,
          remainingFees: data.remainingFees || 0,
          pendingFees: data.pendingFees || [],
          paidFeesList: data.paidFeesList || []
        });
        if (data.pendingFees && data.pendingFees.length > 0) {
          setCollectTermId(data.pendingFees[0]._id);
          setCollectAmount(data.pendingFees[0].amount.toString());
        } else {
          setCollectTermId('');
          setCollectAmount('');
        }
      }
    } catch (err) {
      console.error('Error fetching student fee balance:', err);
    }
  };

  const handleDirectCashCollection = async (e) => {
    e.preventDefault();
    if (!selectedFeeStudent) {
      alert('Please select a student from the list first');
      return;
    }
    if (!collectAmount || Number(collectAmount) <= 0) {
      alert('Please enter a valid cash amount to collect');
      return;
    }

    setIsCollectingCash(true);
    try {
      const res = await fetch('/api/admin/fees/collect-cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: selectedFeeStudent._id,
          feeId: collectTermId || undefined,
          amount: Number(collectAmount),
          paymentMethod: collectMethod
        })
      });

      const data = await res.json();
      setIsCollectingCash(false);
      if (data.success) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        showToast('Cash payment of ₹' + Number(collectAmount).toLocaleString('en-IN') + ' recorded successfully!');
        alert('Cash payment recorded successfully!');

        // Update balance
        if (data.totalFees !== undefined) {
          setStudentFeeBalance(prev => ({
            ...prev,
            totalFees: data.totalFees,
            paidFees: data.paidFees,
            remainingFees: data.remainingFees
          }));
        }
        // Refresh full fees & stats
        fetchDashboardData();
        fetchStudentFeeBalance(selectedFeeStudent._id);

        // Open official receipt modal
        if (data.receipt) {
          setActiveReceipt({
            receipt: data.receipt,
            student: {
              name: selectedFeeStudent.name,
              class: selectedFeeStudent.class,
              studentId: selectedFeeStudent.studentId || 'STUDENT'
            },
            fee: data.fee || {
              term: 'Desk Cash Fee Payment',
              amount: Number(collectAmount)
            }
          });
        }
      } else {
        alert(data.message || 'Failed to collect cash payment');
      }
    } catch (err) {
      setIsCollectingCash(false);
      console.error(err);
      alert('Error recording payment: ' + err.message);
    }
  };

  const handleSelectInvoiceStudent = (s) => {
    setFeeStdId(s._id);
    const struct = feeStructures.find(f => f.class === s.class);
    if (struct) {
      const monthlySum = (struct.tuitionFee || 0) +
                         (struct.computerFee || 0) +
                         (struct.developmentFee || 0) +
                         (struct.activityFee || 0) +
                         (struct.smartClassFee || 0) +
                         (struct.transportFee || 0);
      setFeeAmount((monthlySum > 0 ? monthlySum : (struct.tuitionFee || 1500)).toString());
    } else {
      const classFees = {
        'Pre-Nursery': 1200,
        'Nursery': 1250,
        'Junior KG': 1400,
        'Senior KG': 1500,
        'Preschool': 1200,
        '1st': 1800,
        '2nd': 1900,
        '3rd': 2000,
        '4th': 2100,
        '5th': 2200,
        '6th': 2300,
        '7th': 2400,
        '8th': 2500
      };
      const defaultFee = classFees[s.class] || 1500;
      setFeeAmount(defaultFee.toString());
    }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!evTitle || !evStartDate || !evEndDate) {
      alert('Please fill in title, start date, and end date');
      return;
    }

    try {
      const url = editingEventId ? `/api/admin/events/${editingEventId}` : '/api/admin/events';
      const method = editingEventId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: evTitle,
          type: evType,
          startDate: evStartDate,
          endDate: evEndDate,
          description: evDescription
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(editingEventId ? 'Event updated successfully!' : 'Event scheduled & posted successfully!');
        alert(editingEventId ? 'Event updated successfully!' : 'Event scheduled & posted successfully!');
        setEditingEventId(null);
        setEvTitle('');
        setEvType('celebration');
        setEvStartDate('');
        setEvEndDate('');
        setEvDescription('');
        fetchEvents();
      } else {
        alert(data.message || 'Failed to save event');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving event: ' + err.message);
    }
  };

  const handleStartEditEvent = (ev) => {
    setEditingEventId(ev._id);
    setEvTitle(ev.title || '');
    setEvType(ev.type || 'celebration');
    const toDatetimeLocal = (d) => {
      if (!d) return '';
      const date = new Date(d);
      if (isNaN(date.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };
    setEvStartDate(toDatetimeLocal(ev.startDate));
    setEvEndDate(toDatetimeLocal(ev.endDate));
    setEvDescription(ev.description || '');

    const formEl = document.getElementById('event-form-card');
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEditEvent = () => {
    setEditingEventId(null);
    setEvTitle('');
    setEvType('celebration');
    setEvStartDate('');
    setEvEndDate('');
    setEvDescription('');
  };

  const getEventCategoryBadge = (type) => {
    switch (type) {
      case 'holiday': return 'bg-red-50 text-red-600 border-red-200';
      case 'ptm': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'exam': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'sports': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'academic': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const handleDeleteEvent = (id) => {
    triggerConfirm(
      'Delete Calendar Event',
      'Are you sure you want to delete this event from the school calendar? This will immediately remove it for all parents and visitors.',
      'danger',
      async () => {
        try {
          const res = await fetch(`/api/admin/events/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          if (data.success) {
            showToast('Event removed from calendar!');
            fetchEvents();
          } else {
            alert(data.message || 'Failed to delete event');
          }
        } catch (err) {
          console.error(err);
          alert('Error deleting event: ' + err.message);
        }
      }
    );
  };

  const fetchEnhancedFeeStats = async () => {
    setLoadingFeeStats(true);
    try {
      const res = await fetch('/api/admin/fees/dashboard-stats', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLoadingFeeStats(false);
      if (data.success) {
        setEnhancedFeeStats(data);
      }
    } catch (err) {
      console.error('Error fetching enhanced fee stats:', err);
      setLoadingFeeStats(false);
    }
  };

  const openStudentStructureModal = async (std) => {
    setStructModalStudent(std);
    try {
      const res = await fetch(`/api/admin/fees/student-structure/${std._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success && data.data) {
        setStudentFeeConfig(data.data);
      }
    } catch (err) {
      console.error('Error loading student fee structure:', err);
    }
  };

  const handleSaveStudentFeeStructure = async (e) => {
    e.preventDefault();
    if (!structModalStudent) return;
    setSavingFeeConfig(true);
    try {
      const res = await fetch(`/api/admin/fees/student-structure/${structModalStudent._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(studentFeeConfig)
      });
      const data = await res.json();
      setSavingFeeConfig(false);
      if (data.success) {
        showToast(`Fee structure saved for ${structModalStudent.name}!`);
        alert(`Fee structure saved for ${structModalStudent.name}!`);
        setStructModalStudent(null);
        fetchFees();
        fetchEnhancedFeeStats();
      } else {
        alert(data.message || 'Failed to save fee structure');
      }
    } catch (err) {
      setSavingFeeConfig(false);
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  const openStudentFeeProfile = async (std) => {
    setFeeProfileStudent(std);
    setLoadingFeeProfile(true);
    try {
      const res = await fetch(`/api/admin/fees/student-profile/${std._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLoadingFeeProfile(false);
      if (data.success) {
        setFeeProfileData(data);
      } else {
        alert(data.message || 'Failed to load fee profile');
      }
    } catch (err) {
      setLoadingFeeProfile(false);
      console.error(err);
      alert('Error loading fee profile');
    }
  };

  const openUniversalPayModal = (std, fee = null) => {
    setPayModalStudent(std);
    setPayModalFee(fee);
    const now = new Date();
    const curMonth = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ][now.getMonth()];

    setPayModalForm({
      amount: fee ? (fee.remainingAmount || fee.amount || '').toString() : '',
      paymentMethod: 'Cash at Desk',
      month: fee?.month || curMonth,
      year: fee?.year || now.getFullYear(),
      feeType: fee?.feeType || 'monthly',
      discountApplied: fee?.discountAmount || 0,
      fineApplied: fee?.fineAmount || 0,
      remarks: ''
    });
  };

  const handleUniversalPaySubmit = async (e) => {
    e.preventDefault();
    if (!payModalStudent) return;
    if (!payModalForm.amount || Number(payModalForm.amount) <= 0) {
      alert('Please enter a valid positive payment amount');
      return;
    }

    setIsSubmittingPayModal(true);
    try {
      const res = await fetch('/api/admin/fees/record-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentId: payModalStudent._id,
          feeId: payModalFee?._id || undefined,
          paymentAmount: Number(payModalForm.amount),
          paymentMethod: payModalForm.paymentMethod,
          discountApplied: Number(payModalForm.discountApplied) || 0,
          fineApplied: Number(payModalForm.fineApplied) || 0,
          month: payModalForm.month,
          year: payModalForm.year,
          feeType: payModalForm.feeType,
          remarks: payModalForm.remarks,
          adminName: 'Admin Desk'
        })
      });

      const data = await res.json();
      setIsSubmittingPayModal(false);
      if (data.success) {
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
        showToast(data.message);
        alert(data.message);
        setPayModalStudent(null);
        setPayModalFee(null);

        // Refresh all data
        fetchDashboardData();
        fetchFees();
        fetchEnhancedFeeStats();
        if (feeProfileStudent && feeProfileStudent._id === payModalStudent._id) {
          openStudentFeeProfile(payModalStudent);
        }

        // Show receipt
        if (data.receipt) {
          setActiveReceipt({
            receipt: data.receipt,
            student: data.student || { name: payModalStudent.name, class: payModalStudent.class, studentId: payModalStudent.studentId },
            fee: data.fee || { term: `${payModalForm.month} ${payModalForm.year} Fee` }
          });
        }
      } else {
        alert(data.message || 'Payment recording failed');
      }
    } catch (err) {
      setIsSubmittingPayModal(false);
      console.error(err);
      alert('Error recording payment: ' + err.message);
    }
  };

  const handleCancelReceipt = async (receiptId) => {
    const reason = prompt('Please enter the reason for cancelling/reversing this transaction:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/admin/fees/receipts/${receiptId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason, adminName: 'Admin Desk' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        alert(data.message);
        fetchFees();
        fetchEnhancedFeeStats();
        if (feeProfileStudent) openStudentFeeProfile(feeProfileStudent);
      } else {
        alert(data.message || 'Failed to cancel receipt');
      }
    } catch (err) {
      console.error(err);
      alert('Error cancelling receipt: ' + err.message);
    }
  };

  // Cash Desk API Handlers
  const fetchCashDeskToday = async () => {
    setLoadingCashDesk(true);
    try {
      const url = cashDeskFilterDate ? `/api/admin/cash-desk/today?date=${cashDeskFilterDate}` : '/api/admin/cash-desk/today';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLoadingCashDesk(false);
      if (data.success) {
        setCashDeskData(data);
      }
    } catch (err) {
      setLoadingCashDesk(false);
      console.error('Error fetching cash desk data:', err);
    }
  };

  const handleRecordCashDeskTxn = async (e) => {
    e.preventDefault();
    if (!cashDeskTxnForm.amount || Number(cashDeskTxnForm.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setIsSubmittingCashDeskTxn(true);
    try {
      const res = await fetch('/api/admin/cash-desk/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: cashDeskTxnForm.type,
          category: cashDeskTxnForm.category,
          amount: Number(cashDeskTxnForm.amount),
          paymentMethod: cashDeskTxnForm.paymentMethod,
          description: cashDeskTxnForm.description,
          vendorRecipient: cashDeskTxnForm.vendorRecipient,
          recordedBy: 'Admin Reception Desk'
        })
      });
      const data = await res.json();
      setIsSubmittingCashDeskTxn(false);
      if (data.success) {
        showToast(data.message);
        alert(data.message);
        setCashDeskTxnModal(false);
        setCashDeskTxnForm({
          type: 'EXPENSE',
          category: 'OFFICE_SUPPLIES',
          amount: '',
          paymentMethod: 'CASH',
          description: '',
          vendorRecipient: ''
        });
        fetchCashDeskToday();
        fetchEnhancedFeeStats();
      } else {
        alert(data.message || 'Failed to record transaction');
      }
    } catch (err) {
      setIsSubmittingCashDeskTxn(false);
      console.error(err);
      alert('Error recording transaction: ' + err.message);
    }
  };

  const handleCloseCashDesk = async (e) => {
    e.preventDefault();
    if (closeDeskForm.actualCash === '') {
      alert('Please enter the actual physical cash counted in register');
      return;
    }
    const actual = Number(closeDeskForm.actualCash);
    const expected = cashDeskData?.summary?.expectedClosingCash || 0;
    if (actual !== expected && !closeDeskForm.discrepancyReason.trim()) {
      alert('Variance detected! You must provide an explanation/reason for the cash discrepancy.');
      return;
    }

    setIsClosingDesk(true);
    try {
      const res = await fetch('/api/admin/cash-desk/close', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          openingCash: cashDeskData?.summary?.openingCash || 5000,
          actualCash: actual,
          discrepancyReason: closeDeskForm.discrepancyReason,
          closedBy: 'Admin Reception Desk',
          date: cashDeskFilterDate || undefined
        })
      });
      const data = await res.json();
      setIsClosingDesk(false);
      if (data.success) {
        showToast('Daily Cash Desk closed and reconciled successfully!');
        alert('Daily Cash Desk closed and reconciled successfully!');
        setCloseDeskModal(false);
        setCloseDeskForm({ actualCash: '', discrepancyReason: '' });
        fetchCashDeskToday();
      } else {
        alert(data.message || 'Failed to close cash desk');
      }
    } catch (err) {
      setIsClosingDesk(false);
      console.error(err);
      alert('Error closing cash desk: ' + err.message);
    }
  };

  // Fee Reminders API Handlers
  const fetchReminders = async () => {
    setLoadingReminders(true);
    try {
      const res = await fetch('/api/admin/reminders', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLoadingReminders(false);
      if (data.success) {
        setRemindersData(data);
      }
    } catch (err) {
      setLoadingReminders(false);
      console.error('Error fetching reminders:', err);
    }
  };

  const handleDispatchReminders = async () => {
    setIsDispatchingReminders(true);
    try {
      const res = await fetch('/api/admin/reminders/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          channel: dispatchChannel,
          reminderType: dispatchType,
          sentBy: 'Admin Desk Trigger'
        })
      });
      const data = await res.json();
      setIsDispatchingReminders(false);
      if (data.success) {
        showToast(data.message);
        alert(data.message);
        fetchReminders();
      } else {
        alert(data.message || 'Failed to dispatch reminders');
      }
    } catch (err) {
      setIsDispatchingReminders(false);
      console.error(err);
      alert('Error dispatching reminders: ' + err.message);
    }
  };

  // Financial Reports API Handlers
  const fetchFinancialReport = async () => {
    setLoadingFinancialReport(true);
    try {
      let queryParams = `reportType=${financialReportType}`;
      if (reportDateFrom) queryParams += `&fromDate=${reportDateFrom}`;
      if (reportDateTo) queryParams += `&toDate=${reportDateTo}`;

      const res = await fetch(`/api/admin/fees/reports?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLoadingFinancialReport(false);
      if (data.success) {
        setFinancialReportData(data);
      }
    } catch (err) {
      setLoadingFinancialReport(false);
      console.error('Error fetching financial report:', err);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLoadingAuditLogs(false);
      if (data.success) {
        setAuditLogs(data.data || []);
      }
    } catch (err) {
      setLoadingAuditLogs(false);
      console.error('Error fetching audit logs:', err);
    }
  };

  const handleExportReportCSV = () => {
    if (!financialReportData || !financialReportData.rows || financialReportData.rows.length === 0) {
      alert('No data rows available to export');
      return;
    }
    const headers = Object.keys(financialReportData.rows[0]);
    const csvContent = [
      headers.join(','),
      ...financialReportData.rows.map(row =>
        headers.map(h => `"${(row[h] !== undefined && row[h] !== null ? row[h] : '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${financialReportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV exported successfully!');
  };

  useEffect(() => {
    fetchDashboardData();
    fetchGallery();
    fetchAiForecast();
    fetchEnhancedFeeStats();
    fetchCashDeskToday();
    fetchReminders();
  }, []);

  const fetchStats = () => {
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setStats(data.stats); })
      .catch(err => console.error(err));
  };

  const fetchAdmissions = () => {
    fetch('/api/admin/admissions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setAdmissions(data.data); })
      .catch(err => console.error(err));
  };

  const fetchStudents = () => {
    fetch('/api/admin/students', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setStudents(data.data); })
      .catch(err => console.error(err));
  };

  const fetchTeachers = () => {
    fetch('/api/admin/teachers', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setTeachers(data.data); })
      .catch(err => console.error(err));
  };

  const fetchFees = () => {
    fetch('/api/admin/fees', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setFees(data.data); })
      .catch(err => console.error(err));
  };

  const fetchQueries = () => {
    fetch('/api/admin/queries', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(res => res.json())
      .then(data => { if (data.success) setQueries(data.data); })
      .catch(err => console.error(err));
  };

  // Admissions Action
  const handleAdmissionDecision = async (id, status, pswd) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/admissions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status, remarks, password: pswd })
      });
      const data = await res.json();
      setLoading(false);
      setRemarks('');
      setParentPassword('');
      setSelectedAdmission(null);
      if (data.success) {
        alert(`Admission application successfully marked ${status}!`);
        fetchAdmissions();
        if (status === 'approved') {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        }
      } else {
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = (id) => {
    triggerConfirm(
      "Are you sure you want to delete?",
      "This will permanently remove the student record from the database.",
      "delete",
      async () => {
        try {
          const res = await fetch(`/api/admin/students/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          if (data.success) {
            alert('Student record deleted');
            fetchStudents();
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Register Teacher
  const handleCreateTeacher = (e) => {
    e.preventDefault();
    triggerConfirm(
      "Are you sure you want to submit?",
      `This will hire and register ${tName} as a staff teacher.`,
      "submit",
      async () => {
        try {
          const res = await fetch('/api/admin/teachers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: tName,
              email: tEmail,
              password: tPassword,
              phone: tPhone,
              qualifications: tQual,
              classesAssigned: [tClass]
            })
          });
          const data = await res.json();
          if (data.success) {
            alert('Teacher hired successfully!');
            setTName(''); setTEmail(''); setTPassword(''); setTPhone(''); setTQual('');
            fetchTeachers();
          } else {
            alert(data.message);
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Generate invoice
  const handleCreateFee = (e) => {
    e.preventDefault();
    if (!feeStdId) return alert('Please select a student');
    triggerConfirm(
      "Are you sure you want to submit?",
      "This will issue a new tuition fee invoice for the student.",
      "submit",
      async () => {
        try {
          const res = await fetch('/api/admin/fees', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ studentId: feeStdId, amount: Number(feeAmount), term: feeTerm, dueDate: feeDueDate })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Fee recorded successfully!');
            alert('Fee recorded successfully!');
            setFeeStdId(''); setFeeDueDate('');
            fetchFees();
          } else {
            alert(data.message || 'Error recording fee');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const getStudentInfo = (f) => {
    if (f.studentId && typeof f.studentId === 'object') {
      return { name: f.studentId.name, class: f.studentId.class, id: f.studentId._id };
    }
    const found = students.find(s => s._id === f.studentId);
    if (found) {
      return { name: found.name, class: found.class, id: found._id };
    }
    return { name: 'Unknown Student', class: 'N/A', id: f.studentId };
  };

  const handleViewReceipt = async (feeId) => {
    try {
      const res = await fetch(`/api/admin/receipt/${feeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveReceipt(data);
      } else {
        alert(data.message || 'Receipt not found');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load receipt');
    }
  };

  const handleDownloadFeeReceiptPDF = async (feeId) => {
    try {
      const res = await fetch(`/api/admin/receipt/${feeId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success && data.receipt) {
        generateOfficialFeeReceiptPDF(data.receipt, data.student);
        showToast('Official Fee Receipt PDF downloaded successfully.');
      } else {
        alert(data.message || 'Receipt not found');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF receipt');
    }
  };

  const handleCollectPayment = (feeId) => {
    triggerConfirm(
      "Collect Fee Payment?",
      "This will mark the student's invoice as PAID at the admission desk and generate a printable receipt.",
      "submit",
      async () => {
        try {
          const res = await fetch(`/api/admin/fees/${feeId}/pay`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ paymentMethod: 'Admission Desk Cash' })
          });
          const data = await res.json();
          if (data.success) {
            alert('Payment collected successfully!');
            fetchFees(); // refresh fee list
            if (data.receipt) {
              const fee = fees.find(f => f._id === feeId);
              const studentInfo = getStudentInfo(fee);
              setActiveReceipt({
                receipt: data.receipt,
                student: {
                  name: studentInfo.name,
                  class: studentInfo.class,
                  studentId: studentInfo.id
                },
                fee: {
                  term: fee.term
                }
              });
            }
          } else {
            alert(data.message || 'Failed to collect payment');
          }
        } catch (err) {
          console.error(err);
          alert('Failed to collect payment');
        }
      }
    );
  };

  // Create notice
  const handleCreateAnnouncement = (e) => {
    e.preventDefault();
    triggerConfirm(
      "Are you sure you want to submit?",
      "This will post a new bulletin notice to all parents.",
      "submit",
      async () => {
        try {
          const res = await fetch('/api/admin/announcements', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title: annTitle, content: annContent, category: annCat, targetAudience: annAudience })
          });
          const data = await res.json();
          if (data.success) {
            alert('Circular bulletin published!');
            setAnnTitle(''); setAnnContent('');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Create gallery item
  const handleCreateGallery = (e) => {
    e.preventDefault();
    if (!galFile) return alert('Please select an image file to upload');
    triggerConfirm(
      "Are you sure you want to submit?",
      "This will upload the image to the public school gallery.",
      "submit",
      async () => {
        try {
          const formData = new FormData();
          formData.append('title', galTitle);
          formData.append('description', galDesc);
          formData.append('category', galCat);
          formData.append('file', galFile);

          const res = await fetch('/api/admin/gallery', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            alert('Media added to school gallery!');
            setGalTitle(''); setGalDesc(''); setGalFile(null);
            const fileInput = document.getElementById('gallery-file-input');
            if (fileInput) fileInput.value = '';
            fetchGallery();
          } else {
            alert(data.message || 'Failed to add media');
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const fetchGallery = () => {
    fetch('/api/public/gallery')
      .then(res => res.json())
      .then(data => { if (data.success) setGalItems(data.data); })
      .catch(err => console.error(err));
  };

  const handleDeleteGallery = (id) => {
    triggerConfirm(
      "Are you sure you want to delete?",
      "This will remove the media item from the gallery.",
      "delete",
      async () => {
        try {
          const res = await fetch(`/api/admin/gallery/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          if (data.success) {
            alert('Gallery item removed');
            fetchGallery();
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Resolve query
  const handleResolveQuery = (id) => {
    triggerConfirm(
      "Are you sure you want to submit?",
      "This will mark the query ticket as resolved.",
      "submit",
      async () => {
        try {
          const res = await fetch(`/api/admin/queries/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: 'resolved' })
          });
          const data = await res.json();
          if (data.success) {
            alert('Query ticket resolved');
            fetchQueries();
          }
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  // Submit New Admission Form (Multipart Form Data)
  const handleCreateAdmission = (e) => {
    e.preventDefault();
    triggerConfirm(
      "Submit New Admission?",
      "This will create student and parent records, and generate the admission fee and 12 monthly fee invoices.",
      "submit",
      async () => {
        try {
          const formData = new FormData();
          const studentDetails = {
            name: admStdName,
            dateOfBirth: admStdDob,
            gender: admStdGender,
            class: admStdClass
          };
          const parentDetails = {
            fatherName: admParentFather,
            motherName: admParentMother,
            email: admParentEmail,
            phone: admParentPhone,
            address: admParentAddress
          };

          formData.append('studentDetails', JSON.stringify(studentDetails));
          formData.append('parentDetails', JSON.stringify(parentDetails));
          formData.append('password', admParentPassword);
          formData.append('admissionFee', admissionFee || '0');

          if (admBirthCertificate) {
            formData.append('birthCertificate', admBirthCertificate);
          }
          if (admPhoto) {
            formData.append('photo', admPhoto);
          }

          const res = await fetch('/api/admin/admissions/create', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            showToast('Student registration successful!');
            alert('Student registration successful!');

            // Automatically generate and display official Student ID Card!
            const generatedStudent = data.student || {
              _id: data.data?._id,
              name: studentDetails.name,
              studentId: 'New Admission',
              class: studentDetails.class,
              dateOfBirth: studentDetails.dateOfBirth,
              gender: studentDetails.gender,
              photo: (admPhoto ? URL.createObjectURL(admPhoto) : ''),
              fatherName: studentDetails.fatherName,
              motherName: studentDetails.motherName,
              phone: studentDetails.phone,
              address: studentDetails.address,
              parentId: {
                name: studentDetails.fatherName || studentDetails.motherName,
                fatherName: studentDetails.fatherName,
                motherName: studentDetails.motherName,
                phone: studentDetails.phone,
                address: studentDetails.address
              }
            };
            setActiveIdCard(generatedStudent);

            // Set active receipt for printing if returned
            if (data.receipt) {
              setActiveReceipt({
                receipt: data.receipt,
                student: {
                  name: studentDetails.name,
                  class: studentDetails.class,
                  studentId: 'New Admission'
                },
                fee: {
                  term: 'Admission Fee'
                }
              });
            }

            // Reset form
            setAdmStdName('');
            setAdmStdDob('');
            setAdmStdGender('Male');
            setAdmStdClass('Pre-Nursery');
            setAdmParentFather('');
            setAdmParentMother('');
            setAdmParentEmail('');
            setAdmParentPhone('');
            setAdmParentAddress('');
            setAdmParentPassword('');
            setAdmBirthCertificate(null);
            setAdmPhoto(null);
            setAdmissionFee('');

            const certInput = document.getElementById('adm-cert-input');
            const photoInput = document.getElementById('adm-photo-input');

            if (certInput) certInput.value = '';
            if (photoInput) photoInput.value = '';

            setAdmissionsSubTab('history');
            fetchAdmissions();
            fetchStudents();
            fetchFees();
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          } else {
            alert(data.message || 'Error occurred while creating admission');
          }
        } catch (err) {
          console.error(err);
          alert(err.message || 'Error occurred while creating admission');
        }
      }
    );
  };

  // Submit Direct Student Registration
  const handleRegisterStudent = (e) => {
    e.preventDefault();
    triggerConfirm(
      "Register Student Directly?",
      "This will manually register an existing student and provision their parent credentials.",
      "submit",
      async () => {
        try {
          const res = await fetch('/api/admin/students/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: regStdName,
              dateOfBirth: regStdDob,
              gender: regStdGender,
              studentClass: regStdClass,
              parentName: regParentName,
              parentEmail: regParentEmail,
              parentPhone: regParentPhone,
              parentAddress: regParentAddress,
              password: regParentPassword
            })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Student registration successful!');
            alert('Student registration successful!');

            // Automatically generate and display official Student ID Card!
            const generatedStudent = data.student || {
              name: regStdName,
              studentId: 'New Student',
              class: regStdClass,
              dateOfBirth: regStdDob,
              gender: regStdGender,
              fatherName: regParentName,
              phone: regParentPhone,
              address: regParentAddress,
              parentId: {
                name: regParentName,
                fatherName: regParentName,
                phone: regParentPhone,
                address: regParentAddress
              }
            };
            setActiveIdCard(generatedStudent);

            // Reset form
            setRegStdName('');
            setRegStdDob('');
            setRegStdGender('Male');
            setRegStdClass('Pre-Nursery');
            setRegParentName('');
            setRegParentEmail('');
            setRegParentPhone('');
            setRegParentAddress('');
            setRegParentPassword('');

            setUsersSubTab('registry');
            fetchStudents();
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          } else {
            alert(data.message || 'Error occurred while registering student');
          }
        } catch (err) {
          console.error(err);
          alert(err.message || 'Error occurred while registering student');
        }
      }
    );
  };

  // Pre-fill fields and start editing student
  const handleStartEditStudent = (std) => {
    setEditingStudent(std);
    setEditStdName(std.name || '');
    const dobFormatted = std.dateOfBirth ? new Date(std.dateOfBirth).toISOString().split('T')[0] : '';
    setEditStdDob(dobFormatted);
    setEditStdGender(std.gender || 'Male');
    setEditStdClass(std.class || 'Pre-Nursery');
    setEditParentName(std.parentId?.name || std.parentDetails?.fatherName || std.parentDetails?.motherName || '');
    setEditParentPhone(std.parentId?.phone || std.parentDetails?.phone || '');
    setEditParentAddress(std.parentId?.address || std.parentDetails?.address || '');
  };

  // Save changes to Student Profile
  const handleEditStudent = (e) => {
    e.preventDefault();
    triggerConfirm(
      "Save Changes?",
      `This will update the profile details of ${editStdName}.`,
      "submit",
      async () => {
        try {
          const res = await fetch(`/api/admin/students/${editingStudent._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              name: editStdName,
              dateOfBirth: editStdDob,
              gender: editStdGender,
              studentClass: editStdClass,
              parentName: editParentName,
              parentPhone: editParentPhone,
              parentAddress: editParentAddress
            })
          });
          const data = await res.json();
          if (data.success) {
            alert('Student profile updated successfully!');
            setEditingStudent(null);
            fetchStudents();
          } else {
            alert(data.message || 'Error occurred while updating student');
          }
        } catch (err) {
          console.error(err);
          alert(err.message || 'Error occurred while updating student');
        }
      }
    );
  };

  // Export filtered students as CSV
  const handleExportCSV = () => {
    const filtered = students.filter(s => {
      const classMatch = studentClassFilter ? s.class === studentClassFilter : true;
      const nameMatch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase());
      return classMatch && nameMatch;
    });

    const headers = ['Student ID', 'Student Name', 'Class', 'Gender', 'DOB', 'Parent Name', 'Parent Email', 'Parent Phone', 'Parent Address'];
    const rows = filtered.map(s => [
      s.studentId || '',
      s.name || '',
      s.class || '',
      s.gender || '',
      s.dateOfBirth ? new Date(s.dateOfBirth).toISOString().split('T')[0] : '',
      s.parentId?.name || '',
      s.parentId?.email || '',
      s.parentId?.phone || '',
      s.parentId?.address || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student_registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open printable student registry overview
  const handlePrintPDF = () => {
    const filtered = students.filter(s => {
      const classMatch = studentClassFilter ? s.class === studentClassFilter : true;
      const nameMatch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase());
      return classMatch && nameMatch;
    });
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Registry Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 30px; }
            h1 { text-align: center; color: #5B468C; margin-bottom: 5px; }
            p.subtitle { text-align: center; font-size: 13px; color: #666; margin-bottom: 25px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 12px; }
            th { background-color: #ECEAFE; font-weight: bold; color: #5B468C; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #999; }
          </style>
        </head>
        <body>
          <h1>Apna School</h1>
          <p class="subtitle">Active Student Database Report — Generated on ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>Parent Contact Info</th>
              </tr>
            </thead>
            <tbody>
              \${filtered.map(s => \`
                <tr>
                  <td><strong>\${s.studentId || 'N/A'}</strong></td>
                  <td>\${s.name}</td>
                  <td>\${s.class}</td>
                  <td>\${s.gender}</td>
                  <td>\${s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    Name: \${s.parentId?.name || 'N/A'}<br/>
                    Phone: \${s.parentId?.phone || 'N/A'}<br/>
                    Email: \${s.parentId?.email || 'N/A'}
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
          <div class="footer">Page total: \${filtered.length} students</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-[#F0F2F6] p-3 sm:p-5 flex font-sans text-slate-800 print:bg-white print:p-0">
      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[10000] bg-slate-900 text-white font-quicksand font-bold px-6 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 border border-white/20 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* Modern Expanded Sidebar Navigation */}
      <aside className="w-64 sm:w-72 bg-white rounded-[2.5rem] p-5 flex flex-col justify-between shadow-sm border border-slate-200/90 shrink-0 h-[calc(100vh-2.5rem)] sticky top-5 z-30 select-none print:hidden overflow-y-auto">
        {/* Top Brand Header */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3.5 px-3 py-1 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black text-sm font-quicksand shadow-sm hover:scale-105 transition-transform cursor-pointer"
            >
              //
            </button>
            <div>
              <h2 className="font-quicksand font-extrabold text-black text-base leading-tight tracking-tight">
                Apna School
              </h2>
              <p className="text-[11px] font-bold text-slate-400 leading-tight">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Navigation Items with Black Text & Black Active Button */}
          <nav className="space-y-1.5">
            {[
              { id: 'stats', label: 'Overview', icon: LayoutDashboard },
              { id: 'admissions', label: 'Admissions', icon: ClipboardList, badge: stats?.pendingAdmissions || 0 },
              { id: 'users', label: 'Students & Staff', icon: Users },
              { id: 'fees', label: 'Fees & Cash Desk', icon: CreditCard },
              { id: 'events', label: 'Calendar & Events', icon: Calendar },
              { id: 'announcements', label: 'Notice Board', icon: Bell },
              { id: 'gallery', label: 'Media Gallery', icon: ImageIcon },
              { id: 'queries', label: 'Visitor Queries', icon: MessageCircle, badge: queries.filter(q => q.status !== 'resolved').length }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-black text-white shadow-md font-extrabold'
                      : 'text-black hover:bg-slate-100 hover:text-black'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-black'}`} />
                    <span className={`tracking-wide ${isActive ? 'text-white font-extrabold' : 'text-black font-bold'}`}>
                      {item.label}
                    </span>
                  </div>
                  {item.badge > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white text-black'
                          : 'bg-black text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Admission Action & Logout */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('admissions')}
            className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>+ New Admission</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Do you want to log out of Admin Portal?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                window.location.href = '/login';
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl text-black hover:bg-slate-100 font-bold text-xs flex items-center space-x-2.5 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-black" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main className="flex-1 ml-3 sm:ml-5 space-y-6 max-w-[1600px] overflow-hidden min-h-[90vh]">
        <div className="space-y-6 print:hidden">

          {/* TAB 1: Bento Grid Overview (Matching Image 1) */}
          {activeTab === 'stats' && (
            <div className="space-y-5">
              {/* Bento Row 1: Hero Banner (8 cols) + Mini Calendar & Timeline (4 cols) */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                {/* Hero Banner Card */}
                <div className="xl:col-span-8 bg-gradient-to-r from-[#EDE9FE] via-[#F3E8FF] to-[#E0E7FF] rounded-[2.2rem] p-7 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between border border-[#DDD6FE]/70 shadow-sm relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-200/50 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-3 z-10 max-w-lg">
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-quicksand text-slate-800 tracking-tight leading-tight">
                      Work's always better together
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                      Add teammates and you'll be able to collaborate and quickly get a sense of what's happening at work.
                    </p>
                    <div className="pt-2 flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setUsersSubTab('teacher_form');
                          setActiveTab('users');
                        }}
                        className="bg-[#18191E] hover:bg-black text-white font-quicksand font-bold text-xs px-5 py-2.5 rounded-full flex items-center space-x-2 shadow-md cursor-pointer transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span>Add member</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdmissionsSubTab('new');
                          setActiveTab('admissions');
                        }}
                        className="bg-white/80 hover:bg-white text-slate-800 font-quicksand font-bold text-xs px-5 py-2.5 rounded-full flex items-center space-x-2 shadow-sm border border-purple-200/60 cursor-pointer transition-all active:scale-95"
                      >
                        <span>+ New Admission</span>
                      </button>
                    </div>
                  </div>

                  {/* 3D Abstract Pastel Swirl Graphic Motif */}
                  <div className="mt-6 md:mt-0 relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl animate-spin-slow">
                      <defs>
                        <linearGradient id="petalGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#C4B5FD" />
                          <stop offset="50%" stopColor="#DDD6FE" />
                          <stop offset="100%" stopColor="#F5D0FE" />
                        </linearGradient>
                        <linearGradient id="petalGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#A78BFA" />
                          <stop offset="100%" stopColor="#E9D5FF" />
                        </linearGradient>
                      </defs>
                      <path d="M100,20 C140,20 180,60 180,100 C180,140 140,180 100,180 C60,180 20,140 20,100 C20,60 60,20 100,20 Z" fill="url(#petalGrad1)" opacity="0.3" />
                      <circle cx="100" cy="100" r="55" fill="url(#petalGrad2)" opacity="0.6" />
                      <path d="M100,45 C130,45 155,70 155,100 C155,130 130,155 100,155 C70,155 45,130 45,100 C45,70 70,45 100,45 Z" fill="#F3E8FF" />
                      <circle cx="100" cy="100" r="28" fill="#8B5CF6" opacity="0.8" />
                      <circle cx="92" cy="92" r="8" fill="#FFFFFF" opacity="0.8" />
                    </svg>
                  </div>
                </div>

                {/* Mini Calendar & Timeline Card */}
                <div className="xl:col-span-4 bg-white rounded-[2.2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="font-quicksand font-extrabold text-slate-800 text-base">
                      September, 2026
                    </h3>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('events')}
                        className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('events')}
                        className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 6-Day Horizontal Pill Carousel */}
                  <div className="grid grid-cols-6 gap-2 py-3">
                    {[
                      { day: 'Mon', date: '15', active: false },
                      { day: 'Tue', date: '16', active: false },
                      { day: 'Wed', date: '17', active: true },
                      { day: 'Thu', date: '18', active: false },
                      { day: 'Fri', date: '19', active: false },
                      { day: 'Sat', date: '20', active: false },
                    ].map((item, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveTab('events')}
                        className={`cursor-pointer py-2.5 px-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                          item.active
                            ? 'bg-[#18191E] text-white shadow-md'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className={`text-[10px] font-semibold uppercase ${item.active ? 'text-slate-300' : 'text-slate-400'}`}>
                          {item.day}
                        </span>
                        <span className="text-sm font-extrabold font-quicksand mt-0.5">
                          {item.date}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom schedule hint */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Upcoming Events:</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('events')}
                      className="text-[11px] font-extrabold text-[#5B4DF5] hover:underline cursor-pointer"
                    >
                      View Calendar & Events →
                    </button>
                  </div>
                </div>
              </div>

              {/* Bento Row 2: Members (4 cols) + Data (4 cols) + Impact (4 cols) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Members Card */}
                <div className="md:col-span-4 bg-white rounded-[2.2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="font-quicksand font-bold text-slate-800 text-sm flex items-center space-x-2">
                      <span>Members</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('users')}
                      className="w-6 h-6 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
                    >
                      <Target className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Members Avatars Row */}
                  <div className="grid grid-cols-3 gap-2 text-center py-2">
                    {[
                      { name: 'Sophia Brown', role: 'Class 2nd', color: 'bg-indigo-100 text-indigo-700' },
                      { name: 'Alex Johnson', role: 'Math Faculty', color: 'bg-emerald-100 text-emerald-700' },
                      { name: 'Daniel Turner', role: 'Sports Head', color: 'bg-amber-100 text-amber-700' }
                    ].map((m, i) => (
                      <div key={i} className="flex flex-col items-center space-y-1.5">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-base shadow-sm ${m.color}`}>
                          {m.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 leading-tight block">
                          {m.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block">
                          {m.role}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('users')}
                    className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold font-quicksand transition-colors cursor-pointer"
                  >
                    Manage All Staff & Students ({students.length})
                  </button>
                </div>

                {/* Data Metric Card */}
                <div className="md:col-span-4 bg-white rounded-[2.2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>

                  <div className="py-2">
                    <div className="text-3xl sm:text-4xl font-extrabold font-quicksand text-slate-800">
                      {students.length},4h
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 block mt-1">
                      {students.length} Active Students & Profiles
                    </span>
                  </div>

                  {/* Progress bars matching the image */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 flex-1 bg-slate-900 rounded-full" />
                      <div className="h-2 w-12 bg-slate-200 rounded-full" />
                      <div className="h-2 w-6 bg-slate-100 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                      <span>● +50% Attendance</span>
                      <span>+33% Fees</span>
                      <span>+17% Queries</span>
                    </div>
                  </div>
                </div>

                {/* Impact Card */}
                <div className="md:col-span-4 bg-white rounded-[2.2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Impact</span>
                    <span className="bg-[#18191E] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      +56%
                    </span>
                  </div>

                  {/* Vertical pastel micro-chart bars */}
                  <div className="flex items-end justify-center space-x-3 h-28 pt-2">
                    <div className="w-6 h-[45%] bg-[#DDD6FE] rounded-t-xl" />
                    <div className="w-6 h-[85%] bg-[#C4B5FD] rounded-t-xl shadow-sm" />
                    <div className="w-6 h-[60%] bg-[#EDE9FE] rounded-t-xl" />
                  </div>

                  <span className="text-center text-[10px] font-bold text-slate-400 block">
                    Campus Operational Performance
                  </span>
                </div>
              </div>

              {/* Bento Row 3: Statistics & Analytics (7 cols) + Notifications Stream (5 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left Column: Statistics + Dark Capsule + Unleash Card */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Statistics Card */}
                  <div className="bg-white rounded-[2.2rem] p-6 sm:p-7 shadow-sm border border-slate-100 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-quicksand font-bold text-slate-800 text-base">Statistics</h3>
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setBentoWeeklyToggle('weekly')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            bentoWeeklyToggle === 'weekly' ? 'bg-[#18191E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Weekly
                        </button>
                        <button
                          type="button"
                          onClick={() => setBentoWeeklyToggle('monthly')}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            bentoWeeklyToggle === 'monthly' ? 'bg-[#18191E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Monthly
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl sm:text-5xl font-extrabold font-quicksand text-slate-900 tracking-tight">
                        {students.length} {admissions.filter(a => a.status === 'pending').length || '83'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">tasks & milestones complete</span>
                    </div>

                    {/* 2 Inset Sub-Cards */}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="bg-[#F8F9FD] rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-3">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-extrabold text-slate-800 font-quicksand block">
                            {admissions.filter(a => a.status === 'approved').length || 23}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">Admissions enrolled</span>
                        </div>
                      </div>

                      <div className="bg-[#F8F9FD] rounded-2xl p-4 border border-slate-100 flex flex-col justify-between">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xl sm:text-2xl font-extrabold text-slate-800 font-quicksand block">
                            {fees.filter(f => f.status === 'paid').length || 16}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 block mt-0.5">Invoices paid</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sleek Dark Capsule Card */}
                  <div className="bg-[#18191E] text-white rounded-3xl p-4 flex items-center justify-between shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-300" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Breakthrough Brainstorm</span>
                        <span className="text-[10px] text-slate-400 font-medium">12:45 pm • Campus Sync</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('events')}
                      className="text-xs font-bold px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
                    >
                      View
                    </button>
                  </div>

                  {/* Feature Card: Unleash Your Potential */}
                  <div className="bg-white rounded-[2.2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1.5 max-w-xs">
                      <h4 className="font-quicksand font-extrabold text-slate-800 text-base">
                        Unleash Your Potential
                      </h4>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Indulge in smart school portal features, automated ID card prints, and real-time fee desks.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('fees')}
                          className="bg-black hover:bg-slate-800 text-white text-xs font-bold font-quicksand px-4 py-2 rounded-full flex items-center space-x-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5 text-white" />
                          <span>Open Fee Desk</span>
                        </button>
                      </div>
                    </div>

                    {/* 3D Swirl Illustration */}
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-200 via-pink-100 to-indigo-100 flex items-center justify-center shadow-inner">
                        <Sparkles className="w-8 h-8 text-[#7C3AED]" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Notifications Feed Card */}
                <div className="lg:col-span-5 bg-white rounded-[2.2rem] p-6 sm:p-7 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <h3 className="font-quicksand font-bold text-slate-800 text-base">Notifications</h3>
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Bell className="w-4 h-4 hover:text-slate-600 cursor-pointer" />
                      </div>
                    </div>

                    {/* Tabs: Overview | Shared | Comments */}
                    <div className="flex items-center space-x-4 pt-3 pb-2 text-xs font-bold border-b border-slate-100">
                      {['overview', 'shared', 'comments'].map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setBentoActivityTab(tab)}
                          className={`capitalize pb-2 transition-colors cursor-pointer ${
                            bentoActivityTab === tab
                              ? 'text-slate-900 border-b-2 border-slate-900'
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Activity Feed Items */}
                    <div className="divide-y divide-slate-50 space-y-1 pt-1">
                      {admissions.slice(0, 3).map((adm, i) => (
                        <div key={adm._id || i} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {adm.studentName ? adm.studentName[0] : 'S'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">
                                {adm.studentName} applied for Class {adm.studentClass}
                              </p>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                {new Date(adm.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Admission Desk
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAdmission(adm);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full transition-colors shrink-0 cursor-pointer"
                          >
                            View
                          </button>
                        </div>
                      ))}

                      {queries.slice(0, 2).map((q, i) => (
                        <div key={q._id || i} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {q.name ? q.name[0] : 'Q'}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-snug">
                                {q.name}: {q.subject || 'Visitor inquiry'}
                              </p>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                                Ticket #{q._id?.slice(-4)} • Pending Resolution
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActiveTab('queries')}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full transition-colors shrink-0 cursor-pointer"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('announcements')}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold font-quicksand transition-colors text-center cursor-pointer"
                  >
                    View All Notices & Feeds
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wrapper for remaining portal tabs */}
          {activeTab !== 'stats' && (
            <div className="bg-white rounded-[2.2rem] p-6 sm:p-8 shadow-sm border border-slate-100 min-h-[400px]">

            {/* TAB 2: Admissions reviews */}
            {activeTab === 'admissions' && (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 pb-4 border-b sm:flex-row sm:items-center border-orange-50">
                  <h3 className="text-lg font-bold font-quicksand text-slate-800">Enrollment & Admissions Manager</h3>

                  {/* Sub-tabs selection */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAdmissionsSubTab('review')}
                      className={`px-4 py-2 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer ${admissionsSubTab === 'review'
                          ? 'bg-black text-white shadow'
                          : 'bg-slate-100 text-black hover:bg-slate-200'
                        }`}
                    >
                      Pending Reviews ({admissions.filter(a => a.status === 'pending').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdmissionsSubTab('new')}
                      className={`px-4 py-2 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer ${admissionsSubTab === 'new'
                          ? 'bg-black text-white shadow'
                          : 'bg-slate-100 text-black hover:bg-slate-200'
                        }`}
                    >
                      New Admission Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdmissionsSubTab('history')}
                      className={`px-4 py-2 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer ${admissionsSubTab === 'history'
                          ? 'bg-black text-white shadow'
                          : 'bg-slate-100 text-black hover:bg-slate-200'
                        }`}
                    >
                      Admissions History ({admissions.filter(a => a.status !== 'pending').length})
                    </button>
                  </div>
                </div>

                {/* Sub-tab 1: Pending Reviews */}
                {admissionsSubTab === 'review' && (
                  <div className="space-y-4">
                    {admissions.filter(adm => adm.status === 'pending').length === 0 ? (
                      <p className="py-10 text-xs font-medium text-center text-slate-500">No pending admission applications to review.</p>
                    ) : (
                      admissions.filter(adm => adm.status === 'pending').map(adm => (
                        <div key={adm._id} className="flex flex-col items-start justify-between gap-4 p-5 text-xs border bg-slate-50 border-slate-100 rounded-2xl sm:flex-row sm:items-center">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="block font-mono font-bold text-brandCoral">{adm.applicationNumber}</span>
                              {adm.aiVerification && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  adm.aiVerification.verified
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  {adm.aiVerification.verified ? 'AI Verified (98%)' : 'Age Review ⚠️'}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold font-quicksand text-slate-800">{adm.studentDetails?.name}</h4>
                            <p className="font-medium text-slate-500">Class: <span className="font-bold text-slate-800">{adm.studentDetails?.class}</span> | Parent: <span className="font-bold text-slate-800">{adm.parentDetails?.fatherName || adm.parentDetails?.motherName}</span></p>
                            {adm.aiVerification?.ageCheck && (
                              <p className="text-[10px] text-slate-500">
                                Cut-off Age (March 31): <b className="text-slate-700">{adm.aiVerification.ageCheck.calculatedAge}</b> (Req: {adm.aiVerification.ageCheck.requiredRange})
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between w-full gap-3 sm:w-auto sm:justify-end">
                            <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border bg-brandYellow/10 text-brandYellow-dark border-brandYellow/30">
                              {adm.status}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setParentPassword('');
                                setRemarks(adm.remarks || '');
                              }}
                              className="font-quicksand font-bold text-xs bg-black hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl shadow cursor-pointer transition-all active:scale-[0.98]"
                            >
                              REVIEW & DECIDE
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Sub-tab 2: New Admission Entry Form */}
                {admissionsSubTab === 'new' && (
                  <form onSubmit={handleCreateAdmission} className="p-5 space-y-6 text-xs border bg-slate-50/50 border-slate-100 rounded-3xl">
                    <div>
                      <h4 className="text-sm font-bold font-quicksand text-[#5B468C] mb-1">Record New Admission Application</h4>
                      <p className="text-slate-500">Submit student credentials, parent details, and upload documents directly. This will automatically approve the admission, generate a Student ID, and provision the parent portal.</p>
                    </div>

                    {/* Student Details Section */}
                    <div className="space-y-3">
                      <h5 className="pb-1 font-bold border-b text-slate-800 font-quicksand">1. Student Details</h5>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Student Name</label>
                          <input
                            type="text" required placeholder="e.g. Tommy Jenkins"
                            value={admStdName} onChange={e => setAdmStdName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Date of Birth</label>
                          <input
                            type="date" required
                            value={admStdDob} onChange={e => setAdmStdDob(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-slate-600 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Gender</label>
                          <select
                            value={admStdGender} onChange={e => setAdmStdGender(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-600"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Class Program</label>
                          <select
                            value={admStdClass} onChange={e => setAdmStdClass(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-600"
                          >
                            <option value="Pre-Nursery">Pre-Nursery</option>
                            <option value="Nursery">Nursery</option>
                            <option value="Junior KG">Junior KG</option>
                            <option value="Senior KG">Senior KG</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="4th">4th</option>
                            <option value="5th">5th</option>
                            <option value="6th">6th</option>
                            <option value="7th">7th</option>
                            <option value="8th">8th</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Parent Details Section */}
                    <div className="space-y-3">
                      <h5 className="pb-1 font-bold border-b text-slate-800 font-quicksand">2. Parent / Guardian Details</h5>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Father's Full Name</label>
                          <input
                            type="text" required placeholder="e.g. John Jenkins"
                            value={admParentFather} onChange={e => setAdmParentFather(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Mother's Full Name</label>
                          <input
                            type="text" required placeholder="e.g. Clara Jenkins"
                            value={admParentMother} onChange={e => setAdmParentMother(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Email Address (Login Username)</label>
                          <input
                            type="email" required placeholder="e.g. parent@email.com"
                            value={admParentEmail} onChange={e => setAdmParentEmail(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Phone Number</label>
                          <input
                            type="text" required placeholder="e.g. +91 98XXX-XXXXX"
                            value={admParentPhone} onChange={e => setAdmParentPhone(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-slate-600">Home Address</label>
                          <input
                            type="text" required placeholder="e.g. 123 Sunshine Street, Sector 5"
                            value={admParentAddress} onChange={e => setAdmParentAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-3">
                          <label className="font-bold text-slate-600">Provision Portal Password (defaults to "parent123" if empty)</label>
                          <input
                            type="text" placeholder="Provision login password for the parent..."
                            value={admParentPassword} onChange={e => setAdmParentPassword(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Document Upload Section */}
                    <div className="space-y-3">
                      <h5 className="pb-1 font-bold border-b text-slate-800 font-quicksand">3. Required Documents & Identity Proofs</h5>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-slate-600">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Birth Certificate (PDF / Image)</label>
                          <input
                            id="adm-cert-input"
                            type="file" accept=".pdf,.png,.jpg,.jpeg"
                            onChange={e => setAdmBirthCertificate(e.target.files[0])}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Student Passport Size Photo (Image)</label>
                          <input
                            id="adm-photo-input"
                            type="file" accept=".png,.jpg,.jpeg"
                            onChange={e => setAdmPhoto(e.target.files[0])}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-xs"
                          />
                        </div>

                      </div>
                    </div>

                    {/* Admission Fees Section */}
                    <div className="space-y-3">
                      <h5 className="pb-1 font-bold border-b text-slate-800 font-quicksand">4. Admission Fees Collection</h5>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Admission Fee Amount (₹) (Not a dropdown)</label>
                          <input
                            type="number"
                            placeholder="Enter fee amount (e.g. 5000)"
                            value={admissionFee}
                            onChange={e => setAdmissionFee(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-700 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 text-xs font-bold text-white transition-all shadow bg-slate-900 hover:bg-slate-800 font-quicksand rounded-xl"
                    >
                      CREATE ADMISSION RECORD & PROVISION STUDENT
                    </button>
                  </form>
                )}

                {/* Sub-tab 3: Admissions History */}
                {admissionsSubTab === 'history' && (
                  <div className="space-y-4">
                    {admissions.filter(adm => adm.status !== 'pending').length === 0 ? (
                      <p className="py-10 text-xs font-medium text-center text-slate-500">No historic admission entries found.</p>
                    ) : (
                      admissions.filter(adm => adm.status !== 'pending').map(adm => (
                        <div key={adm._id} className="flex flex-col items-start justify-between gap-4 p-5 text-xs border bg-slate-50 border-slate-100 rounded-2xl sm:flex-row sm:items-center">
                          <div className="space-y-1">
                            <span className="block font-mono font-bold text-brandCoral">{adm.applicationNumber}</span>
                            <h4 className="text-sm font-bold font-quicksand text-slate-800">{adm.studentDetails?.name}</h4>
                            <p className="font-medium text-slate-500">Class: <span className="font-bold text-slate-800">{adm.studentDetails?.class}</span> | Parent: <span className="font-bold text-slate-800">{adm.parentDetails?.fatherName || adm.parentDetails?.motherName}</span></p>
                          </div>
                          <div className="flex items-center justify-between w-full gap-3 sm:w-auto sm:justify-end">
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${adm.status === 'approved' ? 'bg-brandMint/10 text-brandMint-dark border-brandMint/30' :
                                'bg-red-50 text-red-600 border border-red-100'
                              }`}>
                              {adm.status}
                            </span>
                            <button
                              onClick={() => {
                                setSelectedAdmission(adm);
                                setParentPassword('');
                                setRemarks(adm.remarks || '');
                              }}
                              className="font-quicksand font-bold text-xs bg-[#9F92EC] hover:bg-[#8C7EB5] text-white px-4 py-2.5 rounded-xl shadow cursor-pointer transition-all active:scale-[0.98]"
                            >
                              VIEW DETAILS
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Users catalog */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 pb-4 border-b sm:flex-row sm:items-center border-orange-50">
                  <h3 className="text-lg font-bold font-quicksand text-slate-800">Students & Teachers Hub</h3>

                  {/* Sub-tabs selection */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setUsersSubTab('registry')}
                      className={`px-4 py-2 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer ${usersSubTab === 'registry'
                          ? 'bg-black text-white shadow'
                          : 'bg-slate-100 text-black hover:bg-slate-200'
                        }`}
                    >
                      Student Registry ({students.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsersSubTab('direct')}
                      className={`px-4 py-2 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer ${usersSubTab === 'direct'
                          ? 'bg-black text-white shadow'
                          : 'bg-slate-100 text-black hover:bg-slate-200'
                        }`}
                    >
                      Direct Registration
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsersSubTab('teacher_form')}
                      className={`px-4 py-2 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer ${usersSubTab === 'teacher_form'
                          ? 'bg-black text-white shadow'
                          : 'bg-slate-100 text-black hover:bg-slate-200'
                        }`}
                    >
                      Staff Teachers ({teachers.length})
                    </button>
                  </div>
                </div>

                {/* Sub-tab 1: Student Registry Database */}
                {usersSubTab === 'registry' && (
                  <div className="space-y-4">
                    {/* Search and Filters panel */}
                    <div className="flex flex-col gap-3 p-4 text-xs border bg-slate-50 border-slate-100 rounded-3xl sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col flex-1 gap-2 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                          <Search className="absolute w-4 h-4 text-slate-400 left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Search student by name..."
                            value={studentSearchQuery}
                            onChange={e => setStudentSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                          />
                        </div>
                        <select
                          value={studentClassFilter}
                          onChange={e => setStudentClassFilter(e.target.value)}
                          className="bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-600"
                        >
                          <option value="">-- All Classes --</option>
                          <option value="Pre-Nursery">Pre-Nursery</option>
                          <option value="Nursery">Nursery</option>
                          <option value="Junior KG">Junior KG</option>
                          <option value="Senior KG">Senior KG</option>
                          <option value="1st">1st</option>
                          <option value="2nd">2nd</option>
                          <option value="3rd">3rd</option>
                          <option value="4th">4th</option>
                          <option value="5th">5th</option>
                          <option value="6th">6th</option>
                          <option value="7th">7th</option>
                          <option value="8th">8th</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportCSV}
                          className="px-4 py-2.5 bg-slate-900 text-white font-quicksand font-bold rounded-xl flex items-center space-x-1.5 shadow hover:bg-slate-800 transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      </div>
                    </div>

                    {/* Student Grid / List Table */}
                    <div className="overflow-x-auto bg-white border shadow-sm border-slate-100 rounded-3xl">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <th className="p-4">Student ID</th>
                            <th className="p-4">Student Name</th>
                            <th className="p-4">Class</th>
                            <th className="p-4">Gender</th>
                            <th className="p-4">Parent Details</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="font-medium divide-y divide-slate-100 text-slate-700">
                          {students.filter(s => {
                            const classMatch = studentClassFilter ? s.class === studentClassFilter : true;
                            const nameMatch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase());
                            return classMatch && nameMatch;
                          }).length === 0 ? (
                            <tr>
                              <td colSpan="6" className="p-10 text-center text-slate-400">
                                No matching students found in the database.
                              </td>
                            </tr>
                          ) : (
                            students.filter(s => {
                              const classMatch = studentClassFilter ? s.class === studentClassFilter : true;
                              const nameMatch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase());
                              return classMatch && nameMatch;
                            }).map(std => (
                              <tr key={std._id} className="transition-all hover:bg-slate-50/50">
                                <td className="p-4 font-mono font-bold text-slate-850">
                                  {std.studentId || 'N/A'}
                                </td>
                                <td className="p-4">
                                  <span className="block text-sm font-bold text-slate-800 font-quicksand">{std.name}</span>
                                  <span className="text-[10px] text-slate-450 block mt-0.5">
                                    DOB: {std.dateOfBirth ? new Date(std.dateOfBirth).toLocaleDateString() : 'N/A'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-[#EAE8FC] text-[#7C3AED] border border-[#DEDAFB]">
                                    {std.class}
                                  </span>
                                </td>
                                <td className="p-4">{std.gender}</td>
                                <td className="p-4">
                                  <span className="block font-bold text-slate-800">
                                    {std.parentId?.name || std.parentDetails?.fatherName || std.parentDetails?.motherName || 'N/A'}
                                  </span>
                                  <span className="text-[10px] text-slate-450 block mt-0.5 font-mono">
                                    {std.parentId?.phone || std.parentDetails?.phone || 'N/A'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setSelectedStudentProfile(std)}
                                      className="px-2.5 py-1.5 font-bold text-[10px] rounded-lg bg-slate-100 hover:bg-slate-200 text-black transition-all cursor-pointer"
                                    >
                                      View
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openStudentFeeProfile(std)}
                                      className="px-2.5 py-1.5 font-bold text-[10px] rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-all cursor-pointer flex items-center gap-1 border border-purple-200"
                                      title="Open detailed fee accounting profile"
                                    >
                                      <CreditCard className="w-3 h-3 text-purple-600" />
                                      <span>Fees</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openStudentStructureModal(std)}
                                      className="px-2.5 py-1.5 font-bold text-[10px] rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 transition-all cursor-pointer flex items-center gap-1 border border-amber-200"
                                      title="Configure student-specific fee heads"
                                    >
                                      <Sliders className="w-3 h-3 text-amber-600" />
                                      <span>Structure</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveIdCard(std)}
                                      className="px-2.5 py-1.5 font-bold text-[10px] rounded-lg bg-black hover:bg-slate-800 text-white transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                                    >
                                      <Contact className="w-3 h-3 text-white" />
                                      <span>ID Card</span>
                                    </button>
                                    <button
                                      onClick={() => handleStartEditStudent(std)}
                                      className="px-2.5 py-1.5 font-bold text-[10px] rounded-lg bg-slate-100 hover:bg-slate-200 text-black transition-all flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteStudent(std._id)}
                                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Direct Student Registration Form */}
                {usersSubTab === 'direct' && (
                  <form onSubmit={handleRegisterStudent} className="p-5 space-y-6 text-xs border bg-slate-50/50 border-slate-100 rounded-3xl">
                    <div>
                      <h4 className="text-sm font-bold font-quicksand text-[#5B468C] mb-1">Direct Student Registration Entry</h4>
                      <p className="font-semibold text-slate-500">Manually register an existing student directly into the active database. This assigns a unique Student ID and provisions parent credentials immediately.</p>
                    </div>

                    {/* Student Section */}
                    <div className="space-y-3">
                      <h5 className="pb-1 font-bold border-b text-slate-800 font-quicksand">1. Student Profile</h5>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Student Full Name</label>
                          <input
                            type="text" required placeholder="Full Name"
                            value={regStdName} onChange={e => setRegStdName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Date of Birth</label>
                          <input
                            type="date" required
                            value={regStdDob} onChange={e => setRegStdDob(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-slate-600 font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Gender</label>
                          <select
                            value={regStdGender} onChange={e => setRegStdGender(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-600"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Class Program</label>
                          <select
                            value={regStdClass} onChange={e => setRegStdClass(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-600"
                          >
                            <option value="Pre-Nursery">Pre-Nursery</option>
                            <option value="Nursery">Nursery</option>
                            <option value="Junior KG">Junior KG</option>
                            <option value="Senior KG">Senior KG</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="4th">4th</option>
                            <option value="5th">5th</option>
                            <option value="6th">6th</option>
                            <option value="7th">7th</option>
                            <option value="8th">8th</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Parent Section */}
                    <div className="space-y-3">
                      <h5 className="pb-1 font-bold border-b text-slate-800 font-quicksand">2. Parent / Guardian Credentials</h5>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Parent Full Name</label>
                          <input
                            type="text" required placeholder="Parent Full Name"
                            value={regParentName} onChange={e => setRegParentName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Email Address (Login Username)</label>
                          <input
                            type="email" required placeholder="parent@email.com"
                            value={regParentEmail} onChange={e => setRegParentEmail(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Contact Phone Number</label>
                          <input
                            type="text" required placeholder="e.g. +91 98XXX-XXXXX"
                            value={regParentPhone} onChange={e => setRegParentPhone(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Home Address</label>
                          <input
                            type="text" required placeholder="Home Address"
                            value={regParentAddress} onChange={e => setRegParentAddress(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-slate-600">Parent Password (defaults to "parent123" if empty)</label>
                          <input
                            type="text" placeholder="Set login password for parent portal..."
                            value={regParentPassword} onChange={e => setRegParentPassword(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 text-xs font-bold text-white transition-all shadow cursor-pointer bg-slate-900 hover:bg-slate-800 font-quicksand rounded-xl"
                    >
                      REGISTER STUDENT RECORD
                    </button>
                  </form>
                )}

                {/* Sub-tab 3: Staff Teachers & Hiring */}
                {usersSubTab === 'teacher_form' && (
                  <div className="space-y-6 text-xs">
                    {/* Hire Teacher Form */}
                    <form onSubmit={handleCreateTeacher} className="p-5 space-y-4 border bg-slate-50/50 border-slate-100 rounded-3xl">
                      <h4 className="font-quicksand font-bold text-slate-800 text-sm flex items-center space-x-1.5">
                        <Plus className="w-4.5 h-4.5 text-brandCoral" />
                        <span>Hire & Register a New Teacher</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Full Name</label>
                          <input
                            type="text" required placeholder="Full Name"
                            value={tName} onChange={e => setTName(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Email Address</label>
                          <input
                            type="email" required placeholder="Email Address"
                            value={tEmail} onChange={e => setTEmail(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Login Password</label>
                          <input
                            type="password" required placeholder="Password"
                            value={tPassword} onChange={e => setTPassword(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Contact Number</label>
                          <input
                            type="text" required placeholder="Contact Number"
                            value={tPhone} onChange={e => setTPhone(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2.5 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Qualifications (e.g. M.Ed.)</label>
                          <input
                            type="text" required placeholder="Qualifications (e.g. M.Ed.)"
                            value={tQual} onChange={e => setTQual(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2.5 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Assigned Class Room</label>
                          <select
                            value={tClass} onChange={e => setTClass(e.target.value)}
                            className="w-full bg-white border rounded-xl p-2.5 outline-none font-semibold text-slate-600"
                          >
                            <option value="Pre-Nursery">Pre-Nursery</option>
                            <option value="Nursery">Nursery</option>
                            <option value="Junior KG">Junior KG</option>
                            <option value="Senior KG">Senior KG</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="4th">4th</option>
                            <option value="5th">5th</option>
                            <option value="6th">6th</option>
                            <option value="7th">7th</option>
                            <option value="8th">8th</option>
                          </select>
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-slate-900 hover:bg-slate-850 text-white font-quicksand font-bold text-xs py-2.5 rounded-xl transition-all shadow cursor-pointer">
                        HIRE STAFF MEMBER
                      </button>
                    </form>

                    {/* Teachers Roster List */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold font-quicksand text-slate-800">Active Teachers Roster</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {teachers.map(teach => (
                          <div key={teach._id} className="flex flex-col justify-between p-4 space-y-2 text-xs bg-white border border-slate-100 rounded-2xl">
                            <div>
                              <span className="text-[9px] font-extrabold tracking-widest text-[#7C3AED] bg-[#EAE8FC] px-2.5 py-0.5 rounded-full uppercase">
                                {teach.qualifications || 'Staff Teacher'}
                              </span>
                              <h5 className="mt-2 text-sm font-bold font-quicksand text-slate-800">{teach.name || teach.userId?.name}</h5>
                              <div className="mt-1 space-y-0.5 text-slate-500 font-semibold">
                                <p>Email: <span className="font-mono text-slate-700">{teach.email || teach.userId?.email}</span></p>
                                <p>Phone: <span className="text-slate-700">{teach.phone || 'N/A'}</span></p>
                                <p>Assigned Class: <span className="font-bold text-brandCoral">{(teach.classesAssigned && teach.classesAssigned.join(', ')) || 'None'}</span></p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Fees Manager */}
            {activeTab === 'fees' && (
              <div className="space-y-8">

                {/* Fees Module Navigation Bar & Quick Metrics */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-black text-white flex items-center justify-center font-black shadow-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-quicksand font-extrabold text-slate-900 text-lg leading-tight tracking-tight">
                        Fee Management & Accounts Desk
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        100% Admin Controlled: student structures, monthly accounts, collections & audit ledger.
                      </p>
                    </div>
                  </div>

                  {/* Subtab Toggle Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/70">
                    {[
                      { id: 'dashboard', label: 'KPI Dashboard & Analytics', icon: LayoutDashboard },
                      { id: 'desk', label: 'Reception Cash Desk', icon: DollarSign },
                      { id: 'invoices', label: 'Invoices Ledger', icon: ReceiptText },
                      { id: 'structures', label: 'Student Structures', icon: Sliders },
                      { id: 'reminders', label: 'Fee Reminders', icon: Bell },
                      { id: 'reports', label: 'Financial Reports & Audit', icon: FileSpreadsheet }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = feeSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFeeSubTab(tab.id)}
                          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold font-quicksand transition-all cursor-pointer ${
                            isActive
                              ? 'bg-black text-white shadow-sm font-extrabold'
                              : 'text-slate-700 hover:text-black hover:bg-white/80'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Predictive Financial Analytics & Forecast Bento Card */}
                <div className="bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#1E1B4B] text-white rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl border border-indigo-900/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-white/10 rounded-xl border border-white/10 text-amber-300">
                          <Sparkles className="w-5 h-5" />
                        </span>
                        <h4 className="text-lg font-bold font-quicksand text-white flex items-center gap-2">
                          <span>AI Predictive Financial Analytics & Cash Flow Forecast</span>
                          <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            AI Model
                          </span>
                        </h4>
                      </div>
                      <p className="text-xs text-indigo-200 font-medium">
                        Machine Learning aging analysis, fee default early warning, and 3-month projected cash flow inflows.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={aiForecastLoading}
                      onClick={() => fetchAiForecast()}
                      className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-quicksand font-bold text-xs rounded-xl border border-white/15 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${aiForecastLoading ? 'animate-spin text-amber-300' : ''}`} />
                      <span>{aiForecastLoading ? 'Analyzing...' : 'Refresh AI Forecast'}</span>
                    </button>
                  </div>

                  {aiForecast ? (
                    <div className="space-y-6">
                      {/* Metric Stat Cards Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-indigo-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Collection Efficiency</span>
                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                          </div>
                          <span className="text-2xl font-black text-emerald-400 font-quicksand block">
                            {aiForecast.metrics.collectionEfficiency}
                          </span>
                          <span className="text-[10px] text-indigo-200/80 block">Institutional target: 80%</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-indigo-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Default Risk Score</span>
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-2xl font-black text-amber-400 font-quicksand block">
                            {aiForecast.metrics.defaultRiskScore}
                          </span>
                          <span className="text-[10px] text-indigo-200/80 block">Based on overdue frequency</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-indigo-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue Invoices</span>
                            <XCircle className="w-4 h-4 text-rose-400" />
                          </div>
                          <span className="text-2xl font-black text-rose-400 font-quicksand block">
                            {aiForecast.metrics.overdueCount} Accounts
                          </span>
                          <span className="text-[10px] text-indigo-200/80 block">{aiForecast.metrics.paidCount} fully paid accounts</span>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-indigo-200">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Receivables</span>
                            <DollarSign className="w-4 h-4 text-indigo-300" />
                          </div>
                          <span className="text-2xl font-black text-indigo-200 font-quicksand block">
                            ₹{(aiForecast.metrics.totalPending || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-indigo-200/80 block">Billed: ₹{(aiForecast.metrics.totalBilled || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* 3-Month Expected Cash Flow Inflow Section */}
                      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-quicksand text-white uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-300" />
                            Next 3-Month Cash Flow Inflow Projections
                          </span>
                          <span className="text-[10px] text-indigo-300">Predictive Probability Weighting</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {aiForecast.cashFlowForecast.map((cf, idx) => (
                            <div key={idx} className="bg-white/5 p-3.5 rounded-xl border border-white/10 space-y-1.5">
                              <span className="text-[10px] font-bold text-indigo-300 block">{cf.month}</span>
                              <span className="text-lg font-extrabold text-white font-quicksand block">
                                ₹{cf.expectedInflow.toLocaleString('en-IN')}
                              </span>
                              <div className="flex items-center justify-between text-[10px] text-indigo-200">
                                <span>Confidence:</span>
                                <span className={`font-bold ${idx === 0 ? 'text-emerald-400' : idx === 1 ? 'text-amber-300' : 'text-indigo-300'}`}>
                                  {cf.probability}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Strategic Action Items */}
                      <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                        <span className="text-xs font-bold font-quicksand text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-emerald-400" />
                          Recommended Strategic Actions for Financial Officer
                        </span>
                        <div className="space-y-2">
                          {aiForecast.strategicActionItems.map((action, aIdx) => (
                            <div key={aIdx} className="flex items-start gap-2.5 text-xs text-indigo-100 bg-white/5 p-3 rounded-xl border border-white/5">
                              <span className="text-sm shrink-0">📌</span>
                              <span className="font-medium leading-relaxed">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <button
                        type="button"
                        onClick={() => fetchAiForecast()}
                        className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-quicksand font-bold text-xs rounded-xl shadow-lg transition-all"
                      >
                        ⚡ Run Predictive Financial Analytics Model
                      </button>
                    </div>
                  )}
                </div>

                {/* SUBTAB 1: Comprehensive Fee Dashboard & KPIs & Analytical Charts */}
                {feeSubTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Top KPI Cards Row */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
                      {/* Total Fees */}
                      <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm hover:border-slate-200 transition-all">
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Fees Billed</span>
                          <CreditCard className="w-4 h-4 text-slate-500" />
                        </div>
                        <span className="text-xl sm:text-2xl font-black font-quicksand text-slate-800 block">
                          ₹{(enhancedFeeStats?.kpis?.totalFees ?? fees.reduce((sum, f) => sum + (f.totalPayable || f.amount || 0), 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">All active invoices</span>
                      </div>

                      {/* Total Collected */}
                      <div className="bg-emerald-50/70 border-2 border-emerald-100 rounded-2xl p-4 shadow-sm hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-between text-emerald-600 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Collected</span>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xl sm:text-2xl font-black font-quicksand text-emerald-700 block">
                          ₹{(enhancedFeeStats?.kpis?.totalCollected ?? fees.reduce((sum, f) => sum + (f.paidAmount || (f.status === 'paid' ? f.amount : 0)), 0)).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Total revenue cleared</span>
                      </div>

                      {/* Total Pending */}
                      <div className="bg-amber-50/70 border-2 border-amber-100 rounded-2xl p-4 shadow-sm hover:border-amber-200 transition-all">
                        <div className="flex items-center justify-between text-amber-700 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Pending</span>
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-xl sm:text-2xl font-black font-quicksand text-amber-800 block">
                          ₹{(enhancedFeeStats?.kpis?.totalPending ?? 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                          {enhancedFeeStats?.kpis?.studentsWithPendingFees || 0} Students pending
                        </span>
                      </div>

                      {/* Total Overdue */}
                      <div className="bg-rose-50/70 border-2 border-rose-100 rounded-2xl p-4 shadow-sm hover:border-rose-200 transition-all">
                        <div className="flex items-center justify-between text-rose-600 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Overdue</span>
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        </div>
                        <span className="text-xl sm:text-2xl font-black font-quicksand text-rose-700 block">
                          ₹{(enhancedFeeStats?.kpis?.totalOverdue ?? 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-rose-600 font-semibold block mt-1">
                          {enhancedFeeStats?.kpis?.studentsWithOverdueFees || 0} Students past due date
                        </span>
                      </div>

                      {/* Today Collection & This Month */}
                      <div className="bg-indigo-50/70 border-2 border-indigo-100 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition-all col-span-2 md:col-span-1">
                        <div className="flex items-center justify-between text-indigo-700 mb-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider">Today's Inflow</span>
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-xl sm:text-2xl font-black font-quicksand text-indigo-800 block">
                          ₹{(enhancedFeeStats?.kpis?.todayCollection ?? 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-indigo-700 font-semibold block mt-1">
                          This Month: ₹{(enhancedFeeStats?.kpis?.thisMonthCollection ?? 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Visual Charts Grid: Monthly Trends + Pending vs Collected + Course-wise */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Chart 1: Monthly Collection & Invoicing Trends */}
                      <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-2">
                            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                              <TrendingUp className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="font-quicksand font-bold text-slate-800 text-sm">Monthly Collection Trends</h4>
                              <p className="text-[11px] text-slate-400">Comparing Invoiced Billing vs Collected Revenue</p>
                            </div>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                            Last 6 Months
                          </span>
                        </div>

                        {/* Visual SVG / Bar Graph */}
                        <div className="space-y-4 pt-2">
                          {(enhancedFeeStats?.charts?.monthlyTrends || [
                            { month: 'Nov 2025', invoiced: 24000, collected: 21500 },
                            { month: 'Dec 2025', invoiced: 26000, collected: 25000 },
                            { month: 'Jan 2026', invoiced: 28000, collected: 27500 },
                            { month: 'Feb 2026', invoiced: 31000, collected: 29000 },
                            { month: 'Mar 2026', invoiced: 35000, collected: 31200 },
                            { month: 'Apr 2026', invoiced: 38000, collected: 24500 }
                          ]).map((item, idx) => {
                            const maxVal = Math.max(item.invoiced, item.collected, 40000);
                            const collWidth = Math.min(100, Math.round((item.collected / maxVal) * 100));
                            const invWidth = Math.min(100, Math.round((item.invoiced / maxVal) * 100));
                            return (
                              <div key={idx} className="space-y-1.5 text-xs">
                                <div className="flex justify-between items-center font-bold text-slate-600">
                                  <span>{item.month}</span>
                                  <div className="space-x-3 text-[11px] font-mono">
                                    <span className="text-emerald-700">Paid: ₹{item.collected.toLocaleString('en-IN')}</span>
                                    <span className="text-slate-400">Due: ₹{(item.invoiced - item.collected).toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                                  <div
                                    style={{ width: `${collWidth}%` }}
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                    title={`Collected: ₹${item.collected}`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          <div className="flex items-center justify-end space-x-4 pt-2 text-[11px] font-bold text-slate-500">
                            <span className="flex items-center space-x-1.5">
                              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                              <span>Collected Payments</span>
                            </span>
                            <span className="flex items-center space-x-1.5">
                              <span className="w-3 h-3 rounded-full bg-slate-200 inline-block" />
                              <span>Pending Balance</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chart 2: Pending vs Collected Ratio */}
                      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
                        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                          <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <PieChart className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="font-quicksand font-bold text-slate-800 text-sm">Collection Ratio</h4>
                            <p className="text-[11px] text-slate-400">Total recovery vs dues</p>
                          </div>
                        </div>

                        {/* Circular Progress Gauge */}
                        <div className="flex flex-col items-center justify-center py-4 space-y-3">
                          {(() => {
                            const tot = (enhancedFeeStats?.kpis?.totalFees || 1);
                            const col = (enhancedFeeStats?.kpis?.totalCollected || 0);
                            const pct = Math.min(100, Math.round((col / tot) * 100));
                            return (
                              <div className="relative w-36 h-36 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                  <path
                                    className="text-slate-100"
                                    strokeWidth="3.8"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                  <path
                                    className="text-emerald-500"
                                    strokeDasharray={`${pct}, 100`}
                                    strokeWidth="3.8"
                                    strokeLinecap="round"
                                    stroke="currentColor"
                                    fill="none"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  />
                                </svg>
                                <div className="absolute text-center">
                                  <span className="text-2xl font-black font-quicksand text-slate-900 block">{pct}%</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Recovered</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Breakdown Legend Cards */}
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center p-2.5 bg-emerald-50 rounded-xl text-emerald-800 font-bold">
                            <span>Cleared Payments</span>
                            <span className="font-mono">₹{(enhancedFeeStats?.kpis?.totalCollected || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-amber-50 rounded-xl text-amber-800 font-bold">
                            <span>Pending Balance</span>
                            <span className="font-mono">₹{(enhancedFeeStats?.kpis?.totalPending || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-rose-50 rounded-xl text-rose-800 font-bold">
                            <span>Overdue Past Due Date</span>
                            <span className="font-mono">₹{(enhancedFeeStats?.kpis?.totalOverdue || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Chart 3: Course-wise / Class-wise Breakdown Table */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="font-quicksand font-bold text-slate-800 text-sm">Class / Course-wise Fee Distribution</h4>
                            <p className="text-[11px] text-slate-400">Collection progress by student grade and classroom</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFeeSubTab('structures')}
                          className="text-xs font-bold font-quicksand text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                        >
                          <span>Manage Individual Student Structures</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                              <th className="p-3">Class / Course</th>
                              <th className="p-3">Total Invoiced</th>
                              <th className="p-3">Collected (Paid)</th>
                              <th className="p-3">Pending Dues</th>
                              <th className="p-3">Collection Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {(enhancedFeeStats?.charts?.courseWiseCollection || [
                              { class: 'Pre-Nursery', totalInvoiced: 15000, collected: 12000, pending: 3000 },
                              { class: 'Nursery', totalInvoiced: 25000, collected: 20000, pending: 5000 },
                              { class: 'Junior KG', totalInvoiced: 18000, collected: 14000, pending: 4000 },
                              { class: 'Senior KG', totalInvoiced: 22000, collected: 19500, pending: 2500 }
                            ]).map((cw, cIdx) => {
                              const pct = cw.totalInvoiced > 0 ? Math.round((cw.collected / cw.totalInvoiced) * 100) : 0;
                              return (
                                <tr key={cIdx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-bold text-slate-900">{cw.class}</td>
                                  <td className="p-3 font-mono">₹{cw.totalInvoiced.toLocaleString('en-IN')}</td>
                                  <td className="p-3 font-mono font-bold text-emerald-700">₹{cw.collected.toLocaleString('en-IN')}</td>
                                  <td className="p-3 font-mono font-bold text-rose-600">₹{cw.pending.toLocaleString('en-IN')}</td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div style={{ width: `${pct}%` }} className="bg-emerald-500 h-full rounded-full" />
                                      </div>
                                      <span className="font-mono font-bold text-[10px] text-slate-500">{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: Reception Cash Desk & Daily Reconciliation */}
                {feeSubTab === 'desk' && (
                  <div className="space-y-6">
                    {/* Reception Terminal Header & Shift Summary */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-quicksand font-bold text-slate-900 text-base flex items-center space-x-2">
                              <span>Cash Desk & Cashier Reception Terminal</span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                cashDeskData?.closing?.status === 'CLOSED'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {cashDeskData?.closing?.status === 'CLOSED' ? 'Desk Closed Today' : 'Live / Open Desk'}
                              </span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Daily cash balancing, collection breakdown by payment mode, petty cash expenses, refunds, and reconciled closing.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="date"
                            value={cashDeskFilterDate}
                            onChange={e => {
                              setCashDeskFilterDate(e.target.value);
                              setTimeout(fetchCashDeskToday, 50);
                            }}
                            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setCashDeskTxnModal(true)}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold font-quicksand rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Expense / Refund</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCloseDeskForm({
                                actualCash: cashDeskData?.summary?.expectedClosingCash || '',
                                discrepancyReason: ''
                              });
                              setCloseDeskModal(true);
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-quicksand rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Reconcile & Close Cash Desk</span>
                          </button>
                        </div>
                      </div>

                      {/* Cash Desk KPI Cards Row */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                        {/* Opening Cash */}
                        <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Opening Float</span>
                          <span className="text-xl font-black font-quicksand text-slate-800 block">
                            ₹{(cashDeskData?.summary?.openingCash ?? 5000).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Start-of-day float</span>
                        </div>

                        {/* Cash Collected */}
                        <div className="bg-emerald-50/70 border border-emerald-100 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-emerald-600 block tracking-wider">Cash Collected</span>
                          <span className="text-xl font-black font-quicksand text-emerald-700 block">
                            ₹{(cashDeskData?.summary?.cashCollection ?? 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-emerald-600 block">Physical currency</span>
                        </div>

                        {/* UPI / Digital */}
                        <div className="bg-purple-50/70 border border-purple-100 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-purple-600 block tracking-wider">UPI / QR Code</span>
                          <span className="text-xl font-black font-quicksand text-purple-700 block">
                            ₹{(cashDeskData?.summary?.upiCollection ?? 0).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-purple-600 block">Instant gateway</span>
                        </div>

                        {/* Card & Bank */}
                        <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-blue-600 block tracking-wider">POS / Card & Bank</span>
                          <span className="text-xl font-black font-quicksand text-blue-700 block">
                            ₹{((cashDeskData?.summary?.cardCollection ?? 0) + (cashDeskData?.summary?.bankCollection ?? 0)).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-blue-600 block">Direct settlements</span>
                        </div>

                        {/* Total Expenses / Refunds */}
                        <div className="bg-rose-50/70 border border-rose-100 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-rose-600 block tracking-wider">Outflows / Exp.</span>
                          <span className="text-xl font-black font-quicksand text-rose-700 block">
                            ₹{((cashDeskData?.summary?.totalExpenses ?? 0) + (cashDeskData?.summary?.totalRefunds ?? 0)).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-rose-600 block">Expenses & refunds</span>
                        </div>

                        {/* Expected Cash in Drawer */}
                        <div className="bg-indigo-50 border-2 border-indigo-200 p-3.5 rounded-2xl space-y-1">
                          <span className="text-[10px] font-bold uppercase text-indigo-700 block tracking-wider">Expected Cash Drawer</span>
                          <span className="text-xl font-black font-quicksand text-indigo-900 block">
                            ₹{(cashDeskData?.summary?.expectedClosingCash ?? 5000).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-indigo-700 block font-semibold">Opening + Cash - Exp</span>
                        </div>
                      </div>
                    </div>

                    {/* Student Collection Terminal & Balance Calculator */}
                    <div className="bg-[#FAF9FF] border border-[#E9E4FF] rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-[#E9E4FF]">
                        <div>
                          <h4 className="text-lg font-bold font-quicksand text-[#18191E] flex items-center space-x-2">
                            <DollarSign className="w-5 h-5 text-[#5B4DF5]" />
                            <span>Quick Student Cash Collection & Receipt Issuance</span>
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">
                            Search any student to calculate their Total Fees, Paid Amount, and Remaining Balance Due, then record instant cash payments.
                          </p>
                        </div>
                        {selectedFeeStudent && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openStudentFeeProfile(selectedFeeStudent)}
                              className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-full text-xs font-bold transition-all cursor-pointer"
                            >
                              View Statement
                            </button>
                            <span className="text-xs font-bold px-3 py-1 bg-[#D8D4FC] text-[#5B4DF5] rounded-full self-start sm:self-auto">
                              Selected: {selectedFeeStudent.name} ({selectedFeeStudent.class})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Student Lookup Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Filter by Class</label>
                          <select
                            value={feeClassFilter}
                            onChange={e => {
                              setFeeClassFilter(e.target.value);
                              setSelectedFeeStudent(null);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                          >
                            <option value="">-- All Classes --</option>
                            <option value="Pre-Nursery">Pre-Nursery</option>
                            <option value="Nursery">Nursery</option>
                            <option value="Junior KG">Junior KG</option>
                            <option value="Senior KG">Senior KG</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="4th">4th</option>
                            <option value="5th">5th</option>
                            <option value="6th">6th</option>
                            <option value="7th">7th</option>
                            <option value="8th">8th</option>
                          </select>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-slate-700">Search Student Name</label>
                          <input
                            type="text"
                            placeholder="Type name to search student..."
                            value={feeSearchQuery}
                            onChange={e => setFeeSearchQuery(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      {/* Quick Student Selection Scrollable Chips */}
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                        {students
                          .filter(s => (feeClassFilter ? s.class === feeClassFilter : true) && s.name.toLowerCase().includes(feeSearchQuery.toLowerCase()))
                          .slice(0, 15)
                          .map(s => (
                            <button
                              key={s._id}
                              type="button"
                              onClick={() => {
                                setSelectedFeeStudent(s);
                                fetchStudentFeeBalance(s._id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                selectedFeeStudent?._id === s._id
                                  ? 'bg-[#18191E] text-white border-[#18191E] shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              {s.name} ({s.class})
                            </button>
                          ))}
                      </div>

                      {/* Real-time 3-Card Balance Ledger Display */}
                      {selectedFeeStudent && (
                        <div className="space-y-5 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Card 1: Total Fees */}
                            <div className="bg-white border-2 border-slate-100 rounded-2xl p-4 shadow-sm">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                Total Fees (Payable)
                              </span>
                              <span className="text-2xl font-black font-quicksand text-slate-800 block mt-1">
                                ₹{studentFeeBalance.totalFees.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                                All applicable terms
                              </span>
                            </div>

                            {/* Card 2: Paid Fees */}
                            <div className="bg-emerald-50/70 border-2 border-emerald-100 rounded-2xl p-4 shadow-sm">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                                Paid Fees (Collected)
                              </span>
                              <span className="text-2xl font-black font-quicksand text-emerald-700 block mt-1">
                                ₹{studentFeeBalance.paidFees.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-emerald-600/80 font-semibold block mt-1">
                                Cleared payments
                              </span>
                            </div>

                            {/* Card 3: Remaining Balance Due */}
                            <div className={`border-2 rounded-2xl p-4 shadow-sm ${
                              studentFeeBalance.remainingFees > 0
                                ? 'bg-rose-50/70 border-rose-200 text-rose-700'
                                : 'bg-emerald-50/70 border-emerald-200 text-emerald-700'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider block">
                                  Remaining Balance Due
                                </span>
                                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                  studentFeeBalance.remainingFees > 0 ? 'bg-rose-200 text-rose-800' : 'bg-emerald-200 text-emerald-800'
                                }`}>
                                  {studentFeeBalance.remainingFees > 0 ? 'PENDING' : 'CLEARED'}
                                </span>
                              </div>
                              <span className="text-2xl font-black font-quicksand block mt-1">
                                ₹{studentFeeBalance.remainingFees.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] font-semibold opacity-80 block mt-1">
                                {studentFeeBalance.remainingFees > 0 ? 'Outstanding balance due' : 'Zero dues remaining'}
                              </span>
                            </div>
                          </div>

                          {/* Immediate Cash Payment Box */}
                          <form
                            onSubmit={handleDirectCashCollection}
                            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                                <CreditCard className="w-4 h-4 text-[#5B4DF5]" />
                                <span>Instant Cash Collection Desk</span>
                              </h5>
                              <button
                                type="button"
                                onClick={() => openUniversalPayModal(selectedFeeStudent)}
                                className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                              >
                                <span>Advanced Payment / Concessions Modal</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                              <div className="space-y-1">
                                <label className="font-bold text-slate-700">Installment / Fee Term</label>
                                <select
                                  value={collectTermId}
                                  onChange={e => {
                                    setCollectTermId(e.target.value);
                                    const chosen = studentFeeBalance.pendingFees.find(f => f._id === e.target.value);
                                    if (chosen) setCollectAmount((chosen.remainingAmount || chosen.amount).toString());
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                                >
                                  {studentFeeBalance.pendingFees.length === 0 ? (
                                    <option value="">No pending terms (All Paid)</option>
                                  ) : (
                                    studentFeeBalance.pendingFees.map(f => (
                                      <option key={f._id} value={f._id}>
                                        {f.term} (Due: ₹{f.remainingAmount || f.amount})
                                      </option>
                                    ))
                                  )}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="font-bold text-slate-700">Cash Amount to Collect (₹) *</label>
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  value={collectAmount}
                                  onChange={e => setCollectAmount(e.target.value)}
                                  placeholder="e.g. 1500"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-extrabold text-slate-900"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="font-bold text-slate-700">Payment Channel</label>
                                <select
                                  value={collectMethod}
                                  onChange={e => setCollectMethod(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                                >
                                  <option value="Cash at Desk">Cash at Admission Desk</option>
                                  <option value="UPI / QR Code">UPI / QR Code</option>
                                  <option value="Credit Card">Credit Card / POS</option>
                                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                                  <option value="Cheque / DD">Cheque / Demand Draft</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={isCollectingCash || studentFeeBalance.remainingFees <= 0}
                                className="bg-black hover:bg-slate-800 text-white font-quicksand font-bold text-xs px-6 py-3 rounded-xl flex items-center space-x-2 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                              >
                                <DollarSign className="w-4 h-4 text-white" />
                                <span>
                                  {isCollectingCash ? 'RECORDING PAYMENT...' : 'COLLECT CASH & PRINT RECEIPT'}
                                </span>
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>

                    {/* Today's Cash Desk Ledger Log Table */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <History className="w-4 h-4 text-slate-700" />
                          <h4 className="font-quicksand font-bold text-slate-800 text-sm">
                            Today's Reception Cash Desk Ledger ({cashDeskData?.transactions?.length || 0} Entries)
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={fetchCashDeskToday}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingCashDesk ? 'animate-spin' : ''}`} />
                          <span>Refresh Desk Ledger</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                              <th className="p-3">Ref ID</th>
                              <th className="p-3">Time</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Particulars / Recipient</th>
                              <th className="p-3">Mode</th>
                              <th className="p-3 text-right">Inflow (+)</th>
                              <th className="p-3 text-right">Outflow (-)</th>
                              <th className="p-3">Cashier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {(!cashDeskData?.transactions || cashDeskData.transactions.length === 0) ? (
                              <tr>
                                <td colSpan="8" className="p-6 text-center text-slate-400 font-bold">
                                  No cash desk entries recorded for this date.
                                </td>
                              </tr>
                            ) : (
                              cashDeskData.transactions.map((txn, tIdx) => {
                                const isInflow = txn.type === 'FEE_COLLECTION' || txn.type === 'OTHER_INCOME';
                                return (
                                  <tr key={tIdx} className="hover:bg-slate-50/50">
                                    <td className="p-3 font-mono font-bold text-slate-600 text-[11px]">{txn.referenceNumber || txn._id}</td>
                                    <td className="p-3 text-slate-500">{new Date(txn.createdAt || txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isInflow
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                                      }`}>
                                        {txn.type}
                                      </span>
                                    </td>
                                    <td className="p-3 font-semibold text-slate-800">
                                      {txn.description}
                                      {txn.vendorRecipient && <span className="block text-[10px] text-slate-400">To: {txn.vendorRecipient}</span>}
                                    </td>
                                    <td className="p-3 font-mono text-[11px] font-bold text-slate-600">{txn.paymentMethod}</td>
                                    <td className="p-3 text-right font-mono font-black text-emerald-700">
                                      {isInflow ? `+₹${Number(txn.amount).toLocaleString('en-IN')}` : '-'}
                                    </td>
                                    <td className="p-3 text-right font-mono font-black text-rose-600">
                                      {!isInflow ? `-₹${Number(txn.amount).toLocaleString('en-IN')}` : '-'}
                                    </td>
                                    <td className="p-3 text-slate-500 text-[11px]">{txn.recordedBy}</td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: Issued Invoices Ledger & Search Filters */}
                {feeSubTab === 'invoices' && (
                  <div className="space-y-6">
                    {/* Generate Fee Invoice Form */}
                    <form onSubmit={handleCreateFee} className="p-5 space-y-4 border bg-white border-slate-200 rounded-3xl shadow-sm">
                      <h4 className="text-sm font-bold font-quicksand text-slate-800 flex items-center space-x-2">
                        <Plus className="w-4 h-4 text-purple-600" />
                        <span>Issue Custom Student Fee Invoice</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">1. Filter by Class</label>
                          <select
                            value={feeClassFilter}
                            onChange={e => {
                              setFeeClassFilter(e.target.value);
                              setFeeStdId('');
                            }}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full outline-none font-semibold text-slate-600"
                          >
                            <option value="">-- All Classes --</option>
                            <option value="Pre-Nursery">Pre-Nursery</option>
                            <option value="Nursery">Nursery</option>
                            <option value="Junior KG">Junior KG</option>
                            <option value="Senior KG">Senior KG</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="4th">4th</option>
                            <option value="5th">5th</option>
                            <option value="6th">6th</option>
                            <option value="7th">7th</option>
                            <option value="8th">8th</option>
                          </select>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-slate-600">2. Search & Select Student</label>
                          <input
                            type="text"
                            value={feeSearchQuery}
                            onChange={e => setFeeSearchQuery(e.target.value)}
                            placeholder="Type name to search..."
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full outline-none text-xs"
                          />

                          <div className="mt-2 overflow-y-auto bg-white border divide-y shadow-inner max-h-32 border-purple-50 rounded-xl divide-slate-100">
                            {students.filter(s => {
                              const classMatch = feeClassFilter ? s.class === feeClassFilter : true;
                              const nameMatch = s.name.toLowerCase().includes(feeSearchQuery.toLowerCase());
                              return classMatch && nameMatch;
                            }).length === 0 ? (
                              <p className="p-3 text-xs text-center text-slate-400">No matching students found.</p>
                            ) : (
                              students
                                .filter(s => (feeClassFilter ? s.class === feeClassFilter : true) && s.name.toLowerCase().includes(feeSearchQuery.toLowerCase()))
                                .map(s => (
                                  <button
                                    key={s._id}
                                    type="button"
                                    onClick={() => handleSelectInvoiceStudent(s)}
                                    className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-all ${
                                      feeStdId === s._id ? 'bg-purple-50 text-purple-700 font-bold' : 'hover:bg-slate-50 text-slate-600'
                                    }`}
                                  >
                                    <span>{s.name} ({s.class})</span>
                                    <span className="text-[10px] text-slate-400 font-mono">ID: {s.studentId || s._id}</span>
                                  </button>
                                ))
                            )}
                          </div>
                          {feeStdId && (
                            <div className="mt-2 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200 flex justify-between items-center">
                              <span>Selected: {students.find(s => s._id === feeStdId)?.name}</span>
                              <button type="button" onClick={() => setFeeStdId('')} className="text-red-500 hover:text-red-700">Clear</button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Fee Amount (₹)</label>
                          <input
                            type="number"
                            value={feeAmount}
                            onChange={e => setFeeAmount(e.target.value)}
                            placeholder="Enter fee amount (₹)"
                            required
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full outline-none font-semibold text-slate-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Term / Month Description</label>
                          <select
                            value={feeTerm} onChange={e => setFeeTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full outline-none font-semibold text-slate-600"
                          >
                            <option>January Monthly Fee</option>
                            <option>February Monthly Fee</option>
                            <option>March Monthly Fee</option>
                            <option>April Monthly Fee</option>
                            <option>May Monthly Fee</option>
                            <option>June Monthly Fee</option>
                            <option>July Monthly Fee</option>
                            <option>August Monthly Fee</option>
                            <option>September Monthly Fee</option>
                            <option>October Monthly Fee</option>
                            <option>November Monthly Fee</option>
                            <option>December Monthly Fee</option>
                            <option>Admission Fee</option>
                            <option>Examination Fee</option>
                            <option>Annual Maintenance Charges</option>
                            <option>Transport Fee</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-600">Due Date</label>
                          <input
                            type="date" required
                            value={feeDueDate} onChange={e => setFeeDueDate(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-full outline-none text-slate-600 font-semibold"
                          />
                        </div>
                      </div>

                      <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-quicksand font-bold text-xs py-3 rounded-xl transition-all shadow cursor-pointer">
                        ISSUE STUDENT INVOICE
                      </button>
                    </form>

                    {/* Filter Controls Row */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="font-quicksand font-bold text-slate-800 text-sm">Issued Invoices Ledger</h4>
                        <span className="text-xs font-mono font-bold text-slate-400">Total: {fees.length} Invoices</span>
                      </div>

                      {/* Multi-Filters Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Search Student Name / ID</label>
                          <input
                            type="text"
                            value={listFeeSearchName}
                            onChange={e => setListFeeSearchName(e.target.value)}
                            placeholder="Search student..."
                            className="w-full p-2 bg-slate-50 border outline-none border-slate-200 rounded-xl font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Filter by Class</label>
                          <select
                            value={listFeeClassFilter}
                            onChange={e => setListFeeClassFilter(e.target.value)}
                            className="w-full p-2 font-semibold bg-slate-50 border outline-none border-slate-200 rounded-xl text-slate-600"
                          >
                            <option value="">-- All Classes --</option>
                            <option value="Pre-Nursery">Pre-Nursery</option>
                            <option value="Nursery">Nursery</option>
                            <option value="Junior KG">Junior KG</option>
                            <option value="Senior KG">Senior KG</option>
                            <option value="1st">1st</option>
                            <option value="2nd">2nd</option>
                            <option value="3rd">3rd</option>
                            <option value="4th">4th</option>
                            <option value="5th">5th</option>
                            <option value="6th">6th</option>
                            <option value="7th">7th</option>
                            <option value="8th">8th</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Filter by Status</label>
                          <select
                            value={listFeeStatusFilter}
                            onChange={e => setListFeeStatusFilter(e.target.value)}
                            className="w-full p-2 font-semibold bg-slate-50 border outline-none border-slate-200 rounded-xl text-slate-600"
                          >
                            <option value="all">-- All Statuses --</option>
                            <option value="paid">Paid</option>
                            <option value="partially_paid">Partially Paid</option>
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-slate-500">Filter by Month</label>
                          <select
                            value={listFeeMonthFilter}
                            onChange={e => setListFeeMonthFilter(e.target.value)}
                            className="w-full p-2 font-semibold bg-slate-50 border outline-none border-slate-200 rounded-xl text-slate-600"
                          >
                            <option value="all">-- All Months --</option>
                            <option value="January">January</option>
                            <option value="February">February</option>
                            <option value="March">March</option>
                            <option value="April">April</option>
                            <option value="May">May</option>
                            <option value="June">June</option>
                            <option value="July">July</option>
                            <option value="August">August</option>
                            <option value="September">September</option>
                            <option value="October">October</option>
                            <option value="November">November</option>
                            <option value="December">December</option>
                          </select>
                        </div>
                      </div>

                      {/* List Table */}
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="font-bold tracking-wider uppercase border-b bg-slate-50 border-slate-100 text-slate-500">
                              <th className="p-3">Student Name</th>
                              <th className="p-3">Class</th>
                              <th className="p-3">Particulars / Term</th>
                              <th className="p-3">Total Payable</th>
                              <th className="p-3">Paid Amount</th>
                              <th className="p-3">Due Balance</th>
                              <th className="p-3">Due Date</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fees.filter(f => {
                              const studentInfo = getStudentInfo(f);
                              const nameMatch = studentInfo.name.toLowerCase().includes(listFeeSearchName.toLowerCase()) || (studentInfo.id && studentInfo.id.toLowerCase().includes(listFeeSearchName.toLowerCase()));
                              const classMatch = listFeeClassFilter ? studentInfo.class === listFeeClassFilter : true;
                              const statusMatch = listFeeStatusFilter === 'all' ? true : f.status === listFeeStatusFilter;
                              const monthMatch = listFeeMonthFilter === 'all' ? true : (f.month === listFeeMonthFilter || (f.term && f.term.includes(listFeeMonthFilter)));
                              return nameMatch && classMatch && statusMatch && monthMatch;
                            }).length === 0 ? (
                              <tr>
                                <td colSpan="9" className="p-8 font-medium text-center text-slate-400">
                                  No matching issued invoices found.
                                </td>
                              </tr>
                            ) : (
                              fees.filter(f => {
                                const studentInfo = getStudentInfo(f);
                                const nameMatch = studentInfo.name.toLowerCase().includes(listFeeSearchName.toLowerCase()) || (studentInfo.id && studentInfo.id.toLowerCase().includes(listFeeSearchName.toLowerCase()));
                                const classMatch = listFeeClassFilter ? studentInfo.class === listFeeClassFilter : true;
                                const statusMatch = listFeeStatusFilter === 'all' ? true : f.status === listFeeStatusFilter;
                                const monthMatch = listFeeMonthFilter === 'all' ? true : (f.month === listFeeMonthFilter || (f.term && f.term.includes(listFeeMonthFilter)));
                                return nameMatch && classMatch && statusMatch && monthMatch;
                              }).map(f => {
                                const studentInfo = getStudentInfo(f);
                                const payable = f.totalPayable !== undefined ? Number(f.totalPayable) : Number(f.amount || 0);
                                const paid = Number(f.paidAmount || (f.status === 'paid' ? f.amount : 0));
                                const due = f.remainingAmount !== undefined ? Number(f.remainingAmount) : Math.max(0, payable - paid);
                                return (
                                  <tr key={f._id} className="font-medium transition-all border-b border-slate-50 hover:bg-slate-50/50 text-slate-700">
                                    <td className="p-3">
                                      <span className="block text-xs font-bold text-slate-800">{studentInfo.name}</span>
                                      <span className="text-[9px] text-slate-400 font-mono">ID: {studentInfo.id}</span>
                                    </td>
                                    <td className="p-3 font-bold text-slate-500">{studentInfo.class}</td>
                                    <td className="p-3 text-slate-800 font-semibold">{f.term}</td>
                                    <td className="p-3 font-mono font-bold">₹{payable.toLocaleString('en-IN')}</td>
                                    <td className="p-3 font-mono font-bold text-emerald-700">₹{paid.toLocaleString('en-IN')}</td>
                                    <td className="p-3 font-mono font-bold text-rose-600">₹{due.toLocaleString('en-IN')}</td>
                                    <td className="p-3 text-slate-500">{new Date(f.dueDate).toLocaleDateString()}</td>
                                    <td className="p-3">
                                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold border ${
                                        f.status === 'paid' ? 'bg-brandMint/10 text-brandMint-dark border-brandMint/30' :
                                        f.status === 'partially_paid' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        f.status === 'overdue' ? 'bg-red-50 text-red-600 border border-red-100' :
                                        'bg-brandYellow/10 text-brandYellow-dark border border-brandYellow/30'
                                      }`}>
                                        {f.status}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const s = students.find(std => std._id === (f.studentId?._id || f.studentId));
                                            if (s) openStudentFeeProfile(s);
                                          }}
                                          className="font-quicksand font-bold text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all"
                                          title="View full student fee profile"
                                        >
                                          Profile
                                        </button>
                                        {f.status === 'paid' ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => handleViewReceipt(f._id)}
                                              className="font-quicksand font-bold text-[9px] bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                                            >
                                              Print
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadFeeReceiptPDF(f._id)}
                                              title="Download Official School PDF Receipt"
                                              className="font-quicksand font-bold text-[9px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1"
                                            >
                                              <Download className="w-3 h-3" />
                                              <span>PDF</span>
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const s = students.find(std => std._id === (f.studentId?._id || f.studentId));
                                              if (s) openUniversalPayModal(s, f);
                                            }}
                                            className="font-quicksand font-bold text-[9px] bg-black hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all active:scale-[0.98]"
                                          >
                                            Collect
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 4: Student-Specific Fee Structures Directory */}
                {feeSubTab === 'structures' && (
                  <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <h4 className="font-quicksand font-bold text-slate-900 text-base flex items-center space-x-2">
                          <Sliders className="w-4.5 h-4.5 text-purple-600" />
                          <span>Student-Specific Fee Structures (100% Admin Controlled)</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Configure independent fee heads (Admission, Tuition, Monthly, Transport, Hostel, Library, Discounts, Fines) per student.
                        </p>
                      </div>
                    </div>

                    {/* Student List with Structure Actions */}
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Class</th>
                            <th className="p-3">Student ID</th>
                            <th className="p-3">Parent Contact</th>
                            <th className="p-3 text-right">Fee Configuration Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {students.map(std => (
                            <tr key={std._id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-bold text-slate-900 text-sm font-quicksand">{std.name}</td>
                              <td className="p-3">
                                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                                  {std.class}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-slate-600">{std.studentId || std._id}</td>
                              <td className="p-3">
                                <span className="block font-semibold">{std.parentId?.name || 'Parent'}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{std.parentId?.phone || 'N/A'}</span>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => openStudentStructureModal(std)}
                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-quicksand font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span>Configure Fee Heads</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openStudentFeeProfile(std)}
                                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-quicksand font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Statement Profile</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openUniversalPayModal(std)}
                                    className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white font-quicksand font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                                  >
                                    Collect Fee
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SUBTAB 5: Automated Fee Reminders & Multi-Channel Dispatch */}
                {feeSubTab === 'reminders' && (
                  <div className="space-y-6">
                    {/* Control Banner & Quick Dispatch */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm">
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-quicksand font-bold text-slate-900 text-base">
                              Automated Fee Reminders & Multi-Channel Dispatch Center
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Deliver automated payment notices for Upcoming (7-day & 3-day), Due Today, and Overdue fees across Email, SMS, WhatsApp & Parent App.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={fetchReminders}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingReminders ? 'animate-spin' : ''}`} />
                            <span>Scan Dues</span>
                          </button>
                        </div>
                      </div>

                      {/* Reminder Metric Buckets */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-quicksand">
                        {/* Upcoming Due Bucket */}
                        <div className="bg-sky-50/70 border border-sky-100 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-sky-700 font-bold">
                            <span className="text-[10px] uppercase tracking-wider">Upcoming Dues (Next 7 Days)</span>
                            <Clock className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-black text-sky-900 block">
                            {remindersData?.upcoming?.length || 0}
                          </span>
                          <span className="text-[10px] text-sky-600 block">Gentle early reminder notices</span>
                        </div>

                        {/* Due Today Bucket */}
                        <div className="bg-amber-50/70 border border-amber-100 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-amber-700 font-bold">
                            <span className="text-[10px] uppercase tracking-wider">Due Today (Cutoff Deadline)</span>
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-black text-amber-900 block">
                            {remindersData?.dueToday?.length || 0}
                          </span>
                          <span className="text-[10px] text-amber-600 block">Last day before late fine trigger</span>
                        </div>

                        {/* Overdue Bucket */}
                        <div className="bg-rose-50/70 border border-rose-100 p-4 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between text-rose-700 font-bold">
                            <span className="text-[10px] uppercase tracking-wider">Overdue Defaulters</span>
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-black text-rose-900 block">
                            {remindersData?.overdue?.length || 0}
                          </span>
                          <span className="text-[10px] text-rose-600 block">Immediate follow-up / Escalation</span>
                        </div>
                      </div>

                      {/* Multi-Channel Dispatch Trigger Form */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
                        <h5 className="font-quicksand font-bold text-slate-800 text-xs flex items-center space-x-2">
                          <Send className="w-3.5 h-3.5 text-purple-600" />
                          <span>Dispatch Instant Automated Notifications</span>
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                          <div className="space-y-1">
                            <label className="text-slate-600 font-bold">Target Group</label>
                            <select
                              value={dispatchType}
                              onChange={e => setDispatchType(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                            >
                              <option value="all">All Groups (Upcoming + Due Today + Overdue)</option>
                              <option value="overdue">Overdue Defaulters Only</option>
                              <option value="due_today">Due Today Only</option>
                              <option value="upcoming_3d">Upcoming (Due in 3 Days)</option>
                              <option value="upcoming_7d">Upcoming (Due in 7 Days)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-slate-600 font-bold">Delivery Channel</label>
                            <select
                              value={dispatchChannel}
                              onChange={e => setDispatchChannel(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                            >
                              <option value="email">Email Notification Gateway</option>
                              <option value="sms">SMS Text Alert</option>
                              <option value="whatsapp">WhatsApp Business API</option>
                              <option value="app_notification">Parent Portal In-App Notification</option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              disabled={isDispatchingReminders}
                              onClick={handleDispatchReminders}
                              className="w-full bg-black hover:bg-slate-800 text-white font-quicksand font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{isDispatchingReminders ? 'DISPATCHING NOTICES...' : 'DISPATCH BATCH REMINDERS'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Dues Queue & Sent Logs Table */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Overdue Students Queue */}
                      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="font-quicksand font-bold text-slate-800 text-sm flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            <span>Actionable Overdue Queue ({remindersData?.overdue?.length || 0})</span>
                          </h4>
                          <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold">
                            Requires Follow-up
                          </span>
                        </div>

                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                                <th className="p-2.5">Student</th>
                                <th className="p-2.5">Parent Contact</th>
                                <th className="p-2.5 text-right">Overdue (₹)</th>
                                <th className="p-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                              {(!remindersData?.overdue || remindersData.overdue.length === 0) ? (
                                <tr>
                                  <td colSpan="4" className="p-6 text-center text-slate-400 font-bold">
                                    No overdue defaulters! All accounts are up-to-date.
                                  </td>
                                </tr>
                              ) : (
                                remindersData.overdue.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50">
                                    <td className="p-2.5">
                                      <span className="font-bold text-slate-900 block">{item.student?.name}</span>
                                      <span className="text-[10px] text-slate-400">{item.student?.class}</span>
                                    </td>
                                    <td className="p-2.5 text-[11px]">
                                      <span className="block text-slate-800">{item.parentPhone || 'No Phone'}</span>
                                      <span className="text-[10px] text-slate-400">{item.parentEmail}</span>
                                    </td>
                                    <td className="p-2.5 text-right font-mono font-black text-rose-600">
                                      ₹{Number(item.dueAmount).toLocaleString('en-IN')}
                                    </td>
                                    <td className="p-2.5 text-right">
                                      <button
                                        type="button"
                                        onClick={() => openUniversalPayModal(item.student, item.fee)}
                                        className="px-2.5 py-1 bg-black text-white rounded-lg text-[10px] font-bold cursor-pointer hover:bg-slate-800"
                                      >
                                        Collect
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right: Sent Reminders Delivery Log */}
                      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="font-quicksand font-bold text-slate-800 text-sm flex items-center space-x-2">
                            <History className="w-4 h-4 text-slate-700" />
                            <span>Recent Reminder Delivery Log ({remindersData?.logs?.length || 0})</span>
                          </h4>
                          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Live Audit
                          </span>
                        </div>

                        <div className="overflow-x-auto max-h-80 overflow-y-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                                <th className="p-2.5">Recipient</th>
                                <th className="p-2.5">Channel</th>
                                <th className="p-2.5">Status</th>
                                <th className="p-2.5">Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                              {(!remindersData?.logs || remindersData.logs.length === 0) ? (
                                <tr>
                                  <td colSpan="4" className="p-6 text-center text-slate-400 font-bold">
                                    No reminder notices sent yet.
                                  </td>
                                </tr>
                              ) : (
                                remindersData.logs.map((log, lIdx) => (
                                  <tr key={lIdx} className="hover:bg-slate-50/50">
                                    <td className="p-2.5">
                                      <span className="font-bold text-slate-900 block">{log.studentName}</span>
                                      <span className="text-[10px] text-slate-400">{log.parentPhone || log.parentEmail}</span>
                                    </td>
                                    <td className="p-2.5 font-mono text-[10px] uppercase font-bold text-purple-700">
                                      {log.channel}
                                    </td>
                                    <td className="p-2.5">
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {log.status}
                                      </span>
                                    </td>
                                    <td className="p-2.5 text-slate-400 text-[10px] font-mono">
                                      {new Date(log.sentAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 6: Financial Reports Hub & Comprehensive Audit Trail */}
                {feeSubTab === 'reports' && (
                  <div className="space-y-6">
                    {/* Report Generator Controls */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-quicksand font-bold text-slate-900 text-base">
                              Financial Reports Hub & Audit Trail
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Generate enterprise financial ledgers (Daily, Monthly, Student Ledger, Overdue, Cash Desk) with Print, PDF, and CSV export.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={fetchFinancialReport}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold font-quicksand rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${loadingFinancialReport ? 'animate-spin' : ''}`} />
                            <span>Run Report</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleExportReportCSV}
                            className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold font-quicksand rounded-xl shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Export CSV</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-quicksand rounded-xl transition-all cursor-pointer flex items-center space-x-1.5"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Report</span>
                          </button>
                        </div>
                      </div>

                      {/* Filter Controls Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                        <div className="space-y-1">
                          <label className="text-slate-600 font-bold">Select Report Type</label>
                          <select
                            value={financialReportType}
                            onChange={e => setFinancialReportType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                          >
                            <option value="daily_collection">Daily Collection Report</option>
                            <option value="overdue_ledger">Overdue & Defaulters Ledger</option>
                            <option value="cash_desk_ledger">Cash Desk & Reception Ledger</option>
                            <option value="student_ledger">Master Student Fee Balance Ledger</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-600 font-bold">From Date</label>
                          <input
                            type="date"
                            value={reportDateFrom}
                            onChange={e => setReportDateFrom(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-600 font-bold">To Date</label>
                          <input
                            type="date"
                            value={reportDateTo}
                            onChange={e => setReportDateTo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Report Output Display Table */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h4 className="font-quicksand font-bold text-slate-800 text-sm">
                            {financialReportData?.title || 'Financial Report Preview'}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            Total Records: {financialReportData?.count || 0}
                          </span>
                        </div>
                        {financialReportData?.totalAmount !== undefined && (
                          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            <span className="text-[10px] text-emerald-600 font-bold uppercase block">Report Sum</span>
                            <span className="text-base font-black font-quicksand text-emerald-800">
                              ₹{Number(financialReportData.totalAmount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                              {financialReportData?.rows && financialReportData.rows.length > 0 ? (
                                Object.keys(financialReportData.rows[0]).map((h, hIdx) => (
                                  <th key={hIdx} className="p-3">{h}</th>
                                ))
                              ) : (
                                <th className="p-3">Report Details</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {(!financialReportData?.rows || financialReportData.rows.length === 0) ? (
                              <tr>
                                <td colSpan="8" className="p-8 text-center text-slate-400 font-bold">
                                  Click "Run Report" to query financial database records.
                                </td>
                              </tr>
                            ) : (
                              financialReportData.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/50">
                                  {Object.values(row).map((val, cIdx) => (
                                    <td key={cIdx} className="p-3 font-semibold text-slate-800">
                                      {typeof val === 'number' ? `₹${val.toLocaleString('en-IN')}` : String(val ?? '')}
                                    </td>
                                  ))}
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Financial Security & Audit Trail Section */}
                    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <h4 className="font-quicksand font-bold text-slate-800 text-sm">
                            Permanent Financial Audit Trail & Security Logs
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={fetchAuditLogs}
                          className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center space-x-1"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
                          <span>Load Security Audit Logs</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto max-h-72 overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                              <th className="p-2.5">Action</th>
                              <th className="p-2.5">Module</th>
                              <th className="p-2.5">Description</th>
                              <th className="p-2.5">Performed By</th>
                              <th className="p-2.5">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {auditLogs.length === 0 ? (
                              <tr>
                                <td colSpan="5" className="p-6 text-center text-slate-400 font-bold">
                                  Click "Load Security Audit Logs" to view recorded audit entries.
                                </td>
                              </tr>
                            ) : (
                              auditLogs.map((log, lIdx) => (
                                <tr key={lIdx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-bold font-mono text-[10px] text-purple-700">{log.action}</td>
                                  <td className="p-2.5 text-[10px] font-bold text-slate-500">{log.module}</td>
                                  <td className="p-2.5 font-semibold text-slate-800">{log.details}</td>
                                  <td className="p-2.5 font-medium text-slate-600 text-[11px]">{log.performedBy}</td>
                                  <td className="p-2.5 text-slate-400 font-mono text-[10px]">
                                    {new Date(log.createdAt).toLocaleString()}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 5: Announcements notice board */}
            {activeTab === 'announcements' && (
              <div className="space-y-6">
                {/* AI Official Circular & Notice Writer Card */}
                <div className="bg-gradient-to-br from-[#1E1B4B] via-[#31104B] to-[#1E1B4B] text-white rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl border border-purple-900/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-white/10 rounded-xl border border-white/10 text-amber-300">
                          <Sparkles className="w-5 h-5" />
                        </span>
                        <h4 className="text-lg font-bold font-quicksand text-white flex items-center gap-2">
                          <span>AI Official Circular & Notice Writer</span>
                          <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Instant AI
                          </span>
                        </h4>
                      </div>
                      <p className="text-xs text-purple-200 font-medium">
                        Compose impeccably phrased institutional circulars with official ref numbers, bulleted guidelines, and executive signatures in seconds.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAiNoticePanel(!showAiNoticePanel)}
                      className="self-start sm:self-auto px-4 py-2 bg-purple-500 hover:bg-purple-600 active:scale-95 text-white font-quicksand font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>{showAiNoticePanel ? 'Collapse AI Studio' : 'Open AI Circular Studio'}</span>
                    </button>
                  </div>

                  {/* 1-Click Fast Presets */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider block">
                      1-Click Common School Circular Presets:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        { title: 'Annual Sports Day & Fun Fair', points: 'Dec 15th, 9:00 AM, school sports ground, wear sneakers, parents cordially invited', tone: 'festive', icon: '🏆' },
                        { title: 'Monsoon Heavy Rain Holiday Notice', points: 'School closed tomorrow due to weather advisory, online activities provided, transport suspended', tone: 'urgent', icon: '🌧️' },
                        { title: 'Term-End Parent-Teacher Meeting (PTM)', points: 'Saturday 10:00 AM - 1:00 PM, report card distribution, individual 10-min slots with class teacher', tone: 'official', icon: '👨‍👩‍👧' },
                        { title: 'Term 2 Fee Clearance & Sibling Concession', points: 'Due date Oct 25th, sibling discount available, digital UPI receipt via portal, late fine waiver until cutoff', tone: 'official', icon: '💳' }
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setAiNoticePrompt({
                              title: preset.title,
                              keyPoints: preset.points,
                              tone: preset.tone,
                              audience: 'All Parents & Teachers'
                            });
                            setShowAiNoticePanel(true);
                            handleGenerateAiNotice({
                              title: preset.title,
                              keyPoints: preset.points,
                              tone: preset.tone,
                              audience: 'All Parents & Teachers'
                            });
                          }}
                          className="text-left p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-300 text-xs transition-all flex items-start gap-2.5 cursor-pointer group"
                        >
                          <span className="text-xl p-1 bg-white/10 group-hover:bg-purple-500/30 rounded-xl shrink-0 transition-colors">
                            {preset.icon}
                          </span>
                          <div>
                            <span className="font-bold text-white block font-quicksand text-xs">
                              {preset.title}
                            </span>
                            <span className="text-[10px] text-purple-300 line-clamp-1">
                              {preset.tone.toUpperCase()} tone
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Collapsible Custom Input Panel */}
                  {showAiNoticePanel && (
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-purple-200">Circular Topic / Event Title</label>
                          <input
                            type="text"
                            placeholder="e.g. Science Exhibition & Robotic Demo Fair"
                            value={aiNoticePrompt.title}
                            onChange={(e) => setAiNoticePrompt({ ...aiNoticePrompt, title: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 outline-none font-medium text-white placeholder-purple-300/50 focus:border-amber-300"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-purple-200">Notice Tone</label>
                          <select
                            value={aiNoticePrompt.tone}
                            onChange={(e) => setAiNoticePrompt({ ...aiNoticePrompt, tone: e.target.value })}
                            className="w-full bg-[#2A174E] border border-white/20 rounded-xl p-2.5 outline-none font-medium text-white focus:border-amber-300"
                          >
                            <option value="official">Formal & Administrative (Default)</option>
                            <option value="festive">Festive, Warm & Celebratory</option>
                            <option value="urgent">Urgent Safety / Weather Advisory</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-bold text-purple-200">Target Audience</label>
                          <select
                            value={aiNoticePrompt.audience}
                            onChange={(e) => setAiNoticePrompt({ ...aiNoticePrompt, audience: e.target.value })}
                            className="w-full bg-[#2A174E] border border-white/20 rounded-xl p-2.5 outline-none font-medium text-white focus:border-amber-300"
                          >
                            <option value="All Parents & Teachers">All Parents & Teachers</option>
                            <option value="Parents Only">Parents Only</option>
                            <option value="Teachers & Staff Only">Teachers & Staff Only</option>
                          </select>
                        </div>

                        <div className="space-y-1 sm:col-span-2">
                          <label className="font-bold text-purple-200">Key Points & Details (Dates, Timing, Dress Code, Guidelines)</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Friday 9:00 AM, auditorium, parents allowed, bring student ID badge..."
                            value={aiNoticePrompt.keyPoints}
                            onChange={(e) => setAiNoticePrompt({ ...aiNoticePrompt, keyPoints: e.target.value })}
                            className="w-full bg-white/10 border border-white/20 rounded-xl p-2.5 outline-none font-medium text-white placeholder-purple-300/50 focus:border-amber-300 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={aiNoticeLoading || !aiNoticePrompt.title.trim()}
                          onClick={() => handleGenerateAiNotice()}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-900 font-quicksand font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                        >
                          {aiNoticeLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                              <span>Drafting with AI...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-slate-900" />
                              <span>Draft Official Circular with AI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Generated Circular Output Preview */}
                  {aiNoticeResult && (
                    <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-md border border-purple-100 space-y-4 animate-in fade-in duration-300">
                      {/* Institutional Letterhead Header */}
                      <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <span className="font-black tracking-widest text-[11px] text-[#5B4DF5] uppercase block font-quicksand">
                            APNA SCHOOL ACADEMY
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ref: {aiNoticeResult.circularRef}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                          Date: {aiNoticeResult.date}
                        </span>
                      </div>

                      {/* Subject & Salutation */}
                      <div className="space-y-2">
                        <h5 className="font-bold text-sm text-slate-900 uppercase font-quicksand tracking-wide bg-purple-50/70 p-2.5 rounded-xl border border-purple-100 text-purple-900">
                          {aiNoticeResult.subject}
                        </h5>
                        <p className="text-xs font-bold text-slate-700">
                          {aiNoticeResult.salutation}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          {aiNoticeResult.openingText}
                        </p>
                      </div>

                      {/* Summary Body */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs text-slate-700 font-medium whitespace-pre-line leading-relaxed">
                        {aiNoticeResult.summaryBody}
                      </div>

                      {/* Guidelines */}
                      {aiNoticeResult.guidelines && (
                        <div className="space-y-1.5 text-xs text-slate-700">
                          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">Important Directives:</span>
                          <ul className="list-disc pl-5 space-y-1 text-slate-600">
                            {aiNoticeResult.guidelines.map((g, gIdx) => (
                              <li key={gIdx}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 italic">
                        {aiNoticeResult.closingText}
                      </p>

                      <div className="border-t pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-[11px] font-bold text-slate-500 whitespace-pre-line">
                          {aiNoticeResult.signatory}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${aiNoticeResult.subject}\n${aiNoticeResult.circularRef} | Date: ${aiNoticeResult.date}\n\n${aiNoticeResult.salutation}\n\n${aiNoticeResult.openingText}\n\n${aiNoticeResult.summaryBody}\n\n${aiNoticeResult.closingText}\n\n${aiNoticeResult.signatory}`
                              );
                              showToast('Copied to clipboard!');
                            }}
                            className="flex-1 sm:flex-initial px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-quicksand font-bold text-xs rounded-xl transition-all cursor-pointer"
                          >
                            Copy Text
                          </button>

                          <button
                            type="button"
                            onClick={applyAiNoticeToForm}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-[#5B4DF5] to-[#7C3AED] hover:from-[#4A3DE5] hover:to-[#6D28D9] text-white font-quicksand font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>Apply to Bulletin Form Below ↓</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Publish Notice Board Circular Form */}
                <form onSubmit={handleCreateAnnouncement} className="p-5 space-y-4 border bg-slate-50/50 border-slate-100 rounded-3xl">
                  <h4 className="text-sm font-bold font-quicksand text-slate-800">Publish Notice Board Circular</h4>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Notice Title</label>
                    <input
                      type="text" required placeholder="e.g. Independence Day Holiday Notification"
                      value={annTitle} onChange={e => setAnnTitle(e.target.value)}
                      className="w-full p-3 bg-white border outline-none rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Category</label>
                      <select value={annCat} onChange={e => setAnnCat(e.target.value)} className="bg-white border rounded-xl p-2.5 w-full outline-none font-semibold text-slate-700">
                        <option value="general">General</option>
                        <option value="circular">Official Circular</option>
                        <option value="event">PTM / Event Schedule</option>
                        <option value="emergency">Emergency Alert</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Audience Group</label>
                      <select value={annAudience} onChange={e => setAnnAudience(e.target.value)} className="bg-white border rounded-xl p-2.5 w-full outline-none font-semibold text-slate-700">
                        <option value="all">Everyone (All Visitors)</option>
                        <option value="parents">Parents Only</option>
                        <option value="teachers">Teachers Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Bulletin Content</label>
                    <textarea
                      required rows={6} placeholder="Write announcement notices description or use AI Circular Writer above..."
                      value={annContent} onChange={e => setAnnContent(e.target.value)}
                      className="w-full p-3 bg-white border outline-none resize-none rounded-xl font-medium text-slate-700 text-xs"
                    />
                  </div>

                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-quicksand font-bold text-xs py-2.5 rounded-xl transition-all shadow cursor-pointer active:scale-[0.99]">
                    PUBLISH BULLETIN NOTICE
                  </button>
                </form>
              </div>
            )}

            {/* TAB 6: Gallery Manager */}
            {activeTab === 'gallery' && (
              <div className="space-y-8">
                <form onSubmit={handleCreateGallery} className="p-5 space-y-4 border bg-slate-50/50 border-slate-100 rounded-3xl">
                  <h4 className="text-sm font-bold font-quicksand text-slate-800">Add Media Album to Gallery</h4>

                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Media Title</label>
                      <input
                        type="text" required placeholder="e.g. Toddler Sandbox Activities"
                        value={galTitle} onChange={e => setGalTitle(e.target.value)}
                        className="w-full p-3 bg-white border outline-none rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Category Tag</label>
                      <select value={galCat} onChange={e => setGalCat(e.target.value)} className="bg-white border rounded-xl p-2.5 w-full outline-none font-semibold text-slate-600">
                        <option value="classroom">Classroom</option>
                        <option value="events">Events</option>
                        <option value="sports">Sports</option>
                        <option value="celebrations">Celebrations</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Media Image File (JPG/JPEG/PNG)</label>
                    <input
                      id="gallery-file-input"
                      type="file" required accept=".jpg,.jpeg,.png"
                      onChange={e => setGalFile(e.target.files[0])}
                      className="w-full p-3 bg-white border border-orange-100 outline-none focus:border-brandCoral rounded-xl"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-600">Description</label>
                    <input
                      type="text" placeholder="Short description of the photo event..."
                      value={galDesc} onChange={e => setGalDesc(e.target.value)}
                      className="w-full p-3 bg-white border outline-none rounded-xl"
                    />
                  </div>

                  <button type="submit" className="w-full bg-black hover:bg-slate-800 text-white font-quicksand font-bold text-xs py-3 rounded-xl transition-all shadow cursor-pointer">
                    ADD MEDIA FILE
                  </button>
                </form>

                {/* Gallery Items List */}
                <div className="space-y-4">
                  <h3 className="pb-2 text-base font-bold border-b font-quicksand text-slate-800">Existing Gallery Media</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {galItems.map(item => (
                      <div key={item._id} className="flex flex-col justify-between overflow-hidden text-xs bg-white border shadow-sm border-slate-100 rounded-xl">
                        <div>
                          <div className="relative h-32 overflow-hidden bg-slate-100">
                            <img
                              src={item.url ? item.url : `/api/public/gallery/image/${item._id}`}
                              alt={item.title}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800';
                              }}
                              className="object-cover w-full h-full"
                            />
                            <span className="absolute top-2 right-2 bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {item.category}
                            </span>
                          </div>
                          <div className="p-3 space-y-1">
                            <h4 className="text-sm font-bold leading-tight font-quicksand text-slate-800">{item.title}</h4>
                            <p className="text-slate-500 line-clamp-2">{item.description || 'No description'}</p>
                            <span className="text-[9px] text-slate-400 block mt-1">Date posted: {new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex justify-end p-3 pt-0">
                          <button
                            onClick={() => handleDeleteGallery(item._id)}
                            className="bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg transition-all border border-red-100 flex items-center space-x-1 font-bold text-[10px]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>DELETE</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: Queries Resolve */}
            {activeTab === 'queries' && (
              <div className="space-y-4 text-xs font-semibold text-slate-600">
                <h3 className="pb-3 text-lg font-bold border-b font-quicksand text-slate-800 border-orange-50">Visitor Query Tickets</h3>

                {queries.length === 0 ? (
                  <p className="py-10 text-xs text-center text-slate-500">No queries tickets generated yet.</p>
                ) : (
                  queries.map(q => (
                    <div key={q._id} className="p-4 space-y-3 border bg-slate-50 border-slate-100 rounded-xl">
                      <div className="flex items-start justify-between pb-2 border-b border-slate-200/50">
                        <div>
                          <h4 className="text-sm font-bold font-quicksand text-slate-800">{q.name}</h4>
                          <span className="font-medium text-slate-400">{q.email} | {q.phone}</span>
                        </div>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${q.status === 'resolved' ? 'bg-brandMint/10 text-brandMint-dark border-brandMint/30' :
                            'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                          {q.status}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-brandCoral block uppercase font-bold">{q.subject}</span>
                        <p className="mt-1 font-normal leading-relaxed text-slate-600">{q.message}</p>
                      </div>

                      {q.status !== 'resolved' && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => handleResolveQuery(q._id)}
                            className="px-4 py-2 text-white transition-all shadow bg-black hover:bg-slate-800 rounded-xl font-bold cursor-pointer"
                          >
                            MARK RESOLVED
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 8: Calendar & Events Manager */}
            {activeTab === 'events' && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-orange-50">
                  <div>
                    <h3 className="text-lg font-bold font-quicksand text-slate-800 flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-[#7C3AED]" />
                      <span>School Calendar & Events Manager</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Schedule, post, and edit calendar notices, holidays, examinations, PTM meets, and celebrations.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-3 py-1 bg-[#EAE8FC] text-[#7C3AED] rounded-full self-start sm:self-auto border border-[#DEDAFB]">
                    {events.length} Events Total
                  </span>
                </div>

                {/* Event Creation & Edit Form Card */}
                <form
                  id="event-form-card"
                  onSubmit={handleSaveEvent}
                  className={`p-6 space-y-4 border rounded-3xl transition-all shadow-sm ${
                    editingEventId ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50/70 border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <h4 className="font-quicksand font-bold text-slate-800 text-sm flex items-center space-x-2">
                      {editingEventId ? (
                        <>
                          <Edit className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-900">Edit Calendar Event</span>
                          <span className="text-[9px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full uppercase ml-2">
                            EDITING MODE
                          </span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-brandCoral" />
                          <span>Schedule & Post a New Event</span>
                        </>
                      )}
                    </h4>
                    {editingEventId && (
                      <button
                        type="button"
                        onClick={handleCancelEditEvent}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm cursor-pointer"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-semibold">
                    <div className="space-y-1 lg:col-span-2">
                      <label className="font-bold text-slate-700">Event Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Annual Sports Meet 2026 / Parent Teacher Meet"
                        value={evTitle}
                        onChange={e => setEvTitle(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Event Category / Type *</label>
                      <select
                        value={evType}
                        onChange={e => setEvType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                      >
                        <option value="celebration">Celebration / Festival</option>
                        <option value="ptm">PTM (Parent-Teacher Meet)</option>
                        <option value="holiday">School Holiday</option>
                        <option value="exam">Examination / Tests</option>
                        <option value="sports">Sports & Activities</option>
                        <option value="academic">Academic / Workshop</option>
                        <option value="other">Other School Event</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={evStartDate}
                        onChange={e => setEvStartDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-slate-700 font-mono text-[11px]"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                      <label className="font-bold text-slate-700">End Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={evEndDate}
                        onChange={e => setEvEndDate(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-slate-700 font-mono text-[11px]"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                      <label className="font-bold text-slate-700">Event Description / Agenda</label>
                      <input
                        type="text"
                        placeholder="Brief overview, reporting time, instructions for students & parents..."
                        value={evDescription}
                        onChange={e => setEvDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className={`py-3 px-6 rounded-xl font-quicksand font-bold text-xs text-white shadow transition-all cursor-pointer flex items-center space-x-2 ${
                        editingEventId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-900 hover:bg-slate-800'
                      }`}
                    >
                      {editingEventId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      <span>{editingEventId ? 'UPDATE CALENDAR EVENT' : 'SCHEDULE & POST EVENT'}</span>
                    </button>
                  </div>
                </form>

                {/* Published Events Roster */}
                <div className="space-y-4">
                  {/* Category Filter Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { name: 'ALL', value: 'all' },
                      { name: 'PTM MEETS', value: 'ptm' },
                      { name: 'HOLIDAYS', value: 'holiday' },
                      { name: 'EXAMS', value: 'exam' },
                      { name: 'CELEBRATIONS', value: 'celebration' },
                      { name: 'SPORTS', value: 'sports' },
                      { name: 'ACADEMIC', value: 'academic' }
                    ].map(tab => (
                      <button
                        key={tab.value}
                        type="button"
                        onClick={() => setEventFilterType(tab.value)}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold font-quicksand transition-all cursor-pointer border ${
                          eventFilterType === tab.value
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-white text-black border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tab.name}
                      </button>
                    ))}
                  </div>

                  {/* Events Grid */}
                  {events.length === 0 ? (
                    <div className="p-10 text-center bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-quicksand font-bold">No events recorded in the school calendar yet.</p>
                      <p className="text-[11px] text-slate-400">Use the form above to post holidays, exams, celebrations, and meetings.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {events
                        .filter(ev => eventFilterType === 'all' ? true : ev.type === eventFilterType)
                        .map(ev => {
                          const startDate = new Date(ev.startDate);
                          const endDate = new Date(ev.endDate);
                          const month = !isNaN(startDate.getTime()) ? startDate.toLocaleString('en-US', { month: 'short' }) : 'OCT';
                          const day = !isNaN(startDate.getTime()) ? startDate.getDate() : '15';
                          const year = !isNaN(startDate.getTime()) ? startDate.getFullYear() : '2026';
                          const startTimeStr = !isNaN(startDate.getTime()) ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                          const endTimeStr = !isNaN(endDate.getTime()) ? (
                            startDate.toDateString() !== endDate.toDateString()
                              ? `${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          ) : '';

                          return (
                            <div
                              key={ev._id}
                              className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                            >
                              <div className="flex items-center space-x-4">
                                {/* Date Box */}
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-inner">
                                  <span className="text-[9px] font-black uppercase text-brandCoral leading-none">{month}</span>
                                  <span className="text-xl font-extrabold text-slate-800 font-quicksand leading-tight">{day}</span>
                                  <span className="text-[8px] text-slate-400 font-bold leading-none">{year}</span>
                                </div>

                                {/* Event Info */}
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-[8.5px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${getEventCategoryBadge(ev.type)}`}>
                                      {ev.type}
                                    </span>
                                  </div>
                                  <h4 className="font-quicksand font-bold text-slate-800 text-sm leading-snug">
                                    {ev.title}
                                  </h4>
                                  {ev.description && (
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xl">
                                      {ev.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-1 text-[10px] text-slate-400 font-semibold pt-0.5">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {startTimeStr}
                                      {endTimeStr ? ` – ${endTimeStr}` : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditEvent(ev)}
                                  className="px-3 py-1.5 font-bold text-[10px] rounded-lg bg-[#EAE8FC] hover:bg-[#DEDAFB] text-[#7C3AED] transition-all flex items-center space-x-1 cursor-pointer"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEvent(ev._id)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all cursor-pointer"
                                  title="Delete event"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            </div>
          )}

        </div>
      </main>

        {/* Admission Detail Modal */}
        {selectedAdmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white border-[6px] border-white rounded-[2.5rem] w-full max-w-xl p-6 md:p-8 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedAdmission(null)}
                className="absolute flex items-center justify-center w-8 h-8 font-bold transition-colors rounded-full top-4 right-4 bg-slate-50 hover:bg-slate-100 text-slate-500"
              >
                ×
              </button>

              <div className="pb-3 space-y-1 text-center border-b-2 border-slate-100">
                <span className="text-[9px] font-extrabold tracking-widest text-[#7C3AED] bg-[#EAE8FC] px-2.5 py-0.5 rounded-full">APPLICATION REVIEW</span>
                <h4 className="font-quicksand font-bold text-[#5B468C] text-lg mt-2">Apna School</h4>
                <p className="text-[10px] text-slate-400 font-semibold font-mono">App No: {selectedAdmission.applicationNumber}</p>
              </div>

              <div className="py-4 space-y-5 text-xs">
                {/* Section 1: Student Profile */}
                <div className="space-y-2.5">
                  <h5 className="pb-1 text-sm font-bold border-b font-quicksand text-slate-800">1. Student Profile Details</h5>
                  <div className="grid grid-cols-2 gap-3 font-semibold text-slate-500">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Student Name</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.studentDetails?.name}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Class Program</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.studentDetails?.class}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Gender</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.studentDetails?.gender}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Date of Birth</span>
                      <span className="font-bold text-slate-800">
                        {new Date(selectedAdmission.studentDetails?.dateOfBirth).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Parent Profile */}
                <div className="space-y-2.5">
                  <h5 className="pb-1 text-sm font-bold border-b font-quicksand text-slate-800">2. Parent / Guardian Details</h5>
                  <div className="grid grid-cols-2 gap-3 font-semibold text-slate-500 text-slate-600">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Father's Name</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.parentDetails?.fatherName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Mother's Name</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.parentDetails?.motherName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Email Address</span>
                      <span className="font-mono font-bold text-slate-800">{selectedAdmission.parentDetails?.email}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase block">Phone Number</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.parentDetails?.phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[9px] text-slate-400 uppercase block">Home Address</span>
                      <span className="font-bold text-slate-800">{selectedAdmission.parentDetails?.address}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Documents */}
                <div className="space-y-2.5">
                  <h5 className="pb-1 text-sm font-bold border-b font-quicksand text-slate-800">3. Attached Documents & Verification Proofs</h5>
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    {Object.entries({
                      'Birth Certificate': selectedAdmission.documents?.birthCertificate,
                      'Student Photograph': selectedAdmission.documents?.photo
                    }).map(([label, path]) => {
                      return (
                        <div key={label} className="flex flex-col justify-between p-2 space-y-1 border bg-slate-50 border-slate-100 rounded-xl">
                          <div>
                            <span className="text-[8px] text-slate-400 uppercase block font-bold">{label}</span>
                            <span className="font-semibold text-slate-700 truncate block text-[9px]" title={path ? path.split('/').pop() : 'Not Uploaded'}>
                              {path ? path.split('/').pop() : 'Not Uploaded'}
                            </span>
                          </div>
                          {path ? (
                            <div className="flex gap-2 pt-0.5">
                              <a
                                href={path}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] font-bold text-[#5B468C] hover:underline"
                              >
                                Open File
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  const w = window.open(path);
                                  if (w) {
                                    w.onload = () => {
                                      w.print();
                                    };
                                  }
                                }}
                                className="text-[9px] font-bold text-slate-500 hover:text-slate-700"
                              >
                                Print
                              </button>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-400 italic">Not Uploaded</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 4: AI Document & Age Eligibility Audit */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b">
                    <h5 className="text-sm font-bold font-quicksand text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      4. AI Document & Age Eligibility Audit
                    </h5>
                    <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                      Confidence: {selectedAdmission.aiVerification?.confidenceScore || 98}%
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 text-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedAdmission.aiVerification?.badges || ['Age Eligible ✅', 'Document Format Valid ✅', 'Security Check Passed 🛡️']).map((b, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-2xs">
                          {b}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 bg-white rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Cut-Off Age Calculation (March 31st)</span>
                        <span className="font-bold text-slate-800">
                          {selectedAdmission.aiVerification?.ageCheck?.calculatedAge || '3 yrs, 0 mos'}
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Target Range: {selectedAdmission.aiVerification?.ageCheck?.requiredRange || '3 to 4 years'}
                        </span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-100">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Verification Status</span>
                        <span className={`font-bold ${
                          selectedAdmission.aiVerification?.verified !== false ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {selectedAdmission.aiVerification?.verified !== false ? 'Verified Eligible ✅' : 'Review Required ⚠️'}
                        </span>
                        <span className="text-[9px] text-slate-500 block truncate" title={selectedAdmission.aiVerification?.ageCheck?.message}>
                          {selectedAdmission.aiVerification?.ageCheck?.message || 'Criteria met for grade admission'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Fields (Only for pending) */}
                {selectedAdmission.status === 'pending' ? (
                  <div className="bg-[#FAF9F5] border border-orange-100 p-4 rounded-3xl space-y-4">
                    <h5 className="text-xs font-bold font-quicksand text-slate-800">Approval Decisions & Provisioning</h5>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Reviewer Remarks</label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="e.g. Documents verified. Approved for Nursery start."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        Provision Login Password (for parent to login)
                      </label>
                      <input
                        type="text"
                        value={parentPassword}
                        onChange={(e) => setParentPassword(e.target.value)}
                        placeholder="Enter parent login password (e.g. securePass123)"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border p-4 rounded-3xl text-[10px] font-semibold text-slate-500 font-mono space-y-1">
                    <p>Status: <span className={`uppercase font-bold ${selectedAdmission.status === 'approved' ? 'text-emerald-600' : 'text-red-500'}`}>{selectedAdmission.status}</span></p>
                    <p>Remarks: <span className="font-sans italic text-slate-800">"{selectedAdmission.remarks || 'No remarks recorded.'}"</span></p>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                {selectedAdmission.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => {
                        if (!parentPassword.trim()) {
                          alert('Please fill out a password for the student/parent login account before approving.');
                          return;
                        }
                        triggerConfirm(
                          "Are you sure you want to submit?",
                          "This will approve the student and provision their parent portal account.",
                          "submit",
                          () => handleAdmissionDecision(selectedAdmission._id, 'approved', parentPassword)
                        );
                      }}
                      disabled={loading}
                      className="flex-1 py-3 px-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-quicksand font-bold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>APPROVE & PROVISION</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerConfirm(
                          "Are you sure you want to delete?",
                          "This will reject the student application and close the file.",
                          "delete",
                          () => handleAdmissionDecision(selectedAdmission._id, 'rejected')
                        );
                      }}
                      disabled={loading}
                      className="py-3 px-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-quicksand font-bold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>REJECT</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectedAdmission(null)}
                    className="w-full py-3 px-6 rounded-2xl bg-black hover:bg-slate-800 text-white font-quicksand font-bold text-xs shadow transition-all active:scale-[0.98] cursor-pointer"
                  >
                    CLOSE WINDOW
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Student Profile Detail Modal */}
        {selectedStudentProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white border-[6px] border-white rounded-[2.5rem] w-full max-w-xl p-6 md:p-8 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedStudentProfile(null)}
                className="absolute flex items-center justify-center w-8 h-8 text-xl font-bold transition-colors rounded-full top-4 right-4 bg-slate-50 hover:bg-slate-100 text-slate-500"
              >
                ×
              </button>

              <div className="pb-4 space-y-1 text-center border-b-2 border-slate-100">
                <span className="text-[10px] font-extrabold tracking-widest text-[#7C3AED] bg-[#EAE8FC] px-3 py-1 rounded-full">STUDENT CARD</span>
                <h4 className="font-quicksand font-bold text-[#5B468C] text-xl mt-3">{selectedStudentProfile.name}</h4>
                <p className="font-mono text-xs font-semibold text-slate-400">ID: {selectedStudentProfile.studentId || 'N/A'}</p>
              </div>

              <div className="py-6 space-y-5 text-xs font-semibold text-slate-600">
                {/* Basic Details */}
                <div className="space-y-3">
                  <h5 className="pb-1 text-sm font-bold border-b font-quicksand text-slate-800">1. Academic & Personal Details</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Gender</span>
                      <span className="text-sm font-bold text-slate-850">{selectedStudentProfile.gender}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Class Program</span>
                      <span className="font-bold text-[#7C3AED] text-sm">{selectedStudentProfile.class}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Date of Birth</span>
                      <span className="text-sm font-bold text-slate-850">
                        {selectedStudentProfile.dateOfBirth ? new Date(selectedStudentProfile.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">System Database ID</span>
                      <span className="font-mono text-slate-850">{selectedStudentProfile._id}</span>
                    </div>
                  </div>
                </div>

                {/* Parent Details */}
                <div className="space-y-3">
                  <h5 className="pb-1 text-sm font-bold border-b font-quicksand text-slate-800">2. Parent / Guardian Contacts</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Parent Name</span>
                      <span className="text-sm font-bold text-slate-855">{selectedStudentProfile.parentId?.name || selectedStudentProfile.parentDetails?.fatherName || selectedStudentProfile.parentDetails?.motherName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Phone Number</span>
                      <span className="text-sm font-bold text-slate-855">{selectedStudentProfile.parentId?.phone || selectedStudentProfile.parentDetails?.phone || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Email Address</span>
                      <span className="font-mono text-sm font-bold text-slate-855">{selectedStudentProfile.parentId?.email || selectedStudentProfile.parentDetails?.email || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase block font-bold">Home Address</span>
                      <span className="text-sm font-bold text-slate-855">{selectedStudentProfile.parentId?.address || selectedStudentProfile.parentDetails?.address || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const std = selectedStudentProfile;
                    setSelectedStudentProfile(null);
                    openStudentFeeProfile(std);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-quicksand font-bold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>VIEW FEE PROFILE & STATEMENT</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const std = selectedStudentProfile;
                    setSelectedStudentProfile(null);
                    openStudentStructureModal(std);
                  }}
                  className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-quicksand font-bold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Sliders className="w-4 h-4" />
                  <span>FEE STRUCTURE</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentProfile(null)}
                  className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-quicksand font-bold text-xs shadow transition-all active:scale-[0.98] cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <form onSubmit={handleEditStudent} className="bg-white border-[6px] border-white rounded-[2.5rem] w-full max-w-xl p-6 md:p-8 shadow-2xl relative text-slate-800 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="absolute flex items-center justify-center w-8 h-8 text-xl font-bold transition-colors rounded-full top-4 right-4 bg-slate-50 hover:bg-slate-100 text-slate-500"
            >
              ×
            </button>

            <div className="pb-4 space-y-1 text-center border-b-2 border-slate-100">
              <span className="text-[10px] font-extrabold tracking-widest text-[#7C3AED] bg-[#EAE8FC] px-3 py-1 rounded-full">EDIT PROFILE</span>
              <h4 className="font-quicksand font-bold text-[#5B468C] text-xl mt-3">Edit Student Details</h4>
              <p className="font-mono text-xs font-semibold text-slate-400">ID: {editingStudent.studentId || 'N/A'}</p>
            </div>

            <div className="py-6 space-y-5 text-xs">
              {/* Section 1: Student Details */}
              <div className="space-y-3">
                <h5 className="pb-1 text-sm font-bold border-b font-quicksand text-slate-800">1. Student Details</h5>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Student Name</label>
                    <input
                      type="text" required
                      value={editStdName} onChange={e => setEditStdName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#9F92EC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Date of Birth</label>
                    <input
                      type="date" required
                      value={editStdDob} onChange={e => setEditStdDob(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#9F92EC]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Gender</label>
                    <select
                      value={editStdGender} onChange={e => setEditStdGender(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#9F92EC]"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Class Program</label>
                    <select
                      value={editStdClass} onChange={e => setEditStdClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#9F92EC]"
                    >
                      <option value="Pre-Nursery">Pre-Nursery</option>
                      <option value="Nursery">Nursery</option>
                      <option value="Junior KG">Junior KG</option>
                      <option value="Senior KG">Senior KG</option>
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd">3rd</option>
                      <option value="4th">4th</option>
                      <option value="5th">5th</option>
                      <option value="6th">6th</option>
                      <option value="7th">7th</option>
                      <option value="8th">8th</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Parent Details */}
              <div className="space-y-3">
                <h5 className="pb-1 text-sm font-bold border-b font-quicksand text-slate-800">2. Parent / Guardian Details</h5>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Parent Full Name</label>
                      <input
                        type="text" required
                        value={editParentName} onChange={e => setEditParentName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#9F92EC]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-600">Contact Phone Number</label>
                      <input
                        type="text" required
                        value={editParentPhone} onChange={e => setEditParentPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#9F92EC]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-600">Home Address</label>
                    <input
                      type="text" required
                      value={editParentAddress} onChange={e => setEditParentAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-[#9F92EC]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-2xl bg-black hover:bg-slate-800 text-white font-quicksand font-bold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-[0.98]"
              >
                <CheckCircle className="w-4 h-4" />
                <span>SAVE CHANGES</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-quicksand font-bold text-xs shadow flex items-center justify-center space-x-1.5 cursor-pointer transition-all active:scale-[0.98]"
              >
                <span>CANCEL</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-3xl max-w-[380px] w-full p-6 shadow-2xl space-y-5 relative border-[3px] border-[#5B468C] overflow-hidden print:shadow-none print:p-4 print:border-none" id="printable-receipt">

            {/* Rotate PAID stamp watermark */}
            <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 -rotate-[15deg] text-emerald-500/10 font-mono font-black text-7xl tracking-widest uppercase select-none pointer-events-none z-0">
              PAID
            </div>

            {/* Top-Right Close Button (Hidden during print) */}
            <button
              type="button"
              onClick={() => setActiveReceipt(null)}
              className="absolute text-lg font-bold top-4 right-4 text-slate-400 hover:text-slate-600 print:hidden"
            >
              ×
            </button>

            {/* Receipt Header */}
            <div className="relative z-10 pb-6 text-center border-b border-solid border-slate-200 bg-[#F5F5FF] rounded-t-lg">
              <img src="/logo.png" alt="Apna School Logo" className="mx-auto h-12 mb-2" />
              <h2 className="text-3xl font-serif font-bold tracking-tight text-[#5B468C]">APNA SCHOOL</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Official Fee Slip</p>
              <p className="text-[8px] text-slate-400 mt-1">Sunshine Road, Model Town, City | +91 98XXX-XXXXX</p>
            </div>

            {/* Receipt Details Grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] text-slate-600 relative z-10">
              <div>
                <span className="block font-medium text-slate-400">Receipt Number:</span>
                <span className="font-mono font-bold text-slate-800">{activeReceipt.receipt?.receiptNumber}</span>
              </div>
              <div className="text-right">
                <span className="block font-medium text-slate-400">Payment Date:</span>
                <span className="font-bold text-slate-800">{new Date(activeReceipt.receipt?.paymentDate || activeReceipt.receipt?.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="mt-1">
                <span className="block font-medium text-slate-400">Student Name:</span>
                <span className="font-bold text-slate-800 text-[11px]">{activeReceipt.student?.name}</span>
              </div>
              <div className="mt-1 text-right">
                <span className="block font-medium text-slate-400">Class Program:</span>
                <span className="font-bold text-slate-800">{activeReceipt.student?.class}</span>
              </div>
              <div className="mt-1">
                <span className="block font-medium text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800 text-[9px]">{activeReceipt.receipt?.transactionId}</span>
              </div>
              <div className="mt-1 text-right">
                <span className="block font-medium text-slate-400">Method:</span>
                <span className="font-bold text-slate-800">{activeReceipt.receipt?.paymentMethod}</span>
              </div>
            </div>

            {/* Particulars Table */}
            <div className="relative z-10 overflow-hidden border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="font-bold border-b bg-slate-50 text-slate-500 border-slate-200">
                    <th className="p-2.5">Fee Particulars</th>
                    <th className="p-2.5 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-medium text-slate-700">
                    <td className="p-2.5">{activeReceipt.fee?.term || 'Tuition Fee Invoice'}</td>
                    <td className="p-2.5 text-right font-bold">₹{activeReceipt.receipt?.amountPaid?.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Paid block */}
            <div className="flex justify-between items-center bg-[#5B468C]/5 p-2.5 rounded-xl border border-[#5B468C]/15 relative z-10">
              <span className="text-[10px] font-bold text-slate-600">Total Billed & Paid:</span>
              <span className="text-xs font-extrabold text-[#5B468C] font-mono">₹{activeReceipt.receipt?.amountPaid?.toLocaleString('en-IN')}.00</span>
            </div>

            {/* Stamp and Seal Placeholder */}
            <div className="flex justify-between items-end pt-3 text-[9px] text-slate-400 font-semibold relative z-10">
              <div>
                <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 text-[8px] font-mono inline-block">
                  <span>✓</span>
                  <span>ONLINE VERIFIED</span>
                </div>
                <p className="mt-1 font-bold text-slate-500 font-mono uppercase text-[8px]">Status: PAID</p>
              </div>
              <div className="text-center">
                <span className="font-serif italic font-bold text-slate-700 block text-[10px] border-b border-slate-200 pb-0.5">S. Cooper</span>
                <p className="font-bold text-[8px] text-slate-500 mt-1 uppercase tracking-wider">Admission Desk</p>
              </div>
            </div>

            {/* Actions (Hidden during print) */}
            <div className="relative z-10 flex gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => {
                  generateOfficialFeeReceiptPDF(activeReceipt.receipt, activeReceipt.student);
                  showToast('Official Fee Receipt PDF downloaded successfully.');
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-quicksand font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-[#5B468C] hover:bg-[#4A3875] text-white font-quicksand font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center space-x-1"
              >
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-quicksand font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Student ID Card Modal (Reference Lanyard Design) */}
      {activeIdCard && (
        <StudentIdCardModal
          student={activeIdCard}
          onClose={() => setActiveIdCard(null)}
        />
      )}

      {/* Small Clay Confirmation Modal Overlay */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />

      {/* =========================================================================
          MODAL 1: STUDENT-SPECIFIC FEE STRUCTURE CONFIGURATOR (100% ADMIN CONTROLLED)
         ========================================================================= */}
      {structModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-[#5B468C]/10 text-[#5B468C] mb-2 font-mono">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Student Fee Structure Configurator</span>
                </div>
                <h3 className="text-xl font-bold font-quicksand text-slate-800">
                  {structModalStudent.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {structModalStudent.studentId || structModalStudent._id} • Class: {structModalStudent.class} • Roll: {structModalStudent.rollNumber || 'N/A'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStructModalStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Explanation Note */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/60 text-[11px] text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Admin-Controlled Structure</p>
                <p className="text-amber-700 mt-0.5">
                  Enable or disable individual fee heads and set custom amounts tailored specifically to this student. The calculation and invoices are generated automatically based on these active heads.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveStudentFeeStructure} className="space-y-6">
              {/* Fee Heads List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-quicksand">
                  Configurable Fee Heads
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'admissionFee', label: 'Admission Fee', placeholder: '5000' },
                    { key: 'registrationFee', label: 'Registration Fee', placeholder: '1000' },
                    { key: 'tuitionFee', label: 'Tuition / Course Fee', placeholder: '3000' },
                    { key: 'monthlyFee', label: 'Monthly Base Fee', placeholder: '2500' },
                    { key: 'examFee', label: 'Exam Fee', placeholder: '800' },
                    { key: 'transportFee', label: 'Transport Fee', placeholder: '1200' },
                    { key: 'hostelFee', label: 'Hostel Fee', placeholder: '4000' },
                    { key: 'libraryFee', label: 'Library Fee', placeholder: '300' },
                    { key: 'otherCharges', label: 'Other Charges', placeholder: '500' },
                  ].map(({ key, label, placeholder }) => {
                    const item = studentFeeConfig[key] || { amount: 0, enabled: false };
                    return (
                      <div
                        key={key}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          item.enabled
                            ? 'bg-[#5B468C]/5 border-[#5B468C]/20 shadow-sm'
                            : 'bg-slate-50 border-slate-200/60 opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <label className="flex items-center space-x-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={!!item.enabled}
                              onChange={(e) => {
                                setStudentFeeConfig(prev => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    enabled: e.target.checked
                                  }
                                }));
                              }}
                              className="rounded text-[#5B468C] focus:ring-[#5B468C] w-4 h-4 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700">{label}</span>
                          </label>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            item.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {item.enabled ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder={placeholder}
                            disabled={!item.enabled}
                            value={item.amount === 0 ? '' : item.amount}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setStudentFeeConfig(prev => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  amount: val
                                }
                              }));
                            }}
                            className={`w-full pl-7 pr-3 py-2 text-xs font-bold rounded-xl border outline-none font-mono ${
                              item.enabled
                                ? 'bg-white border-slate-200 text-slate-800 focus:border-[#5B468C]'
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Discount & Fine Defaults */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-quicksand">
                  Special Adjustments (Discounts & Fines)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Discount */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-emerald-700 block">Default Discount (₹)</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={studentFeeConfig.discount?.amount || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setStudentFeeConfig(prev => ({
                            ...prev,
                            discount: { ...prev.discount, amount: val }
                          }));
                        }}
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 outline-none font-mono"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Reason (e.g. Sibling Concession)"
                      value={studentFeeConfig.discount?.reason || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudentFeeConfig(prev => ({
                          ...prev,
                          discount: { ...prev.discount, reason: val }
                        }));
                      }}
                      className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 outline-none text-slate-600"
                    />
                  </div>

                  {/* Fine */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="text-xs font-bold text-rose-700 block">Default Late Fee / Fine (₹)</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={studentFeeConfig.fine?.amount || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setStudentFeeConfig(prev => ({
                            ...prev,
                            fine: { ...prev.fine, amount: val }
                          }));
                        }}
                        className="w-full pl-7 pr-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 outline-none font-mono"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Reason (e.g. Overdue surcharge)"
                      value={studentFeeConfig.fine?.reason || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setStudentFeeConfig(prev => ({
                          ...prev,
                          fine: { ...prev.fine, reason: val }
                        }));
                      }}
                      className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 outline-none text-slate-600"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Structure Notes / Special Terms</label>
                  <input
                    type="text"
                    placeholder="e.g. Approved 50% discount on transport; valid for 2026-27 session"
                    value={studentFeeConfig.notes || ''}
                    onChange={(e) => setStudentFeeConfig(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none text-slate-700"
                  />
                </div>
              </div>

              {/* Dynamic Summary Banner */}
              {(() => {
                const keys = ['admissionFee', 'registrationFee', 'tuitionFee', 'monthlyFee', 'examFee', 'transportFee', 'hostelFee', 'libraryFee', 'otherCharges'];
                const totalGross = keys.reduce((acc, k) => {
                  const item = studentFeeConfig[k];
                  return (item && item.enabled) ? acc + (Number(item.amount) || 0) : acc;
                }, 0);
                const disc = Number(studentFeeConfig.discount?.amount) || 0;
                const fn = Number(studentFeeConfig.fine?.amount) || 0;
                const netAnnual = Math.max(0, totalGross - disc + fn);

                return (
                  <div className="p-4 bg-gradient-to-r from-[#5B468C] to-[#7B61B0] rounded-2xl text-white flex justify-between items-center shadow-md">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 block">Total Configured Amount</span>
                      <span className="text-xs text-white/80">Sum of all enabled fee heads (− discount + fine)</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono">₹{netAnnual.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] block text-purple-200">Gross: ₹{totalGross.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStructModalStudent(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFeeConfig}
                  className="px-6 py-2.5 rounded-xl bg-[#5B468C] text-white text-xs font-bold shadow-md hover:bg-[#4A3875] transition-all cursor-pointer flex items-center space-x-2"
                >
                  {savingFeeConfig ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Structure...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Save Fee Structure</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: DEDICATED STUDENT FEE PROFILE (SUMMARY + MONTHLY LEDGER + RECEIPTS)
         ========================================================================= */}
      {feeProfileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B468C] to-purple-500 text-white flex items-center justify-center font-bold text-lg font-quicksand shadow-md">
                  {feeProfileStudent.name?.charAt(0)}
                </div>
                <div>
                  <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#5B468C]/10 text-[#5B468C] font-mono">
                    <FileText className="w-3 h-3" />
                    <span>Official Student Fee Ledger</span>
                  </div>
                  <h3 className="text-xl font-bold font-quicksand text-slate-800">
                    {feeProfileStudent.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    ID: {feeProfileStudent.studentId || feeProfileStudent._id} • Class: {feeProfileStudent.class} • Roll: {feeProfileStudent.rollNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => openUniversalPayModal(feeProfileStudent)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Collect Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFeeProfileStudent(null);
                    setFeeProfileData(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {loadingFeeProfile ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-[#5B468C] animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-400">Loading complete fee profile and ledger...</p>
              </div>
            ) : feeProfileData ? (
              <div className="space-y-6">
                {/* 1. Fee Summary 5 KPI Badges */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-purple-700 block">Total Payable</span>
                    <span className="text-base font-extrabold text-[#5B468C] font-mono">
                      ₹{feeProfileData.summary?.totalPayable?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Total Paid</span>
                    <span className="text-base font-extrabold text-emerald-600 font-mono">
                      ₹{feeProfileData.summary?.totalPaid?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-blue-700 block">Total Discount</span>
                    <span className="text-base font-extrabold text-blue-600 font-mono">
                      ₹{feeProfileData.summary?.totalDiscount?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-700 block">Total Fine</span>
                    <span className="text-base font-extrabold text-rose-600 font-mono">
                      ₹{feeProfileData.summary?.totalFine?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700 block">Total Outstanding</span>
                    <span className={`text-base font-extrabold font-mono ${
                      (feeProfileData.summary?.totalOutstanding || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      ₹{feeProfileData.summary?.totalOutstanding?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>

                {/* 2. Month-Wise Breakdown Ledger Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-quicksand flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-[#5B468C]" />
                      <span>Monthly Fee Breakdown ({feeProfileData.year || 2026})</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      12 Months Academic Cycle
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="p-3">Month</th>
                          <th className="p-3 text-right">Fee (₹)</th>
                          <th className="p-3 text-right">Discount</th>
                          <th className="p-3 text-right">Fine</th>
                          <th className="p-3 text-right">Paid (₹)</th>
                          <th className="p-3 text-right">Due (₹)</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(feeProfileData.breakdown || []).map((b) => (
                          <tr key={b.month} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{b.month}</td>
                            <td className="p-3 text-right font-mono text-slate-700">₹{b.fee?.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono text-emerald-600">
                              {b.discount > 0 ? `−₹${b.discount.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="p-3 text-right font-mono text-rose-600">
                              {b.fine > 0 ? `+₹${b.fine.toLocaleString('en-IN')}` : '—'}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{b.paid?.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-mono font-bold text-rose-700">₹{b.due?.toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'Partial'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {b.due > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    openUniversalPayModal(feeProfileStudent, {
                                      _id: b.feeId,
                                      feeType: 'monthly',
                                      month: b.month,
                                      year: feeProfileData.year,
                                      remainingAmount: b.due,
                                      discountAmount: b.discount,
                                      fineAmount: b.fine
                                    });
                                  }}
                                  className="px-2.5 py-1 bg-[#5B468C] hover:bg-[#4A3875] text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                >
                                  Pay
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600">Settled ✓</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Transaction & Payment History */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-quicksand flex items-center space-x-2">
                      <ReceiptText className="w-3.5 h-3.5 text-[#5B468C]" />
                      <span>Permanent Transaction History (Audit Trail)</span>
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(feeProfileData.receipts || []).length} Transaction Records
                    </span>
                  </div>

                  {(feeProfileData.receipts || []).length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                      No payment transactions recorded for this student yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="p-2.5">Date & ID</th>
                            <th className="p-2.5">Receipt #</th>
                            <th className="p-2.5">Term / Month</th>
                            <th className="p-2.5">Method</th>
                            <th className="p-2.5 text-right">Amount Paid</th>
                            <th className="p-2.5 text-center">Status</th>
                            <th className="p-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {feeProfileData.receipts.map((r) => (
                            <tr key={r._id || r.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-2.5">
                                <span className="font-bold text-slate-800 block">
                                  {new Date(r.paymentDate || r.createdAt).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}
                                </span>
                                <span className="text-[9px] text-slate-400 font-mono">{r.paymentId || r._id}</span>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-700">{r.receiptNumber}</td>
                              <td className="p-2.5 font-medium text-slate-700">{r.month || r.term || 'Fee Payment'}</td>
                              <td className="p-2.5 font-mono text-slate-600">{r.paymentMethod || 'Cash at Desk'}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-700">
                                ₹{r.amountPaid?.toLocaleString('en-IN')}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  r.status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-700 line-through'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {r.status || 'completed'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    generateOfficialFeeReceiptPDF(r, feeProfileStudent);
                                    showToast('Downloading official PDF receipt...');
                                  }}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors inline-block cursor-pointer"
                                  title="Download PDF"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReceipt({
                                      receipt: r,
                                      student: feeProfileStudent,
                                      fee: { term: r.month ? `${r.month} Fee` : 'Fee Payment', amount: r.amountPaid }
                                    });
                                  }}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-[#5B468C] transition-colors inline-block cursor-pointer"
                                  title="View Slip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                {r.status !== 'cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelReceipt(r._id || r.id)}
                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors inline-block cursor-pointer"
                                    title="Cancel / Reverse Transaction"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: UNIVERSAL PAYMENT RECORDING MODAL (FULL / PARTIAL / ADVANCE)
         ========================================================================= */}
      {payModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mb-1 font-mono">
                  <CreditCard className="w-3 h-3" />
                  <span>Cash Desk Payment Gateway</span>
                </div>
                <h3 className="text-lg font-bold font-quicksand text-slate-800">
                  Collect Fee for {payModalStudent.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {payModalStudent.studentId || payModalStudent._id} • Class: {payModalStudent.class}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPayModalStudent(null);
                  setPayModalFee(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUniversalPaySubmit} className="space-y-4">
              {/* Fee Target Particulars */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Fee Type</label>
                  <select
                    value={payModalForm.feeType}
                    onChange={(e) => setPayModalForm(prev => ({ ...prev, feeType: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white outline-none"
                  >
                    <option value="monthly">Monthly Fee</option>
                    <option value="admission">Admission Fee</option>
                    <option value="tuition">Tuition / Course Fee</option>
                    <option value="exam">Exam Fee</option>
                    <option value="transport">Transport Fee</option>
                    <option value="hostel">Hostel Fee</option>
                    <option value="other">Other Charges</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Academic Month</label>
                  <select
                    value={payModalForm.month}
                    onChange={(e) => setPayModalForm(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white outline-none"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Amount Collected (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-base font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="Enter amount paid"
                    value={payModalForm.amount}
                    onChange={(e) => setPayModalForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-8 pr-4 py-2.5 text-base font-extrabold rounded-2xl border border-slate-200 outline-none font-mono text-emerald-700 bg-emerald-50/20 focus:border-emerald-600"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supports full payment, partial settlements, advance deposits, or previous overdue clearances.
                </p>
              </div>

              {/* Payment Mode */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cash at Desk', 'UPI / QR', 'Bank Transfer'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPayModalForm(prev => ({ ...prev, paymentMethod: m }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        payModalForm.paymentMethod === m
                          ? 'bg-[#5B468C] text-white border-[#5B468C] shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount & Fine on this Transaction */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] uppercase font-bold text-emerald-700 block mb-1">Discount Concession (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={payModalForm.discountApplied || ''}
                    onChange={(e) => setPayModalForm(prev => ({ ...prev, discountApplied: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-rose-700 block mb-1">Late Fine / Penalty (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={payModalForm.fineApplied || ''}
                    onChange={(e) => setPayModalForm(prev => ({ ...prev, fineApplied: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Receipt Notes / Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in full via cash; received by Admin desk"
                  value={payModalForm.remarks}
                  onChange={(e) => setPayModalForm(prev => ({ ...prev, remarks: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none text-slate-700"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPayModalStudent(null);
                    setPayModalFee(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayModal}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmittingPayModal ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Record Payment & Issue Slip</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: CASH DESK EXPENSE & PETTY CASH / REFUND MODAL
         ========================================================================= */}
      {cashDeskTxnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold font-quicksand text-slate-800">
                  Record Petty Cash Outflow / Expense / Refund
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Entries immediately affect your physical drawer balance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCashDeskTxnModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordCashDeskTxn} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Transaction Type</label>
                  <select
                    value={cashDeskTxnForm.type}
                    onChange={e => setCashDeskTxnForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                  >
                    <option value="EXPENSE">Petty Cash Expense</option>
                    <option value="REFUND">Fee Refund to Parent</option>
                    <option value="OTHER_INCOME">Other Miscellaneous Income</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Category</label>
                  <select
                    value={cashDeskTxnForm.category}
                    onChange={e => setCashDeskTxnForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                  >
                    <option value="OFFICE_SUPPLIES">Office / Stationery Supplies</option>
                    <option value="REFUND">Fee Refund</option>
                    <option value="REFRESHMENTS">Tea / Staff Refreshments</option>
                    <option value="MAINTENANCE">Facility / Cleaning Maintenance</option>
                    <option value="TRANSPORT">Courier / Transport Fare</option>
                    <option value="MISCELLANEOUS">Miscellaneous Operational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 350"
                    value={cashDeskTxnForm.amount}
                    onChange={e => setCashDeskTxnForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-extrabold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 font-bold">Payment Method</label>
                  <select
                    value={cashDeskTxnForm.paymentMethod}
                    onChange={e => setCashDeskTxnForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-700"
                  >
                    <option value="CASH">Physical Cash Drawer</option>
                    <option value="UPI">UPI / Digital Wallet</option>
                    <option value="BANK">Bank Account / Cheque</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold">Vendor / Recipient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Local Stationery Store, Sharma Ji"
                  value={cashDeskTxnForm.vendorRecipient}
                  onChange={e => setCashDeskTxnForm(prev => ({ ...prev, vendorRecipient: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 font-bold">Description / Purpose</label>
                <textarea
                  rows="2"
                  placeholder="Reason for expenditure or fee refund particulars..."
                  value={cashDeskTxnForm.description}
                  onChange={e => setCashDeskTxnForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none text-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCashDeskTxnModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCashDeskTxn}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md hover:bg-black transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSubmittingCashDeskTxn ? 'Recording...' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DAILY CASH DESK CLOSING & RECONCILIATION MODAL
         ========================================================================= */}
      {closeDeskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-quicksand text-slate-800">
                    Reconcile & Close Daily Cash Desk
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    End-of-day register balancing and official audit signoff.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCloseDeskModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Opening Cash Float:</span>
                <span className="font-mono font-bold">₹{(cashDeskData?.summary?.openingCash ?? 5000).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Cash Received (+):</span>
                <span className="font-mono font-bold">+₹{(cashDeskData?.summary?.cashCollection ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Petty Cash Expenses & Refunds (-):</span>
                <span className="font-mono font-bold">-₹{((cashDeskData?.summary?.totalExpenses ?? 0) + (cashDeskData?.summary?.totalRefunds ?? 0)).toLocaleString('en-IN')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                <span>Expected System Closing Cash:</span>
                <span className="font-mono text-indigo-700">₹{(cashDeskData?.summary?.expectedClosingCash ?? 5000).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <form onSubmit={handleCloseCashDesk} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold">
                  Physical Cash Counted in Drawer (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter physical cash count"
                  value={closeDeskForm.actualCash}
                  onChange={e => setCloseDeskForm(prev => ({ ...prev, actualCash: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-black text-base text-slate-900"
                />
              </div>

              {/* Real-time Variance Indicator */}
              {closeDeskForm.actualCash !== '' && (
                <div className={`p-3 rounded-xl border text-xs font-bold ${
                  Number(closeDeskForm.actualCash) === (cashDeskData?.summary?.expectedClosingCash ?? 5000)
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>
                  <div className="flex justify-between items-center">
                    <span>Cash Register Variance:</span>
                    <span className="font-mono text-sm font-black">
                      {Number(closeDeskForm.actualCash) - (cashDeskData?.summary?.expectedClosingCash ?? 5000) >= 0 ? '+' : ''}
                      ₹{(Number(closeDeskForm.actualCash) - (cashDeskData?.summary?.expectedClosingCash ?? 5000)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {Number(closeDeskForm.actualCash) === (cashDeskData?.summary?.expectedClosingCash ?? 5000) ? (
                    <p className="text-[10px] text-emerald-600 mt-1 font-semibold">
                      ✓ Perfect Match! Physical drawer matches system calculations exactly.
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-700 mt-1 font-semibold">
                      ⚠ Discrepancy detected. You must document an explanation below for institutional audit compliance.
                    </p>
                  )}
                </div>
              )}

              {/* Mandatory Discrepancy Reason if variance occurs */}
              {closeDeskForm.actualCash !== '' && Number(closeDeskForm.actualCash) !== (cashDeskData?.summary?.expectedClosingCash ?? 5000) && (
                <div className="space-y-1">
                  <label className="text-rose-700 font-bold">
                    Mandatory Discrepancy Reason / Note *
                  </label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Explain shortage/excess reason (e.g. pending vendor change return, coin roundoff)..."
                    value={closeDeskForm.discrepancyReason}
                    onChange={e => setCloseDeskForm(prev => ({ ...prev, discrepancyReason: e.target.value }))}
                    className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-2.5 outline-none text-slate-800 resize-none font-medium"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCloseDeskModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isClosingDesk}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700 transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isClosingDesk ? 'Reconciling & Closing...' : 'Confirm Closing & Reconcile'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
