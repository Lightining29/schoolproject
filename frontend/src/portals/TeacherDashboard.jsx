import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Users, Smile, Clock, Award, Clipboard, Check, FileText, Printer,
  Sparkles, CheckCircle2, XCircle, AlertCircle, Calendar, Search,
  Phone, Mail, BookOpen, Heart, RefreshCw, Star, ArrowRight,
  TrendingUp, Send, CheckCheck, Palette, Coffee, Sun, Moon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ResultCardModal from '../components/ResultCardModal.jsx';

export default function TeacherDashboard() {
  const { profile } = useAuth();

  // Navigation & active class
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'results' | 'activities' | 'students'
  const [students, setStudents] = useState([]);
  const [evalClass, setEvalClass] = useState('Preschool');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // ----------------------------------------------------
  // ATTENDANCE STATE (Bulk & Quick Roster)
  // ----------------------------------------------------
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'present' | 'absent' | 'late' }
  const [attendanceSaving, setAttendanceSaving] = useState(false);

  // ----------------------------------------------------
  // RESULT CARD & AI REMARKS STATE
  // ----------------------------------------------------
  const [evalStudentId, setEvalStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [repTerm, setRepTerm] = useState('Term 1 (Mid-Year)');
  const [repCognitive, setRepCognitive] = useState(85); // English / Language
  const [repSocial, setRepSocial] = useState(88); // Math / Numeracy
  const [repCreative, setRepCreative] = useState(90); // Discovery Science
  const [repMotor, setRepMotor] = useState(82); // Arts & Crafts
  const [repNotes, setRepNotes] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTone, setAiTone] = useState('encouraging'); // 'encouraging' | 'star' | 'growth' | 'creative'
  const [selectedTraits, setSelectedTraits] = useState(['Attentive', 'Friendly manners']);
  const [publishedResult, setPublishedResult] = useState(null);
  const [activeResultCard, setActiveResultCard] = useState(null);

  // ----------------------------------------------------
  // DAILY ACTIVITIES & MOMENTS STATE
  // ----------------------------------------------------
  const [actScope, setActScope] = useState('class'); // 'class' or 'student'
  const [actTargetStudentId, setActTargetStudentId] = useState('');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [actCat, setActCat] = useState('play');
  const [activityPosting, setActivityPosting] = useState(false);

  // ----------------------------------------------------
  // STUDENT SEARCH IN ROSTER
  // ----------------------------------------------------
  const [rosterSearch, setRosterSearch] = useState('');

  // ----------------------------------------------------
  // AI LESSON PLANNER & STORY LAB STATE
  // ----------------------------------------------------
  const [lpTopic, setLpTopic] = useState('Kindness & Sharing');
  const [lpDuration, setLpDuration] = useState('35 Mins');
  const [lpTheme, setLpTheme] = useState('Socio-Emotional Growth');
  const [generatedLessonPlan, setGeneratedLessonPlan] = useState(null);
  const [lpLoading, setLpLoading] = useState(false);

  const handleGenerateLessonPlan = async () => {
    setLpLoading(true);
    try {
      const res = await fetch('/api/portal/teacher/ai-lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          topic: lpTopic,
          grade: evalClass,
          duration: lpDuration,
          theme: lpTheme
        })
      });
      const data = await res.json();
      setLpLoading(false);
      if (data.success && data.data) {
        setGeneratedLessonPlan(data.data);
        showToast('✨ AI Interactive Lesson Plan & Story generated!');
        confetti({ particleCount: 50, spread: 75, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
      setLpLoading(false);
    }
  };

  // Confirmation Modal
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

  // ----------------------------------------------------
  // FETCH STUDENTS ON MOUNT
  // ----------------------------------------------------
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portal/teacher/students', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setLoading(false);
      if (data.success && Array.isArray(data.students)) {
        setStudents(data.students);
        if (data.students.length > 0) {
          // If teacher has assigned classes, pick the first assigned class that has students
          const assigned = profile?.classesAssigned || [];
          const matchedClass = assigned.find(cls => data.students.some(s => s.class === cls)) || data.students[0].class;
          setEvalClass(matchedClass);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students for the active class
  const classStudents = useMemo(() => {
    return students.filter(s => s.class === evalClass);
  }, [students, evalClass]);

  // Sync attendance map when class or date changes
  useEffect(() => {
    const map = {};
    classStudents.forEach(std => {
      const existing = (std.attendance || []).find(att => {
        const attDate = att.date instanceof Date ? att.date.toISOString().split('T')[0] : String(att.date).split('T')[0];
        return attDate === attendanceDate;
      });
      map[std._id] = existing ? existing.status : 'present';
    });
    setAttendanceMap(map);

    // Sync selected student for results
    if (classStudents.length > 0) {
      if (!classStudents.some(s => s._id === evalStudentId)) {
        setEvalStudentId(classStudents[0]._id);
        setSelectedStudent(classStudents[0]);
      }
    } else {
      setEvalStudentId('');
      setSelectedStudent(null);
    }
  }, [classStudents, attendanceDate]);

  useEffect(() => {
    if (evalStudentId) {
      const found = classStudents.find(s => s._id === evalStudentId);
      if (found) {
        setSelectedStudent(found);
        // Pre-fill existing report for this term if any
        const existingRep = (found.progressReports || []).find(r => r.term === repTerm);
        if (existingRep) {
          setRepCognitive(existingRep.cognitive || 80);
          setRepSocial(existingRep.social || 80);
          setRepCreative(existingRep.creative || 80);
          setRepMotor(existingRep.motorSkills || 80);
          setRepNotes(existingRep.notes || '');
        }
      }
    }
  }, [evalStudentId, repTerm]);

  // Quick stats calculation
  const stats = useMemo(() => {
    const total = classStudents.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    Object.values(attendanceMap).forEach(st => {
      if (st === 'present') presentCount++;
      else if (st === 'absent') absentCount++;
      else if (st === 'late') lateCount++;
    });

    const attRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;
    
    // Total reports published for this class in this term
    const publishedCount = classStudents.filter(s => (s.progressReports || []).some(r => r.term === repTerm)).length;

    // Total activities logged
    const totalActivities = classStudents.reduce((acc, s) => acc + (s.activities?.length || 0), 0);

    return {
      total,
      presentCount,
      absentCount,
      lateCount,
      attRate,
      publishedCount,
      totalActivities
    };
  }, [classStudents, attendanceMap, repTerm]);

  // ----------------------------------------------------
  // ATTENDANCE HANDLERS
  // ----------------------------------------------------
  const handleSetStudentAttendance = (studentId, status) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    classStudents.forEach(s => {
      updated[s._id] = status;
    });
    setAttendanceMap(updated);
    showToast(`Marked all students as ${status.toUpperCase()}`);
  };

  const handleSaveBulkAttendance = async () => {
    setAttendanceSaving(true);
    const records = Object.entries(attendanceMap).map(([studentId, status]) => ({
      studentId,
      status
    }));

    try {
      const res = await fetch('/api/portal/teacher/bulk-attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          date: attendanceDate,
          records
        })
      });
      const data = await res.json();
      setAttendanceSaving(false);
      if (data.success) {
        showToast(`Attendance saved for ${evalClass} (${attendanceDate})!`);
        fetchStudents();
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      } else {
        alert(data.message || 'Failed to save attendance');
      }
    } catch (err) {
      console.error(err);
      setAttendanceSaving(false);
      alert('Error updating attendance');
    }
  };

  // ----------------------------------------------------
  // AI REMARKS GENERATOR HANDLER
  // ----------------------------------------------------
  const handleGenerateAiRemark = async () => {
    if (!selectedStudent) return;
    setAiGenerating(true);

    try {
      const res = await fetch('/api/portal/teacher/ai-generate-remarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          studentName: selectedStudent.name,
          studentClass: evalClass,
          scores: {
            cognitive: Number(repCognitive),
            social: Number(repSocial),
            creative: Number(repCreative),
            motorSkills: Number(repMotor)
          },
          tone: aiTone,
          traits: selectedTraits
        })
      });

      const data = await res.json();
      setAiGenerating(false);

      if (data.success && data.data?.remark) {
        setRepNotes(data.data.remark);
        showToast('✨ AI Smart Observation generated!');
      } else {
        // Fallback generator directly in client
        const avg = ((Number(repCognitive) + Number(repSocial) + Number(repCreative) + Number(repMotor)) / 4).toFixed(1);
        const fallback = `${selectedStudent.name} has demonstrated praiseworthy enthusiasm in ${evalClass} with an overall ${avg}% progress score. Consistently exhibits strong dedication to ${selectedTraits.join(' and ') || 'classroom learning'}. Continuing daily joyful reading and interactive group activities is strongly encouraged!`;
        setRepNotes(fallback);
        showToast('✨ Smart Observation generated!');
      }
    } catch (err) {
      console.error(err);
      setAiGenerating(false);
      const avg = ((Number(repCognitive) + Number(repSocial) + Number(repCreative) + Number(repMotor)) / 4).toFixed(1);
      setRepNotes(`${selectedStudent.name} is making wonderful progress in ${evalClass} (${avg}%). Displays admirable creativity and positive peer interaction.`);
    }
  };

  // Toggle trait pills
  const toggleTrait = (trait) => {
    setSelectedTraits(prev =>
      prev.includes(trait) ? prev.filter(t => t !== trait) : [...prev, trait]
    );
  };

  // ----------------------------------------------------
  // RESULT CARD PUBLISH HANDLER
  // ----------------------------------------------------
  const handlePublishResult = (e) => {
    e.preventDefault();
    if (!selectedStudent) return alert('Please select a student');

    triggerConfirm(
      "Publish Official Progress Report?",
      `This will publish the ${repTerm} result card for ${selectedStudent.name}. Parents will immediately see this card in their portal.`,
      "submit",
      async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/portal/teacher/student/${selectedStudent._id}/progress`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              term: repTerm,
              cognitive: Number(repCognitive),
              social: Number(repSocial),
              creative: Number(repCreative),
              motorSkills: Number(repMotor),
              notes: repNotes
            })
          });
          const data = await res.json();
          setLoading(false);
          if (data.success) {
            const total = Number(repCognitive) + Number(repSocial) + Number(repCreative) + Number(repMotor);
            const percentage = (total / 4).toFixed(1);
            setPublishedResult({
              studentName: selectedStudent.name,
              className: selectedStudent.class,
              term: repTerm,
              cognitive: repCognitive,
              social: repSocial,
              creative: repCreative,
              motorSkills: repMotor,
              notes: repNotes,
              total,
              percentage
            });
            fetchStudents();
            showToast(`Result Card published for ${selectedStudent.name}!`);
            confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          } else {
            alert(data.message || 'Failed to publish result');
          }
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      }
    );
  };

  // ----------------------------------------------------
  // POST ACTIVITY HANDLER
  // ----------------------------------------------------
  const applyActivityPreset = (title, category, defaultDesc) => {
    setActTitle(title);
    setActCat(category);
    setActDesc(defaultDesc);
  };

  const handlePostActivity = async (e) => {
    e.preventDefault();
    if (!actTitle.trim() || !actDesc.trim()) return alert('Please input title and description');

    setActivityPosting(true);
    try {
      if (actScope === 'class') {
        // Broadcast to whole class
        const res = await fetch('/api/portal/teacher/class-activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            className: evalClass,
            title: actTitle,
            description: actDesc,
            category: actCat
          })
        });
        const data = await res.json();
        setActivityPosting(false);
        if (data.success) {
          showToast(`Activity posted to all ${classStudents.length} students in ${evalClass}!`);
          setActTitle('');
          setActDesc('');
          fetchStudents();
          confetti({ particleCount: 40, spread: 60 });
        } else {
          alert(data.message || 'Failed to post activity');
        }
      } else {
        // Post to single student
        const targetId = actTargetStudentId || selectedStudent?._id;
        if (!targetId) {
          setActivityPosting(false);
          return alert('Please select a student');
        }

        const res = await fetch(`/api/portal/teacher/student/${targetId}/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: actTitle,
            description: actDesc,
            category: actCat
          })
        });
        const data = await res.json();
        setActivityPosting(false);
        if (data.success) {
          showToast('Individual activity logged successfully!');
          setActTitle('');
          setActDesc('');
          fetchStudents();
        } else {
          alert(data.message || 'Failed to log activity');
        }
      }
    } catch (err) {
      console.error(err);
      setActivityPosting(false);
      alert('Error posting activity');
    }
  };

  // Recent activities compiled across current class
  const classRecentActivities = useMemo(() => {
    const list = [];
    classStudents.forEach(s => {
      (s.activities || []).forEach(act => {
        list.push({ ...act, studentName: s.name, studentId: s._id });
      });
    });
    // Sort latest first
    return list.slice(0, 15);
  }, [classStudents]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-2 text-slate-500 font-quicksand font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
          <span>Loading Teacher Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen -m-4 md:-m-8 p-4 md:p-8 space-y-6 bg-gradient-to-b from-purple-50/50 via-white to-orange-50/30">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 font-quicksand font-bold text-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================
          1. HEADER & TEACHER PROFILE BANNER
      ======================================================== */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-[#5B468C] via-[#6C52A3] to-[#7E61BE] text-white rounded-3xl shadow-lg relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 left-1/3 w-40 h-40 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 backdrop-blur-md flex items-center justify-center text-white text-2xl font-bold font-quicksand shadow-inner">
              {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/20 backdrop-blur-xs">
                  Educator Portal Hub
                </span>
                <span className="text-purple-200 text-xs font-mono">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-quicksand font-extrabold text-white mt-1">
                Welcome back, {profile.name}! 👋
              </h1>
              <p className="text-xs text-purple-100 font-medium">
                {profile.specialization || 'Early Childhood Specialist'} • {profile.qualifications || 'B.Ed / Montessori Certified'}
              </p>
            </div>
          </div>

          {/* Class Switcher Pill */}
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/20">
            <span className="text-[11px] font-bold text-purple-200 pl-2">Class:</span>
            <select
              value={evalClass}
              onChange={(e) => setEvalClass(e.target.value)}
              className="bg-white text-slate-800 font-bold font-quicksand text-xs px-3 py-2 rounded-xl border-none outline-none shadow-sm cursor-pointer"
            >
              {(profile.classesAssigned && profile.classesAssigned.length > 0
                ? profile.classesAssigned
                : ['Pre-Nursery', 'Nursery', 'Junior KG', 'Senior KG', 'Preschool', '1st', '2nd', '3rd', '4th', '5th']
              ).map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Quick KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-purple-200 uppercase font-bold block">Class Roster</span>
              <span className="text-lg font-bold font-quicksand">{stats.total} Students</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-purple-200 uppercase font-bold block">Present Today</span>
              <span className="text-lg font-bold font-quicksand">{stats.presentCount} / {stats.total} ({stats.attRate}%)</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-purple-200 uppercase font-bold block">Reports Ready</span>
              <span className="text-lg font-bold font-quicksand">{stats.publishedCount} / {stats.total}</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-400/20 text-pink-300 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-purple-200 uppercase font-bold block">Moments Logged</span>
              <span className="text-lg font-bold font-quicksand">{stats.totalActivities} Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. SIMPLIFIED MODERN TAB NAVIGATION
      ======================================================== */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-purple-100 rounded-2xl shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-quicksand font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'attendance'
              ? 'bg-[#5B468C] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clipboard className="w-4 h-4" />
          <span>1. Fast Attendance Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-quicksand font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-[#5B468C] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>2. Marks & AI Report Cards</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-900 font-extrabold uppercase">
            AI Copilot
          </span>
        </button>

        <button
          onClick={() => setActiveTab('activities')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-quicksand font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'activities'
              ? 'bg-[#5B468C] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>3. Daily Moments & Feed</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-quicksand font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'students'
              ? 'bg-[#5B468C] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Student & Parent Directory ({classStudents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lessonPlan')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-quicksand font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'lessonPlan'
              ? 'bg-[#5B468C] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>5. AI Lesson Plan & Story Lab</span>
          <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-amber-400 text-slate-900 font-extrabold uppercase">
            AI Lab
          </span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: FAST CLASS ATTENDANCE DESK (BULK & 1-CLICK)
      ======================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
            
            {/* Attendance Top Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-quicksand text-slate-800 flex items-center gap-2">
                  <span>Class Attendance Roster</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5B468C] font-mono">
                    {evalClass}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Mark daily student attendance with 1-click toggles. Click "Mark All Present" to log the entire class in 2 seconds.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-700 outline-none text-xs cursor-pointer"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarkAll('present')}
                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold font-quicksand text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    ✓ All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAll('absent')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold font-quicksand text-xs rounded-xl border border-rose-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    ✗ All Absent
                  </button>
                </div>
              </div>
            </div>

            {/* Attendance Status Badges */}
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Present</span>
                <span className="text-base font-bold font-mono text-emerald-700">{stats.presentCount}</span>
              </div>
              <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900">Absent</span>
                <span className="text-base font-bold font-mono text-rose-700">{stats.absentCount}</span>
              </div>
              <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Late</span>
                <span className="text-base font-bold font-mono text-amber-700">{stats.lateCount}</span>
              </div>
            </div>

            {/* Student Attendance Grid */}
            {classStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-quicksand text-xs border border-dashed rounded-3xl">
                No students enrolled in {evalClass} yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {classStudents.map((std, idx) => {
                  const currentStatus = attendanceMap[std._id] || 'present';
                  return (
                    <div
                      key={std._id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        currentStatus === 'present'
                          ? 'bg-emerald-50/30 border-emerald-200/80'
                          : currentStatus === 'absent'
                          ? 'bg-rose-50/30 border-rose-200/80'
                          : 'bg-amber-50/30 border-amber-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5B468C] font-bold text-xs flex items-center justify-center shrink-0">
                          {std.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold font-quicksand text-xs text-slate-800 truncate" title={std.name}>
                            {idx + 1}. {std.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {std.studentId || std._id.slice(-5)}
                          </span>
                        </div>
                      </div>

                      {/* 3-Way Status Toggle */}
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shrink-0 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleSetStudentAttendance(std._id, 'present')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'present'
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStudentAttendance(std._id, 'absent')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'absent'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          A
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetStudentAttendance(std._id, 'late')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            currentStatus === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          L
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save Button Footer */}
            {classStudents.length > 0 && (
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={attendanceSaving}
                  onClick={handleSaveBulkAttendance}
                  className="px-8 py-3.5 bg-[#5B468C] hover:bg-[#4A3875] text-white font-quicksand font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{attendanceSaving ? 'Saving Roster...' : `SAVE CLASS ATTENDANCE (${attendanceDate})`}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: MARKS & AI REPORT CARDS
      ======================================================== */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Grade Entry & AI Remarks Form */}
            <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold font-quicksand text-slate-800 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    <span>Term Marks & Evaluation</span>
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#5B468C]">
                    {evalClass}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Input subject scores and use the built-in <b>AI Copilot</b> to automatically craft supportive, personalized report card observations.
                </p>
              </div>

              {/* Student Selector Card */}
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Select Student</label>
                    <select
                      value={evalStudentId}
                      onChange={(e) => setEvalStudentId(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      {classStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.studentId || 'Std'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Evaluation Term</label>
                    <select
                      value={repTerm}
                      onChange={(e) => setRepTerm(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option>Term 1 (Mid-Year)</option>
                      <option>Term 2 (Final Evaluations)</option>
                      <option>Quarterly Assessment</option>
                    </select>
                  </div>
                </div>
              </div>

              <form onSubmit={handlePublishResult} className="space-y-5">
                
                {/* 4 Core Subjects */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-quicksand text-slate-700 uppercase tracking-wider">
                    Core Subject Marks (Out of 100)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <label className="font-bold text-slate-600 block text-[11px]">English</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={repCognitive}
                        onChange={(e) => setRepCognitive(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold font-mono text-center text-sm outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block text-center">Language Arts</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <label className="font-bold text-slate-600 block text-[11px]">Math</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={repSocial}
                        onChange={(e) => setRepSocial(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold font-mono text-center text-sm outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block text-center">Numeracy</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <label className="font-bold text-slate-600 block text-[11px]">Science</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={repCreative}
                        onChange={(e) => setRepCreative(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold font-mono text-center text-sm outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block text-center">Discovery</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <label className="font-bold text-slate-600 block text-[11px]">Arts & Craft</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={repMotor}
                        onChange={(e) => setRepMotor(e.target.value)}
                        className="w-full bg-white border border-slate-200 p-2 rounded-xl font-bold font-mono text-center text-sm outline-none"
                      />
                      <span className="text-[9px] text-slate-400 block text-center">Motor Skills</span>
                    </div>
                  </div>
                </div>

                {/* Live Computed Totals Chip */}
                {(() => {
                  const total = Number(repCognitive || 0) + Number(repSocial || 0) + Number(repCreative || 0) + Number(repMotor || 0);
                  const pct = (total / 4).toFixed(1);
                  let grade = 'A+';
                  let gradeColor = 'bg-emerald-500';
                  if (pct < 60) { grade = 'C'; gradeColor = 'bg-amber-500'; }
                  else if (pct < 75) { grade = 'B'; gradeColor = 'bg-blue-500'; }
                  else if (pct < 85) { grade = 'A'; gradeColor = 'bg-green-500'; }

                  return (
                    <div className="p-3.5 bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-100 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg ${gradeColor} text-white font-bold font-mono text-sm flex items-center justify-center shadow-xs`}>
                          {grade}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-slate-800">Aggregate: {pct}%</span>
                          <span className="text-[10px] text-slate-500 block">Total Score: {total} / 400</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#5B468C] font-quicksand">
                        Official CBSE/State Formula
                      </span>
                    </div>
                  );
                })()}

                {/* AI Remarks & Observations Generator Section */}
                <div className="p-4 bg-slate-50 border border-purple-200/60 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold font-quicksand text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      AI Teacher Remarks Copilot
                    </span>
                    <button
                      type="button"
                      disabled={aiGenerating}
                      onClick={handleGenerateAiRemark}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold font-quicksand text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{aiGenerating ? 'Composing...' : '✨ Generate AI Remark'}</span>
                    </button>
                  </div>

                  {/* Tone Options */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tone:</span>
                    {[
                      { id: 'encouraging', label: 'Warm & Encouraging' },
                      { id: 'star', label: 'Star Achiever 🌟' },
                      { id: 'growth', label: 'Supportive & Growth' },
                      { id: 'creative', label: 'Creative & Imaginative' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAiTone(t.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          aiTone === t.id
                            ? 'bg-[#5B468C] text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Quick Trait Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Traits:</span>
                    {[
                      'Attentive', 'Friendly manners', 'Creative artist',
                      'Sharp in numbers', 'Helpful teammate', 'Loves storytelling', 'Curious learner'
                    ].map(trait => {
                      const active = selectedTraits.includes(trait);
                      return (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => toggleTrait(trait)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                            active
                              ? 'bg-purple-100 text-purple-900 border border-purple-300 font-bold'
                              : 'bg-white text-slate-500 border border-slate-200'
                          }`}
                        >
                          {active ? `✓ ${trait}` : `+ ${trait}`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Remarks Textarea */}
                  <div className="space-y-1 pt-1">
                    <textarea
                      rows={3}
                      required
                      value={repNotes}
                      onChange={(e) => setRepNotes(e.target.value)}
                      placeholder="e.g. Tommy demonstrates admirable creativity and sharp numbers comprehension..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-purple-500 leading-relaxed resize-none"
                    />
                    <span className="text-[9px] text-slate-400 block text-right">
                      {repNotes.length} characters • Editable observation text
                    </span>
                  </div>
                </div>

                {/* Publish Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#5B468C] to-[#7E61BE] hover:from-[#4A3875] hover:to-[#6C52A3] text-white font-quicksand font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  <span>{loading ? 'Publishing Report...' : `PUBLISH ${repTerm.toUpperCase()} RESULT CARD`}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Published Card Preview & Class Roster Results */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Live Preview Card */}
              {publishedResult && (
                <div className="bg-white border-2 border-purple-200 shadow-md rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        Recently Published
                      </span>
                      <h4 className="text-base font-bold font-quicksand text-slate-800 mt-1">
                        {publishedResult.studentName}
                      </h4>
                      <p className="text-[10px] text-slate-500">{publishedResult.term} • {publishedResult.className}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold font-mono text-[#5B468C]">{publishedResult.percentage}%</span>
                      <span className="text-[9px] text-slate-400 block">Total: {publishedResult.total}/400</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                    "{publishedResult.notes}"
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveResultCard({
                        student: selectedStudent,
                        report: {
                          cognitive: publishedResult.cognitive,
                          social: publishedResult.social,
                          creative: publishedResult.creative,
                          motorSkills: publishedResult.motorSkills,
                          notes: publishedResult.notes,
                          term: publishedResult.term,
                          createdAt: new Date().toISOString()
                        },
                        parentName: selectedStudent?.parentId?.name || selectedStudent?.parentDetails?.fatherName || 'Parent'
                      })}
                      className="flex-1 py-2.5 bg-[#5B468C] hover:bg-[#4A3875] text-white font-quicksand font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View & Print Official Card</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Class Results Table Overview */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold font-quicksand text-sm text-slate-800">
                    {evalClass} Term Records
                  </h4>
                  <span className="text-xs font-mono text-purple-700 font-bold">
                    {stats.publishedCount} / {stats.total} Ready
                  </span>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {classStudents.map(std => {
                    const rep = (std.progressReports || []).find(r => r.term === repTerm);
                    const hasReport = !!rep;
                    const total = hasReport ? (Number(rep.cognitive) + Number(rep.social) + Number(rep.creative) + Number(rep.motorSkills)) : 0;
                    const pct = hasReport ? (total / 4).toFixed(1) : 0;

                    return (
                      <div
                        key={std._id}
                        className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs transition-all"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{std.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {hasReport ? `Score: ${total}/400 (${pct}%)` : 'No report yet'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {hasReport ? (
                            <button
                              type="button"
                              onClick={() => setActiveResultCard({
                                student: std,
                                report: rep,
                                parentName: std.parentId?.name || std.parentDetails?.fatherName || 'Parent'
                              })}
                              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-[#5B468C] border border-purple-200 rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Card</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEvalStudentId(std._id);
                                setSelectedStudent(std);
                              }}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-[10px] shadow-2xs cursor-pointer"
                            >
                              Fill Marks
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: DAILY ACTIVITIES & MOMENTS
      ======================================================== */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Post Daily Moment */}
            <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-quicksand text-slate-800 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span>Log Classroom Moments & Activities</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Keep parents informed of joyful kindergarten moments: meals, naps, sensory play, art, and outdoor sports.
                </p>
              </div>

              {/* 1-Click Quick Preset Buttons */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  1-Click Activity Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => applyActivityPreset('Finger Painting & Color Mixing', 'art', 'Created vibrant butterfly and flower prints using non-toxic tempera paints.')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <Palette className="w-4 h-4 text-purple-600 shrink-0" />
                    <span className="truncate">Art & Craft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyActivityPreset('Nutritious Fruit Snack Time', 'food', 'Enjoyed organic apple slices and warm whole grain porridge nicely during break.')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <Coffee className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">Healthy Snack</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyActivityPreset('Obstacle Course & Playground', 'play', 'Developed gross motor balance and coordination on the mini jungle gym.')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <Sun className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">Outdoor Play</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyActivityPreset('Storybook & Rhyme Circle', 'academic', 'Engaged attentively with story of "The Helpful Bunny" and sang alphabet phonics rhymes.')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">Story Circle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyActivityPreset('Restful Afternoon Nap (45 mins)', 'nap', 'Slept peacefully on cot with soft lullaby background sounds.')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <Moon className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate">Nap Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyActivityPreset('Star Helper & Kind Manners Award', 'play', 'Demonstrated wonderful empathy by helping clean up toys after free play.')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 text-left transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold text-slate-700"
                  >
                    <Star className="w-4 h-4 text-pink-600 shrink-0" />
                    <span className="truncate">Star Badge</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handlePostActivity} className="space-y-4">
                
                {/* Scope selector */}
                <div className="flex items-center gap-4 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl text-xs">
                  <span className="font-bold text-slate-700">Target Audience:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="actScope"
                      checked={actScope === 'class'}
                      onChange={() => setActScope('class')}
                      className="accent-[#5B468C]"
                    />
                    <span>Whole Class ({evalClass})</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="actScope"
                      checked={actScope === 'student'}
                      onChange={() => setActScope('student')}
                      className="accent-[#5B468C]"
                    />
                    <span>Single Student</span>
                  </label>
                </div>

                {actScope === 'student' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Select Student</label>
                    <select
                      value={actTargetStudentId}
                      onChange={(e) => setActTargetStudentId(e.target.value)}
                      className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Student --</option>
                      {classStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Activity Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Painted Flower Card"
                      value={actTitle}
                      onChange={(e) => setActTitle(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 block">Category</label>
                    <select
                      value={actCat}
                      onChange={(e) => setActCat(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs outline-none font-semibold cursor-pointer"
                    >
                      <option value="art">Art & Craft</option>
                      <option value="food">Meal / Nutrition Intake</option>
                      <option value="play">Play & Sports Log</option>
                      <option value="nap">Rest & Nap Time</option>
                      <option value="academic">Classroom Studies & Phonics</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-600 block">Activity Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe what the children learned or explored today..."
                    value={actDesc}
                    onChange={(e) => setActDesc(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none leading-relaxed resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={activityPosting}
                  className="w-full py-3.5 bg-[#5B468C] hover:bg-[#4A3875] text-white font-quicksand font-bold text-xs rounded-2xl shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{activityPosting ? 'Posting...' : actScope === 'class' ? `POST TO ALL ${classStudents.length} STUDENTS` : 'POST STUDENT UPDATE'}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Recent Activities Timeline Feed */}
            <div className="lg:col-span-6 bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b">
                <h4 className="font-bold font-quicksand text-sm text-slate-800">
                  Recent Moments Feed ({evalClass})
                </h4>
                <span className="text-xs text-slate-400 font-mono">Live Timeline</span>
              </div>

              {classRecentActivities.length === 0 ? (
                <div className="py-16 text-center text-slate-400 font-quicksand text-xs">
                  No activity posts recorded yet for this class today. Use the presets on the left to post one!
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {classRecentActivities.map((act, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-2xl space-y-1.5 transition-all text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-quicksand text-slate-800 flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            act.category === 'art' ? 'bg-purple-500' :
                            act.category === 'food' ? 'bg-amber-500' :
                            act.category === 'nap' ? 'bg-indigo-500' :
                            act.category === 'academic' ? 'bg-blue-500' : 'bg-emerald-500'
                          }`} />
                          {act.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{act.time || 'Today'}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{act.description}</p>
                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                        <span>Student: <b className="text-slate-700">{act.studentName}</b></span>
                        <span className="uppercase font-bold tracking-wider">{act.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: STUDENT ROSTER & PARENT DIRECTORY
      ======================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-quicksand text-slate-800">
                  {evalClass} Student & Guardian Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Quick contact information, emergency phone lines, and academic profiles for every child.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-72 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search student or parent name..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="bg-transparent font-medium text-slate-700 outline-none w-full text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classStudents
                .filter(s =>
                  s.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
                  (s.parentId?.name || s.parentDetails?.fatherName || '').toLowerCase().includes(rosterSearch.toLowerCase())
                )
                .map(std => {
                  const parentName = std.parentId?.name || std.parentDetails?.fatherName || std.parentDetails?.motherName || 'Parent / Guardian';
                  const parentPhone = std.parentId?.phone || std.parentDetails?.phone || '+91 98XXX-XXXXX';
                  const parentEmail = std.parentId?.email || std.parentDetails?.email || 'parent@apnaschool.edu';

                  return (
                    <div
                      key={std._id}
                      className="p-5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-3xl space-y-4 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#5B468C] text-white font-bold font-quicksand text-base flex items-center justify-center shrink-0 shadow-xs">
                          {std.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold font-quicksand text-sm text-slate-800 truncate" title={std.name}>
                            {std.name}
                          </h4>
                          <span className="text-[10px] text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded-full inline-block mt-0.5">
                            ID: {std.studentId || std._id.slice(-6)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Guardian: <b className="text-slate-800">{parentName}</b></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a href={`tel:${parentPhone}`} className="text-purple-700 font-bold hover:underline">
                            {parentPhone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate text-[11px] font-mono">{parentEmail}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('results');
                            setEvalStudentId(std._id);
                            setSelectedStudent(std);
                          }}
                          className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 font-quicksand font-bold text-xs rounded-xl border border-slate-200 shadow-2xs cursor-pointer text-center"
                        >
                          Report Card
                        </button>
                        <a
                          href={`tel:${parentPhone}`}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center cursor-pointer"
                          title="Call Parent"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: AI LESSON PLAN & STORY LAB
      ======================================================== */}
      {activeTab === 'lessonPlan' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="space-y-1 pb-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold font-quicksand text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>AI Interactive Lesson Plan & Story Lab</span>
                </h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-[#5B468C]">
                  Target: {evalClass}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generate pedagogical classroom lesson plans, interactive circle time stories, and take-home activities in seconds.
              </p>
            </div>

            {/* Topic & Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">1. Select Theme / Topic</label>
                <select
                  value={lpTopic}
                  onChange={(e) => setLpTopic(e.target.value)}
                  className="w-full bg-white border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-800 cursor-pointer shadow-2xs"
                >
                  <option value="Kindness & Sharing">Kindness & Sharing (Socio-Emotional)</option>
                  <option value="Colors & Shapes Adventure">Colors & Shapes Adventure (Cognitive)</option>
                  <option value="Animal Kingdom & Sounds">Animal Kingdom & Habitats (Science)</option>
                  <option value="Solar System & Twinkling Stars">Solar System & Stars (Discovery)</option>
                  <option value="Planting Seeds & Nature Care">Planting Seeds & Green Earth (Ecology)</option>
                  <option value="My Senses & Body Parts">My 5 Senses & Healthy Habits (Biology)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-700 font-bold block">2. Activity Duration</label>
                <div className="flex gap-2">
                  {['20 Mins', '35 Mins', '45 Mins'].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setLpDuration(dur)}
                      className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        lpDuration === dur
                          ? 'bg-[#5B468C] text-white border-[#5B468C] shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  disabled={lpLoading}
                  onClick={handleGenerateLessonPlan}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-quicksand font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{lpLoading ? 'Crafting Lesson Plan...' : '✨ Generate Lesson Plan'}</span>
                </button>
              </div>
            </div>

            {/* Generated Plan Display */}
            {generatedLessonPlan ? (
              <div className="bg-gradient-to-b from-purple-50/40 via-white to-slate-50 border-2 border-purple-200 rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-purple-100">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      Ready for Classroom Delivery
                    </span>
                    <h4 className="text-xl font-bold font-quicksand text-slate-800 mt-1">
                      {generatedLessonPlan.title}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Grade: <b>{generatedLessonPlan.grade}</b> • Duration: <b>{generatedLessonPlan.duration}</b> • Focus: <b>{generatedLessonPlan.theme}</b>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${generatedLessonPlan.title}\n\nSTORY:\n${generatedLessonPlan.circleTimeStory}\n\nACTIVITY:\n${generatedLessonPlan.classroomActivity}`);
                        showToast('Lesson plan copied to clipboard!');
                      }}
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Copy Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-2 bg-[#5B468C] hover:bg-[#4A3875] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Plan</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Left: Circle Time Story & Rhyme */}
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2">
                      <span className="font-bold text-amber-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        1. Circle Time Story Script (Read Aloud)
                      </span>
                      <p className="text-slate-700 leading-relaxed text-xs italic">
                        "{generatedLessonPlan.circleTimeStory}"
                      </p>
                    </div>

                    <div className="p-4 bg-pink-50/60 border border-pink-200/80 rounded-2xl space-y-2">
                      <span className="font-bold text-pink-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-pink-600" />
                        2. Catchy Phonics & Movement Rhyme
                      </span>
                      <p className="text-pink-950 font-medium whitespace-pre-line text-xs font-mono">
                        {generatedLessonPlan.catchyPhonicsRhyme}
                      </p>
                    </div>
                  </div>

                  {/* Right: Goals, Hands-On Activity & Take-Home */}
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl space-y-2">
                      <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        3. Core Pedagogical Goals
                      </span>
                      <ul className="space-y-1.5 text-slate-700">
                        {(generatedLessonPlan.learningGoals || []).map((g, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-xs">
                            <span className="text-emerald-600 font-bold">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-1.5">
                      <span className="font-bold text-purple-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-purple-600" />
                        4. Sensory Classroom Activity
                      </span>
                      <p className="text-slate-700 leading-relaxed text-xs">
                        {generatedLessonPlan.classroomActivity}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-1.5">
                      <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider block flex items-center gap-1.5">
                        <Send className="w-4 h-4 text-blue-600" />
                        5. Take-Home Activity for Parents
                      </span>
                      <p className="text-slate-700 leading-relaxed text-xs">
                        {generatedLessonPlan.parentTakeHome}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 font-quicksand text-xs border border-dashed rounded-3xl bg-slate-50/50">
                <Sparkles className="w-8 h-8 mx-auto text-purple-300 mb-2" />
                Select a topic above and click "✨ Generate Lesson Plan" to create a fresh classroom guide!
              </div>
            )}

          </div>
        </div>
      )}

      {/* Official Result Card Modal */}
      {activeResultCard && (
        <ResultCardModal
          activeResult={activeResultCard}
          onClose={() => setActiveResultCard(null)}
        />
      )}

      {/* Confirmation Modal */}
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
