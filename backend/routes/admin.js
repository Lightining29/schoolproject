import express from 'express';
import bcrypt from 'bcryptjs';
import { generateId } from '../config/modelHelper.js';
import fs from 'fs';
import User from '../models/User.js';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import Admission from '../models/Admission.js';
import Announcement from '../models/Announcement.js';
import Gallery from '../models/Gallery.js';
import Fee from '../models/Fee.js';
import Query from '../models/Query.js';
import Receipt from '../models/Receipt.js';
import FeeStructure from '../models/FeeStructure.js';
import StudentFeeStructure from '../models/StudentFeeStructure.js';
import FineRule from '../models/FineRule.js';
import Event from '../models/Event.js';
import CashDeskTransaction from '../models/CashDeskTransaction.js';
import CashDeskClosing from '../models/CashDeskClosing.js';
import FeeReminder from '../models/FeeReminder.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';
import mockStore from '../config/mockStore.js';
import { uploadGallery, uploadAdmissions } from '../middleware/upload.js';
import { generateSchoolNoticeAI, generateFinancialForecastAI } from '../config/aiVerificationService.js';

const router = express.Router();

async function assignFeesForStudent(studentId, className, isMock, customAdmissionFee, customMonthlyFee) {
  // Check if student has a custom StudentFeeStructure
  let studentStructure = null;
  if (isMock) {
    studentStructure = await mockStore.findOne('studentFeeStructures', { studentId });
  } else {
    studentStructure = await StudentFeeStructure.findOne({ studentId, isActive: true }).lean();
  }

  let classStructure = null;
  if (isMock) {
    classStructure = await mockStore.findOne('feeStructures', { class: className, isActive: true });
  } else {
    classStructure = await FeeStructure.findOne({ class: className, isActive: true }).lean();
  }

  const defaultClassFees = {
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

  let monthlySum = (Number(customMonthlyFee) > 0) ? Number(customMonthlyFee) : (defaultClassFees[className] || 1250);
  let admissionFee = Number(customAdmissionFee) || 0;
  let annualCharges = 0;
  let examinationFee = 0;
  let registrationFee = 0;
  let transportFee = 0;
  let discountAmount = 0;
  let discountReason = '';

  if (studentStructure) {
    // If student-specific structure exists and is configured by admin
    if (studentStructure.admissionFee?.enabled) admissionFee = Number(studentStructure.admissionFee.amount) || admissionFee;
    if (studentStructure.registrationFee?.enabled) registrationFee = Number(studentStructure.registrationFee.amount) || 0;
    if (studentStructure.examFee?.enabled) examinationFee = Number(studentStructure.examFee.amount) || 0;
    if (studentStructure.transportFee?.enabled) transportFee = Number(studentStructure.transportFee.amount) || 0;
    
    // Monthly components
    let baseMonthly = 0;
    if (studentStructure.monthlyFee?.enabled) {
      baseMonthly += Number(studentStructure.monthlyFee.amount) || 0;
    } else if (studentStructure.tuitionFee?.enabled) {
      baseMonthly += Number(studentStructure.tuitionFee.amount) || 0;
    }
    if (studentStructure.libraryFee?.enabled) baseMonthly += Number(studentStructure.libraryFee.amount) || 0;
    if (studentStructure.hostelFee?.enabled) baseMonthly += Number(studentStructure.hostelFee.amount) || 0;
    if (studentStructure.otherCharges?.enabled) baseMonthly += Number(studentStructure.otherCharges.amount) || 0;

    if (baseMonthly > 0) {
      monthlySum = baseMonthly;
    } else if (Number(customMonthlyFee) > 0) {
      monthlySum = Number(customMonthlyFee);
    }

    if (studentStructure.discount?.amount > 0) {
      discountAmount = Number(studentStructure.discount.amount);
      discountReason = studentStructure.discount.reason || 'Admin Concession';
    }
  } else if (Number(customMonthlyFee) > 0) {
    monthlySum = Number(customMonthlyFee);
  } else if (classStructure) {
    if (!admissionFee && classStructure.admissionFee) admissionFee = classStructure.admissionFee;
    annualCharges = classStructure.annualCharges || 0;
    examinationFee = classStructure.examinationFee || 0;
    
    monthlySum = (classStructure.tuitionFee || monthlySum) +
                 (classStructure.computerFee || 0) +
                 (classStructure.developmentFee || 0) +
                 (classStructure.activityFee || 0) +
                 (classStructure.smartClassFee || 0) +
                 (classStructure.transportFee || 0) +
                 (classStructure.customFees || []).reduce((sum, f) => sum + (f.amount || 0), 0);
  }

  const feeRecords = [];
  const now = new Date();

  // 1. Create Admission Fee if any
  if (admissionFee > 0) {
    feeRecords.push({
      studentId,
      amount: admissionFee,
      term: 'Admission Fee',
      feeType: 'admission',
      dueDate: now,
      status: 'paid',
      paidAmount: admissionFee,
      totalPayable: admissionFee,
      remainingAmount: 0,
      paymentDate: now,
      transactionId: `TXN-ADM-${Date.now()}`,
      paymentMethod: 'Admission Desk Cash'
    });
  }

  // 1b. Create Registration Fee if any
  if (registrationFee > 0) {
    feeRecords.push({
      studentId,
      amount: registrationFee,
      term: 'Registration Fee',
      feeType: 'registration',
      dueDate: now,
      status: 'paid',
      paidAmount: registrationFee,
      totalPayable: registrationFee,
      remainingAmount: 0,
      paymentDate: now,
      transactionId: `TXN-REG-${Date.now()}`,
      paymentMethod: 'Admission Desk Cash'
    });
  }

  // 2. Create Annual Charges if any
  if (annualCharges > 0) {
    feeRecords.push({
      studentId,
      amount: annualCharges,
      term: 'Annual Maintenance Charges',
      feeType: 'annual',
      dueDate: now,
      status: 'pending',
      totalPayable: annualCharges,
      remainingAmount: annualCharges,
      paidAmount: 0,
      paymentDate: null,
      transactionId: '',
      paymentMethod: ''
    });
  }

  // 3. Create Examination Fee if any
  if (examinationFee > 0) {
    const examDate = new Date();
    examDate.setMonth(examDate.getMonth() + 6);
    feeRecords.push({
      studentId,
      amount: examinationFee,
      term: 'Examination Fee',
      feeType: 'exam',
      dueDate: examDate,
      status: 'pending',
      totalPayable: examinationFee,
      remainingAmount: examinationFee,
      paidAmount: 0,
      paymentDate: null,
      transactionId: '',
      paymentMethod: ''
    });
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // 4. Create 12 Monthly Tuition/Component Fee invoices
  const startMonthIndex = now.getMonth();
  const currentYear = now.getFullYear();

  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    dueDate.setDate(10); // Standard 10th of each month

    const monthIndex = (startMonthIndex + (i - 1)) % 12;
    const monthYear = currentYear + Math.floor((startMonthIndex + (i - 1)) / 12);
    const mName = monthNames[monthIndex];

    const isPaid = i === 1; // Month 1 paid upon admission
    const finalMonthFee = monthlySum + transportFee;
    const itemDiscount = isPaid ? Math.min(discountAmount, finalMonthFee) : 0;
    const netPayable = Math.max(0, finalMonthFee - itemDiscount);

    feeRecords.push({
      studentId,
      amount: finalMonthFee,
      term: `${mName} ${monthYear} Monthly Fee (${className})`,
      feeType: 'monthly',
      month: mName,
      year: monthYear,
      dueDate,
      discountAmount: itemDiscount,
      discountReason: itemDiscount > 0 ? discountReason : '',
      fineAmount: 0,
      fineReason: '',
      totalPayable: netPayable,
      paidAmount: isPaid ? netPayable : 0,
      remainingAmount: isPaid ? 0 : netPayable,
      previousDue: 0,
      status: isPaid ? 'paid' : 'pending',
      paymentDate: isPaid ? now : null,
      transactionId: isPaid ? `TXN-INIT-${Date.now()}-${i}` : '',
      paymentMethod: isPaid ? 'Admission Desk Cash' : ''
    });
  }

  if (isMock) {
    for (const item of feeRecords) {
      await mockStore.create('fees', item);
    }
  } else {
    await Fee.insertMany(feeRecords);
  }
}

async function getCalculatedFees(rawFees) {
  let fineRules = [];
  if (mockStore.isMock) {
    fineRules = await mockStore.find('fineRules');
  } else {
    fineRules = await FineRule.find();
  }

  return rawFees.map(feeObj => {
    const fee = feeObj.toObject ? feeObj.toObject() : { ...feeObj };
    
    if (fee.status === 'paid' || !fee.dueDate) {
      fee.fine = 0;
      fee.totalAmount = fee.amount;
      return fee;
    }

    const dueDate = new Date(fee.dueDate);
    const now = new Date();
    if (now <= dueDate) {
      fee.fine = 0;
      fee.totalAmount = fee.amount;
      return fee;
    }

    const diffTime = Math.abs(now - dueDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let fineAmount = 0;
    if (diffDays > 0) {
      for (const rule of fineRules) {
        if (diffDays >= rule.minDays && diffDays <= rule.maxDays) {
          fineAmount = rule.fineAmount;
          break;
        }
      }
      if (fineAmount === 0 && fineRules.length > 0) {
        const sortedRules = [...fineRules].sort((a, b) => b.maxDays - a.maxDays);
        if (diffDays > sortedRules[0].maxDays) {
          fineAmount = sortedRules[0].fineAmount;
        }
      }
    }

    fee.fine = fineAmount;
    fee.totalAmount = fee.amount + fineAmount;
    return fee;
  });
}

// @desc    Retrieve admission document in binary
// @route   GET /api/admin/admissions/document/:id/:fieldName
router.get('/admissions/document/:id/:fieldName', async (req, res) => {
  try {
    const { id, fieldName } = req.params;
    let admission = null;
    if (mockStore.isMock) {
      admission = await mockStore.findById('admissions', id);
    } else {
      admission = await Admission.findById(id);
    }
    if (!admission) return res.status(404).send('Admission record not found');
    
    const doc = admission.documentData?.[fieldName];
    if (doc && doc.data) {
      res.contentType(doc.contentType || 'application/octet-stream');
      const buf = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data, 'base64');
      return res.send(buf);
    }

    const path = admission.documents?.[fieldName];
    if (path && typeof path === 'string') {
      if (path.startsWith('/uploads/')) {
        const localPath = `backend${path}`;
        if (fs.existsSync(localPath)) {
          return res.sendFile(localPath, { root: '.' });
        }
      }
      return res.redirect(path);
    }
    return res.status(404).send('Document not found');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// @desc    Retrieve student photo in binary
// @route   GET /api/admin/students/photo/:id
router.get('/students/photo/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let student = null;
    if (mockStore.isMock) {
      student = await mockStore.findById('students', id);
    } else {
      student = await Student.findById(id);
    }
    if (!student) return res.status(404).send('Student not found');
    
    const photo = student.photoData;
    if (photo && photo.data) {
      res.contentType(photo.contentType || 'image/jpeg');
      const buf = Buffer.isBuffer(photo.data) ? photo.data : Buffer.from(photo.data, 'base64');
      return res.send(buf);
    }
    const path = student.photo;
    if (path && typeof path === 'string') {
      if (path.startsWith('data:image')) {
        const parts = path.split(',');
        const mime = parts[0].split(':')[1].split(';')[0];
        res.contentType(mime || 'image/jpeg');
        return res.send(Buffer.from(parts[1], 'base64'));
      }
      if (path.startsWith('/uploads/')) {
        const localPath = `backend${path}`;
        if (fs.existsSync(localPath)) {
          return res.sendFile(localPath, { root: '.' });
        }
      }
      if (!path.includes(`/students/photo/${id}`)) {
        return res.redirect(path);
      }
    }
    return res.status(404).send('Photo not found');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Apply auth protection & role check to all admin routes
router.use(protect);
router.use(authorize('admin'));

// @desc    Get Fast Unified Admin Dashboard Data (Single round-trip)
// @route   GET /api/admin/dashboard-data
router.get('/dashboard-data', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const [students, parents, teachers, admissions, queries, rawFees, feeStructures, events] = await Promise.all([
        mockStore.find('students'),
        mockStore.find('parents'),
        mockStore.find('teachers'),
        mockStore.find('admissions'),
        mockStore.find('queries'),
        mockStore.find('fees'),
        mockStore.find('feeStructures'),
        mockStore.find('events')
      ]);

      const totalRevenue = rawFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
      const calculatedFees = await getCalculatedFees(rawFees);

      return res.json({
        success: true,
        stats: {
          students: students.length,
          parents: parents.length,
          teachers: teachers.length,
          pendingAdmissions: admissions.filter(a => a.status === 'pending').length,
          unreadQueries: queries.filter(q => q.status === 'unread').length,
          totalRevenue
        },
        admissions,
        students,
        teachers,
        fees: calculatedFees,
        queries,
        feeStructures,
        events: events || []
      });
    }

    // MongoDB (Lightning-fast parallel execution with lean queries)
    const [
      studentCount,
      parentCount,
      teacherCount,
      pendingAdmissions,
      unreadQueries,
      revenueAgg,
      admissionsList,
      studentsList,
      teachersList,
      feesList,
      queriesList,
      feeStructuresList,
      eventsList
    ] = await Promise.all([
      Student.countDocuments(),
      Parent.countDocuments(),
      Teacher.countDocuments(),
      Admission.countDocuments({ status: 'pending' }),
      Query.countDocuments({ status: 'unread' }),
      Fee.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Admission.find().select('-documentData').sort({ submissionDate: -1 }).lean(),
      Student.find().select('-photoData').populate('parentId', 'name email phone address').sort({ createdAt: -1 }).lean(),
      Teacher.find().lean(),
      Fee.find().populate({ path: 'studentId', select: 'name class' }).sort({ createdAt: -1 }).lean(),
      Query.find().sort({ createdAt: -1 }).lean(),
      FeeStructure.find({ isActive: true }).lean(),
      Event.find().sort({ startDate: 1 }).lean()
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const calculatedFees = await getCalculatedFees(feesList);

    res.json({
      success: true,
      stats: {
        students: studentCount,
        parents: parentCount,
        teachers: teacherCount,
        pendingAdmissions,
        unreadQueries,
        totalRevenue
      },
      admissions: admissionsList,
      students: studentsList,
      teachers: teachersList,
      fees: calculatedFees,
      queries: queriesList,
      feeStructures: feeStructuresList,
      events: eventsList || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get Admin Dashboard Analytics
// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const [students, parents, teachers, admissions, queries, fees] = await Promise.all([
        mockStore.find('students'),
        mockStore.find('parents'),
        mockStore.find('teachers'),
        mockStore.find('admissions'),
        mockStore.find('queries'),
        mockStore.find('fees')
      ]);

      const totalRevenue = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
      return res.json({
        success: true,
        stats: {
          students: students.length,
          parents: parents.length,
          teachers: teachers.length,
          pendingAdmissions: admissions.filter(a => a.status === 'pending').length,
          unreadQueries: queries.filter(q => q.status === 'unread').length,
          totalRevenue
        }
      });
    }

    // MongoDB
    const [studentCount, parentCount, teacherCount, pendingAdmissions, unreadQueries, revenueAgg] = await Promise.all([
      Student.countDocuments(),
      Parent.countDocuments(),
      Teacher.countDocuments(),
      Admission.countDocuments({ status: 'pending' }),
      Query.countDocuments({ status: 'unread' }),
      Fee.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        students: studentCount,
        parents: parentCount,
        teachers: teacherCount,
        pendingAdmissions,
        unreadQueries,
        totalRevenue: revenueAgg[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ADMISSIONS MANAGEMENT
// ==========================================

// @desc    Get all admission applications
// @route   GET /api/admin/admissions
router.get('/admissions', async (req, res) => {
  try {
    const mapAdmissionDocs = (adm) => {
      const obj = adm.toObject ? adm.toObject() : { ...adm };
      if (!obj.documents) return obj;
      const mappedDocs = { ...obj.documents };
      const documentFields = [
        'birthCertificate', 'photo', 'reportCard', 'transferCertificate',
        'aadhaarCard', 'fatherAadhaarCard', 'motherAadhaarCard', 'addressProof'
      ];
      documentFields.forEach(field => {
        const doc = obj.documentData?.[field];
        if (doc && doc.data) {
          mappedDocs[field] = `/api/admin/admissions/document/${obj._id}/${field}`;
        }
      });
      obj.documents = mappedDocs;
      return obj;
    };

    if (mockStore.isMock) {
      const list = await mockStore.find('admissions');
      const mappedList = list.map(mapAdmissionDocs);
      return res.json({ success: true, count: mappedList.length, data: mappedList });
    }
    const list = await Admission.find().sort({ submissionDate: -1 });
    const mappedList = list.map(mapAdmissionDocs);
    res.json({ success: true, count: mappedList.length, data: mappedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update admission status (Approve/Reject)
// @route   PUT /api/admin/admissions/:id
router.put('/admissions/:id', async (req, res) => {
  const { status, remarks, password } = req.body;

  try {
    if (mockStore.isMock) {
      const admission = await mockStore.findById('admissions', req.params.id);
      if (!admission) return res.status(404).json({ success: false, message: 'Application not found' });

      admission.status = status;
      admission.remarks = remarks || '';
      await mockStore.findByIdAndUpdate('admissions', req.params.id, admission);

      // If approved, provision a Parent User account and Student record
      if (status === 'approved') {
        // Check if Parent User already exists
        let parentUser = await mockStore.findOne('users', { email: admission.parentDetails.email });
        let parentProfile;

        if (!parentUser) {
          const salt = bcrypt.genSaltSync(10);
          const defaultPasswordHash = bcrypt.hashSync(password || 'parent123', salt);
          
          parentUser = await mockStore.create('users', {
            name: admission.parentDetails.fatherName || admission.parentDetails.motherName,
            email: admission.parentDetails.email,
            password: defaultPasswordHash,
            role: 'parent',
            profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'
          });

          parentProfile = await mockStore.create('parents', {
            userId: parentUser._id,
            name: parentUser.name,
            email: parentUser.email,
            phone: admission.parentDetails.phone,
            address: admission.parentDetails.address,
            children: []
          });
        } else {
          parentProfile = await mockStore.findOne('parents', { userId: parentUser._id });
        }

        // Get an available teacher
        const teachers = await mockStore.find('teachers');
        const teacherId = teachers[0]?._id || null;

        // Create the Student
        const studentDbId = 'std_' + Math.random().toString(36).substr(2, 9);
        const generatedStudentId = `STD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const hasPhoto = admission.documentData?.photo?.data;
        const newStudent = await mockStore.create('students', {
          _id: studentDbId,
          name: admission.studentDetails.name,
          studentId: generatedStudentId,
          dateOfBirth: admission.studentDetails.dateOfBirth,
          gender: admission.studentDetails.gender,
          class: admission.studentDetails.class,
          parentId: parentProfile._id,
          teacherId,
          photo: hasPhoto ? `/api/admin/students/photo/${studentDbId}` : (admission.documents?.photo || ''),
          photoData: admission.documentData?.photo,
          attendance: [],
          progressReports: [],
          activities: []
        });

        // Link child to Parent
        parentProfile.children.push(newStudent._id);
        await mockStore.findByIdAndUpdate('parents', parentProfile._id, { children: parentProfile.children });

        // Save Student Fee Structure if monthlyFee specified at admission time
        const admMonthlyFee = Number(req.body.monthlyFee) || Number(admission.monthlyFee) || 0;
        const admAdmissionFee = Number(req.body.admissionFee) || Number(admission.admissionFee) || 0;
        if (admMonthlyFee > 0) {
          await mockStore.create('studentFeeStructures', {
            studentId: newStudent._id,
            academicYear: '2026-2027',
            monthlyFee: { amount: admMonthlyFee, enabled: true },
            admissionFee: { amount: admAdmissionFee, enabled: admAdmissionFee > 0 },
            isActive: true
          });
        }

        // Automatically assign fee structure according to class and custom rates
        await assignFeesForStudent(newStudent._id, newStudent.class, true, admAdmissionFee, admMonthlyFee);
      }

      return res.json({ success: true, message: `Admission application status updated to ${status}!`, data: admission });
    }

    // MongoDB Mongoose
    const admission = await Admission.findById(req.params.id);
    if (!admission) return res.status(404).json({ success: false, message: 'Application not found' });

    admission.status = status;
    admission.remarks = remarks || '';
    await admission.save();

    if (status === 'approved') {
      // 1. Check if user already exists
      let user = await User.findOne({ email: admission.parentDetails.email });
      let parent;

      if (!user) {
        // Create user credentials
        user = await User.create({
          name: admission.parentDetails.fatherName || admission.parentDetails.motherName,
          email: admission.parentDetails.email,
          password: password || 'parent123', // Admin-provided password
          role: 'parent'
        });

        parent = await Parent.create({
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: admission.parentDetails.phone,
          address: admission.parentDetails.address,
          children: []
        });
      } else {
        parent = await Parent.findOne({ userId: user._id });
      }

      // Assign first available teacher if any
      const firstTeacher = await Teacher.findOne();

      // 2. Create student
      const studentDbId = generateId();
      const generatedStudentId = `STD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const hasPhoto = admission.documentData?.photo?.data;
      const student = await Student.create({
        _id: studentDbId,
        name: admission.studentDetails.name,
        studentId: generatedStudentId,
        dateOfBirth: admission.studentDetails.dateOfBirth,
        gender: admission.studentDetails.gender,
        class: admission.studentDetails.class,
        parentId: parent._id,
        fatherName: admission.parentDetails.fatherName || '',
        motherName: admission.parentDetails.motherName || '',
        teacherId: firstTeacher ? firstTeacher._id : null,
        photo: hasPhoto ? `/api/admin/students/photo/${studentDbId}` : (admission.documents?.photo || ''),
        photoData: admission.documentData?.photo
      });

      // 3. Link child
      parent.children.push(student._id);
      await parent.save();

      // Save Student Fee Structure if monthlyFee specified at admission time
      const admMonthlyFee = Number(req.body.monthlyFee) || Number(admission.monthlyFee) || 0;
      const admAdmissionFee = Number(req.body.admissionFee) || Number(admission.admissionFee) || 0;
      if (admMonthlyFee > 0) {
        await StudentFeeStructure.create({
          studentId: student._id,
          academicYear: '2026-2027',
          monthlyFee: { amount: admMonthlyFee, enabled: true },
          admissionFee: { amount: admAdmissionFee, enabled: admAdmissionFee > 0 },
          isActive: true
        });
      }

      // Automatically assign fee structure according to class and custom rates
      await assignFeesForStudent(student._id, student.class, false, admAdmissionFee, admMonthlyFee);
    }

    res.json({ success: true, message: `Admission application status updated to ${status}!`, data: admission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// USER REGISTRY MANAGEMENT (STUDENTS, TEACHERS)
// ==========================================

// Get all students
router.get('/students', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const list = await mockStore.find('students');
      const mappedList = list.map(std => {
        const stdObj = { ...std };
        if (stdObj.photoData && stdObj.photoData.data) {
          stdObj.photo = `/api/admin/students/photo/${stdObj._id}`;
        }
        return stdObj;
      });
      return res.json({ success: true, count: mappedList.length, data: mappedList });
    }
    const list = await Student.find().populate('parentId teacherId');
    const mappedList = list.map(std => {
      const stdObj = std.toObject();
      if (stdObj.photoData && stdObj.photoData.data) {
        stdObj.photo = `/api/admin/students/photo/${stdObj._id}`;
      }
      return stdObj;
    });
    res.json({ success: true, count: mappedList.length, data: mappedList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a student
router.delete('/students/:id', async (req, res) => {
  try {
    if (mockStore.isMock) {
      await mockStore.findByIdAndDelete('students', req.params.id);
      return res.json({ success: true, message: 'Student removed successfully' });
    }
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create Admission & Student directly (Admin-only)
router.post('/admissions/create', uploadAdmissions.fields([
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
  { name: 'reportCard', maxCount: 1 },
  { name: 'transferCertificate', maxCount: 1 },
  { name: 'aadhaarCard', maxCount: 1 },
  { name: 'fatherAadhaarCard', maxCount: 1 },
  { name: 'motherAadhaarCard', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 }
]), async (req, res) => {
  let { studentDetails, parentDetails, password, admissionFee, monthlyFee, addressProofType } = req.body;
  
  try {
    if (typeof studentDetails === 'string') studentDetails = JSON.parse(studentDetails);
    if (typeof parentDetails === 'string') parentDetails = JSON.parse(parentDetails);

    const appNo = `APN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;
    const generatedStudentId = `STD-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;

    const birthCertificateFile = req.files?.['birthCertificate']?.[0];
    const photoFile = req.files?.['photo']?.[0];
    const reportCardFile = req.files?.['reportCard']?.[0];
    const transferCertificateFile = req.files?.['transferCertificate']?.[0];
    const aadhaarCardFile = req.files?.['aadhaarCard']?.[0];
    const fatherAadhaarCardFile = req.files?.['fatherAadhaarCard']?.[0];
    const motherAadhaarCardFile = req.files?.['motherAadhaarCard']?.[0];
    const addressProofFile = req.files?.['addressProof']?.[0];

    const isMock = mockStore.isMock;
    const admissionId = isMock
      ? 'adm_' + Math.random().toString(36).substr(2, 9)
      : generateId();
    const studentDbId = isMock
      ? 'std_' + Math.random().toString(36).substr(2, 9)
      : generateId();

    const getFileUrl = (file, fieldName) => {
      if (!file) return '';
      if (file.filename) return `/uploads/${file.filename}`;
      return `/api/admin/admissions/document/${admissionId}/${fieldName}`;
    };

    const makeDocData = (file) => {
      if (!file) return undefined;
      let buf = file.buffer;
      if (!buf && file.path && fs.existsSync(file.path)) {
        try {
          buf = fs.readFileSync(file.path);
        } catch (e) {
          console.error('Error reading upload file from disk:', e);
        }
      }
      if (buf && buf.length < 5 * 1024 * 1024) {
        return {
          data: isMock ? buf.toString('base64') : buf.toString('base64'),
          contentType: file.mimetype || 'image/jpeg',
          filename: file.filename || file.originalname
        };
      }
      return undefined;
    };

    const documents = {
      birthCertificate: getFileUrl(birthCertificateFile, 'birthCertificate'),
      photo: getFileUrl(photoFile, 'photo'),
      parentIdProof: 'id_proof_uploaded.pdf',
      reportCard: getFileUrl(reportCardFile, 'reportCard'),
      transferCertificate: getFileUrl(transferCertificateFile, 'transferCertificate'),
      aadhaarCard: getFileUrl(aadhaarCardFile, 'aadhaarCard'),
      fatherAadhaarCard: getFileUrl(fatherAadhaarCardFile, 'fatherAadhaarCard'),
      motherAadhaarCard: getFileUrl(motherAadhaarCardFile, 'motherAadhaarCard'),
      addressProofType: addressProofType || '',
      addressProof: getFileUrl(addressProofFile, 'addressProof')
    };

    const documentData = {
      birthCertificate: makeDocData(birthCertificateFile),
      photo: makeDocData(photoFile),
      parentIdProof: undefined,
      reportCard: makeDocData(reportCardFile),
      transferCertificate: makeDocData(transferCertificateFile),
      aadhaarCard: makeDocData(aadhaarCardFile),
      fatherAadhaarCard: makeDocData(fatherAadhaarCardFile),
      motherAadhaarCard: makeDocData(motherAadhaarCardFile),
      addressProof: makeDocData(addressProofFile)
    };

    if (isMock) {
      let parentUser = await mockStore.findOne('users', { email: parentDetails.email });
      let parentProfile;
      if (!parentUser) {
        const salt = bcrypt.genSaltSync(10);
        parentUser = await mockStore.create('users', {
          name: parentDetails.fatherName || parentDetails.motherName,
          email: parentDetails.email,
          password: bcrypt.hashSync(password || 'parent123', salt),
          role: 'parent'
        });
        parentProfile = await mockStore.create('parents', {
          userId: parentUser._id,
          name: parentUser.name,
          email: parentUser.email,
          phone: parentDetails.phone,
          address: parentDetails.address,
          children: []
        });
      } else {
        parentProfile = await mockStore.findOne('parents', { userId: parentUser._id });
      }

      const teachers = await mockStore.find('teachers');
      const teacherId = teachers[0]?._id || null;

      const newStudent = await mockStore.create('students', {
        _id: studentDbId,
        name: studentDetails.name,
        studentId: generatedStudentId,
        dateOfBirth: studentDetails.dateOfBirth,
        gender: studentDetails.gender,
        class: studentDetails.class,
        parentId: parentProfile._id,
        teacherId,
        photo: photoFile ? `/api/admin/students/photo/${studentDbId}` : '',
        photoData: photoFile ? makeDocData(photoFile) : undefined,
        attendance: [],
        progressReports: [],
        activities: []
      });

      parentProfile.children.push(newStudent._id);
      await mockStore.findByIdAndUpdate('parents', parentProfile._id, { children: parentProfile.children });

      const admission = await mockStore.create('admissions', {
        _id: admissionId,
        applicationNumber: appNo,
        studentDetails,
        parentDetails,
        documents,
        documentData,
        status: 'approved',
        remarks: 'Direct Admin Admission',
        submissionDate: new Date()
      });

      const admissionFeeVal = Number(admissionFee) || 0;
      const monthlyFeeVal = Number(monthlyFee) || 0;

      // Persist custom StudentFeeStructure
      await mockStore.create('studentFeeStructures', {
        studentId: newStudent._id,
        academicYear: '2026-2027',
        admissionFee: { amount: admissionFeeVal, enabled: admissionFeeVal > 0 },
        monthlyFee: { amount: monthlyFeeVal, enabled: true },
        isActive: true
      });

      // Automatically assign fees according to decided admission rates
      await assignFeesForStudent(newStudent._id, newStudent.class, isMock, admissionFeeVal, monthlyFeeVal);

      let createdReceipt = null;
      if (admissionFeeVal > 0) {
        createdReceipt = {
          receiptNumber: `REC-ADM-${Date.now()}`,
          amountPaid: admissionFeeVal,
          paymentMethod: 'Admission Desk Cash',
          paymentDate: new Date(),
          transactionId: `TXN-ADM-${Date.now()}`
        };
      }

      return res.status(201).json({ 
        success: true, 
        message: 'Admission created and student registered successfully!', 
        data: admission,
        receipt: createdReceipt
      });
    }

    // MongoDB
    const parentEmail = (parentDetails.email || '').trim().toLowerCase();
    let parentUser = await User.findOne({
      email: { $regex: new RegExp(`^${parentEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    let parent;
    if (!parentUser) {
      parentUser = await User.create({
        name: parentDetails.fatherName || parentDetails.motherName || 'Parent',
        email: parentEmail || `parent_${Date.now()}@apnaschool.edu`,
        password: password || 'parent123',
        role: 'parent'
      });
      parent = await Parent.create({
        userId: parentUser._id,
        name: parentUser.name,
        email: parentUser.email,
        phone: parentDetails.phone || '+91 98XXX-XXXXX',
        address: parentDetails.address || 'City Center',
        children: []
      });
    } else {
      parent = await Parent.findOne({ userId: parentUser._id });
      if (!parent) {
        parent = await Parent.create({
          userId: parentUser._id,
          name: parentUser.name || parentDetails.fatherName || parentDetails.motherName || 'Parent',
          email: parentUser.email,
          phone: parentDetails.phone || '+91 98XXX-XXXXX',
          address: parentDetails.address || 'City Center',
          children: []
        });
      }
    }

    let firstTeacher = await Teacher.findOne();
    if (!firstTeacher) {
      let teacherUser = await User.findOne({ role: 'teacher' });
      if (!teacherUser) {
        teacherUser = await User.create({
          name: 'Teacher Staff',
          email: 'teacher@apnaschool.edu',
          password: 'teacher123',
          role: 'teacher'
        });
      }
      firstTeacher = await Teacher.create({
        userId: teacherUser._id,
        name: teacherUser.name,
        email: teacherUser.email,
        phone: '+91 98XXX-XXXXX',
        classesAssigned: ['Pre-Nursery', 'Nursery', 'Junior KG', 'Senior KG']
      });
    }

    const parsedDob = studentDetails.dateOfBirth ? new Date(studentDetails.dateOfBirth) : new Date('2022-01-01');
    const validDob = isNaN(parsedDob.getTime()) ? new Date('2022-01-01') : parsedDob;

    const student = await Student.create({
      _id: studentDbId,
      name: studentDetails.name,
      studentId: generatedStudentId,
      dateOfBirth: validDob,
      gender: studentDetails.gender || 'Male',
      class: studentDetails.class || 'Pre-Nursery',
      parentId: parent._id,
      fatherName: parentDetails.fatherName || '',
      motherName: parentDetails.motherName || '',
      teacherId: firstTeacher ? firstTeacher._id : null,
      photo: photoFile ? `/api/admin/students/photo/${studentDbId}` : '',
      photoData: photoFile ? makeDocData(photoFile) : undefined
    });

    if (!parent.children) parent.children = [];
    parent.children.push(student._id);
    if (parentDetails.fatherName) parent.fatherName = parentDetails.fatherName;
    if (parentDetails.motherName) parent.motherName = parentDetails.motherName;
    await parent.save();

    const admission = await Admission.create({
      _id: admissionId,
      applicationNumber: appNo,
      studentDetails: {
        ...studentDetails,
        dateOfBirth: validDob
      },
      parentDetails,
      documents,
      documentData,
      status: 'approved',
      remarks: 'Direct Admin Admission'
    });

    // Automatically assign and generate structured fees based on student's class and custom admission rates
    let createdReceipt = null;
    const admissionFeeVal = Number(admissionFee) || 0;
    const monthlyFeeVal = Number(monthlyFee) || 0;

    // Persist StudentFeeStructure in MySQL
    await StudentFeeStructure.create({
      studentId: student._id,
      academicYear: '2026-2027',
      admissionFee: { amount: admissionFeeVal, enabled: admissionFeeVal > 0 },
      monthlyFee: { amount: monthlyFeeVal, enabled: true },
      isActive: true
    });

    await assignFeesForStudent(student._id, student.class, isMock, admissionFeeVal, monthlyFeeVal);

    if (admissionFeeVal > 0) {
      createdReceipt = {
        receiptNumber: `REC-ADM-${Date.now()}`,
        amountPaid: admissionFeeVal,
        paymentMethod: 'Admission Desk Cash',
        paymentDate: new Date(),
        transactionId: `TXN-ADM-${Date.now()}`
      };
    }

    res.status(201).json({ 
      success: true, 
      message: 'Admission created and student registered successfully!', 
      data: admission,
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        class: student.class,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        photo: student.photo,
        fatherName: student.fatherName,
        motherName: student.motherName,
        parentId: {
          name: parent.name,
          fatherName: parent.fatherName || studentDetails.fatherName,
          motherName: parent.motherName || studentDetails.motherName,
          phone: parent.phone,
          address: parent.address
        }
      },
      receipt: createdReceipt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Direct Student Registration (Admin-only)
router.post('/students/register', async (req, res) => {
  const { name, dateOfBirth, gender, studentClass, parentName, parentEmail, parentPhone, parentAddress, password, admissionFee, monthlyFee } = req.body;
  
  try {
    const generatedStudentId = `STD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const admFeeVal = Number(admissionFee) || 0;
    const monthlyFeeVal = Number(monthlyFee) || 0;

    if (mockStore.isMock) {
      let parentUser = await mockStore.findOne('users', { email: parentEmail });
      let parentProfile;
      if (!parentUser) {
        const salt = bcrypt.genSaltSync(10);
        parentUser = await mockStore.create('users', {
          name: parentName,
          email: parentEmail,
          password: bcrypt.hashSync(password || 'parent123', salt),
          role: 'parent'
        });
        parentProfile = await mockStore.create('parents', {
          userId: parentUser._id,
          name: parentUser.name,
          email: parentUser.email,
          phone: parentPhone,
          address: parentAddress,
          children: []
        });
      } else {
        parentProfile = await mockStore.findOne('parents', { userId: parentUser._id });
      }

      const teachers = await mockStore.find('teachers');
      const teacherId = teachers[0]?._id || null;

      const student = await mockStore.create('students', {
        name,
        studentId: generatedStudentId,
        dateOfBirth,
        gender,
        class: studentClass,
        parentId: parentProfile._id,
        teacherId,
        attendance: [],
        progressReports: [],
        activities: []
      });

      parentProfile.children.push(student._id);
      await mockStore.findByIdAndUpdate('parents', parentProfile._id, { children: parentProfile.children });

      // Save StudentFeeStructure
      await mockStore.create('studentFeeStructures', {
        studentId: student._id,
        academicYear: '2026-2027',
        admissionFee: { amount: admFeeVal, enabled: admFeeVal > 0 },
        monthlyFee: { amount: monthlyFeeVal, enabled: true },
        isActive: true
      });

      // Automatically assign fees with decided admission & monthly rates
      await assignFeesForStudent(student._id, student.class, true, admFeeVal, monthlyFeeVal);

      return res.status(201).json({ success: true, message: 'Student registered directly successfully!', data: student });
    }

    const cleanEmail = (parentEmail || '').trim().toLowerCase();
    let parentUser = await User.findOne({
      email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    let parent;
    if (!parentUser) {
      parentUser = await User.create({
        name: parentName || 'Parent',
        email: cleanEmail || `parent_${Date.now()}@apnaschool.edu`,
        password: password || 'parent123',
        role: 'parent'
      });
      parent = await Parent.create({
        userId: parentUser._id,
        name: parentUser.name,
        email: parentUser.email,
        phone: parentPhone || '+91 98XXX-XXXXX',
        address: parentAddress || 'City Center',
        children: []
      });
    } else {
      parent = await Parent.findOne({ userId: parentUser._id });
      if (!parent) {
        parent = await Parent.create({
          userId: parentUser._id,
          name: parentUser.name || parentName || 'Parent',
          email: parentUser.email,
          phone: parentPhone || '+91 98XXX-XXXXX',
          address: parentAddress || 'City Center',
          children: []
        });
      }
    }

    let firstTeacher = await Teacher.findOne();
    if (!firstTeacher) {
      let teacherUser = await User.findOne({ role: 'teacher' });
      if (!teacherUser) {
        teacherUser = await User.create({
          name: 'Teacher Staff',
          email: 'teacher@apnaschool.edu',
          password: 'teacher123',
          role: 'teacher'
        });
      }
      firstTeacher = await Teacher.create({
        userId: teacherUser._id,
        name: teacherUser.name,
        email: teacherUser.email,
        phone: '+91 98XXX-XXXXX',
        classesAssigned: ['Pre-Nursery', 'Nursery', 'Junior KG', 'Senior KG']
      });
    }

    const parsedDob = dateOfBirth ? new Date(dateOfBirth) : new Date('2022-01-01');
    const validDob = isNaN(parsedDob.getTime()) ? new Date('2022-01-01') : parsedDob;

    const student = await Student.create({
      name,
      studentId: generatedStudentId,
      dateOfBirth: validDob,
      gender: gender || 'Male',
      class: studentClass || 'Pre-Nursery',
      parentId: parent._id,
      fatherName: req.body.fatherName || parentName || '',
      motherName: req.body.motherName || '',
      teacherId: firstTeacher ? firstTeacher._id : null
    });

    if (!parent.children) parent.children = [];
    parent.children.push(student._id);
    await parent.save();

    // Persist StudentFeeStructure in MySQL
    await StudentFeeStructure.create({
      studentId: student._id,
      academicYear: '2026-2027',
      admissionFee: { amount: admFeeVal, enabled: admFeeVal > 0 },
      monthlyFee: { amount: monthlyFeeVal, enabled: true },
      isActive: true
    });

    // Automatically assign and generate structured fees based on student's class and custom admission rates
    await assignFeesForStudent(student._id, student.class, isMock, admFeeVal, monthlyFeeVal);

    res.status(201).json({ 
      success: true, 
      message: 'Student registered directly successfully!', 
      data: student,
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        class: student.class,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        photo: student.photo || '',
        fatherName: student.fatherName,
        motherName: student.motherName,
        parentId: {
          name: parent.name,
          fatherName: parent.fatherName || student.fatherName,
          motherName: parent.motherName || student.motherName,
          phone: parent.phone,
          address: parent.address
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update Student Profile (Admin-only)
router.put('/students/:id', async (req, res) => {
  const { name, dateOfBirth, gender, studentClass, parentName, parentPhone, parentAddress } = req.body;
  
  try {
    if (mockStore.isMock) {
      const student = await mockStore.findById('students', req.params.id);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      
      const updatedStudent = await mockStore.findByIdAndUpdate('students', req.params.id, {
        name: name || student.name,
        dateOfBirth: dateOfBirth || student.dateOfBirth,
        gender: gender || student.gender,
        class: studentClass || student.class
      });

      if (student.parentId) {
        const parent = await mockStore.findById('parents', student.parentId);
        if (parent) {
          await mockStore.findByIdAndUpdate('parents', student.parentId, {
            name: parentName || parent.name,
            phone: parentPhone || parent.phone,
            address: parentAddress || parent.address
          });
        }
      }
      return res.json({ success: true, message: 'Student updated successfully', data: updatedStudent });
    }

    // MongoDB
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    student.name = name || student.name;
    student.dateOfBirth = dateOfBirth || student.dateOfBirth;
    student.gender = gender || student.gender;
    student.class = studentClass || student.class;
    await student.save();

    if (student.parentId) {
      const parent = await Parent.findById(student.parentId);
      if (parent) {
        parent.name = parentName || parent.name;
        parent.phone = parentPhone || parent.phone;
        parent.address = parentAddress || parent.address;
        await parent.save();
      }
    }

    res.json({ success: true, message: 'Student updated successfully', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all teachers
router.get('/teachers', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const list = await mockStore.find('teachers');
      return res.json({ success: true, count: list.length, data: list });
    }
    const list = await Teacher.find();
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a teacher
router.post('/teachers', async (req, res) => {
  const { name, email, password, phone, specialization, qualifications, classesAssigned } = req.body;
  try {
    if (mockStore.isMock) {
      const userExists = await mockStore.findOne('users', { email });
      if (userExists) return res.status(400).json({ success: false, message: 'Teacher email already registered' });

      const salt = bcrypt.genSaltSync(10);
      const passHash = bcrypt.hashSync(password || 'teacher123', salt);

      const newUser = await mockStore.create('users', {
        name,
        email,
        password: passHash,
        role: 'teacher',
        profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
      });

      const newTeacher = await mockStore.create('teachers', {
        userId: newUser._id,
        name,
        email,
        phone,
        specialization: specialization || 'Early Childhood Education',
        qualifications,
        classesAssigned: classesAssigned || ['Nursery']
      });

      return res.status(201).json({ success: true, message: 'Teacher registered successfully!', data: newTeacher });
    }

    // MongoDB
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Teacher email already registered' });

    const newUser = await User.create({
      name,
      email,
      password: password || 'teacher123',
      role: 'teacher'
    });

    const newTeacher = await Teacher.create({
      userId: newUser._id,
      name,
      email,
      phone,
      specialization: specialization || 'Early Childhood Education',
      qualifications,
      classesAssigned: classesAssigned || ['Nursery']
    });

    res.status(201).json({ success: true, message: 'Teacher registered successfully!', data: newTeacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// OTHER PORTAL MANAGERS (FEES, ANNOUNCEMENTS, GALLERY, QUERIES)
// ==========================================

// Create a fee invoice
router.post('/fees', async (req, res) => {
  let { studentId, amount, term, dueDate } = req.body;
  try {
    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Please select a student' });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid positive fee amount' });
    }
    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const validDueDate = isNaN(parsedDueDate.getTime()) ? new Date() : parsedDueDate;
    const feeTerm = term || 'Tuition Fee';

    if (mockStore.isMock) {
      const fee = await mockStore.create('fees', {
        studentId,
        amount: numAmount,
        term: feeTerm,
        dueDate: validDueDate,
        status: 'pending',
        paymentDate: null,
        transactionId: '',
        paymentMethod: ''
      });
      return res.status(201).json({ success: true, message: 'Fee invoice created!', data: fee });
    }

    const fee = await Fee.create({
      studentId,
      amount: numAmount,
      term: feeTerm,
      dueDate: validDueDate,
      status: 'pending'
    });
    await fee.populate({ path: 'studentId', select: 'name class' });

    res.status(201).json({ success: true, message: 'Fee invoice created!', data: fee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all fees
router.get('/fees', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const fees = await mockStore.find('fees');
      return res.json({ success: true, data: fees });
    }
    const fees = await Fee.find().populate({ path: 'studentId', select: 'name class' }).sort({ createdAt: -1 });
    res.json({ success: true, data: fees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// ADVANCED ADMIN-CONTROLLED FEE MANAGEMENT
// ==========================================

// Helper: Calculate standard monthly name
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// @desc    Get or create individual student fee structure
// @route   GET /api/admin/fees/student-structure/:studentId
router.get('/fees/student-structure/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    let student = null;
    let structure = null;

    if (mockStore.isMock) {
      student = await mockStore.findById('students', studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      structure = await mockStore.findOne('studentFeeStructures', { studentId });
    } else {
      student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      structure = await StudentFeeStructure.findOne({ studentId });
    }

    // Default structure template if not yet configured
    if (!structure) {
      structure = {
        studentId,
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
      };
    }

    res.json({
      success: true,
      student: { _id: student._id, name: student.name, studentId: student.studentId, class: student.class },
      data: structure
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Save or update individual student fee structure
// @route   POST /api/admin/fees/student-structure/:studentId
router.post('/fees/student-structure/:studentId', async (req, res) => {
  const { studentId } = req.params;
  const {
    academicYear,
    admissionFee,
    registrationFee,
    tuitionFee,
    monthlyFee,
    examFee,
    transportFee,
    hostelFee,
    libraryFee,
    otherCharges,
    discount,
    fine,
    notes,
    isActive
  } = req.body;

  try {
    let student = null;
    if (mockStore.isMock) {
      student = await mockStore.findById('students', studentId);
    } else {
      student = await Student.findById(studentId);
    }
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const payload = {
      studentId,
      academicYear: academicYear || '2026-2027',
      admissionFee: admissionFee || { amount: 0, enabled: false },
      registrationFee: registrationFee || { amount: 0, enabled: false },
      tuitionFee: tuitionFee || { amount: 0, enabled: false },
      monthlyFee: monthlyFee || { amount: 0, enabled: true },
      examFee: examFee || { amount: 0, enabled: false },
      transportFee: transportFee || { amount: 0, enabled: false },
      hostelFee: hostelFee || { amount: 0, enabled: false },
      libraryFee: libraryFee || { amount: 0, enabled: false },
      otherCharges: otherCharges || { amount: 0, enabled: false },
      discount: discount || { amount: 0, reason: '' },
      fine: fine || { amount: 0, reason: '' },
      notes: notes || '',
      isActive: isActive !== undefined ? isActive : true
    };

    let savedStructure = null;
    if (mockStore.isMock) {
      const existing = await mockStore.findOne('studentFeeStructures', { studentId });
      if (existing) {
        savedStructure = await mockStore.findByIdAndUpdate('studentFeeStructures', existing._id, payload);
      } else {
        savedStructure = await mockStore.create('studentFeeStructures', payload);
      }
    } else {
      const existing = await StudentFeeStructure.findOne({ studentId });
      if (existing) {
        Object.assign(existing, payload);
        savedStructure = await existing.save();
      } else {
        savedStructure = await StudentFeeStructure.create(payload);
      }
    }

    res.json({
      success: true,
      message: `Fee structure successfully configured for ${student.name}!`,
      data: savedStructure
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed student fee profile (Summary + Month-wise grid + Payments history)
// @route   GET /api/admin/fees/student-profile/:studentId
router.get('/fees/student-profile/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    let student = null;
    let structure = null;
    let fees = [];
    let receipts = [];

    if (mockStore.isMock) {
      student = await mockStore.findById('students', studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      structure = await mockStore.findOne('studentFeeStructures', { studentId });
      const allFees = await mockStore.find('fees');
      fees = allFees.filter(f => String(f.studentId) === String(studentId));
      const allReceipts = await mockStore.find('receipts');
      receipts = allReceipts.filter(r => String(r.studentId) === String(studentId));
    } else {
      student = await Student.findById(studentId).populate('parentId', 'name email phone address');
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      structure = await StudentFeeStructure.findOne({ studentId }).lean();
      fees = await Fee.find({ studentId }).sort({ dueDate: 1 }).lean();
      receipts = await Receipt.find({ studentId }).sort({ paymentDate: -1 }).lean();
    }

    // Sort fees chronologically
    fees.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

    // Calculate totals across all active/valid fee records
    let totalPayable = 0;
    let totalPaid = 0;
    let totalDiscount = 0;
    let totalFine = 0;
    let totalOutstanding = 0;

    const monthlyBreakdown = fees.map(f => {
      const isCancelled = f.status === 'cancelled';
      const grossAmount = Number(f.amount || 0);
      const discount = Number(f.discountAmount || 0);
      const fine = Number(f.fineAmount || 0);
      const netCalculatedPayable = Math.max(0, grossAmount - discount + fine);
      const paid = Number(f.paidAmount || 0);
      const due = isCancelled ? 0 : Math.max(0, netCalculatedPayable - paid);

      if (!isCancelled) {
        totalPayable += netCalculatedPayable;
        totalPaid += paid;
        totalDiscount += discount;
        totalFine += fine;
        totalOutstanding += due;
      }

      return {
        _id: f._id,
        term: f.term || (f.month ? `${f.month} ${f.year || 2026} Fee` : 'Fee Item'),
        feeType: f.feeType || 'monthly',
        month: f.month || '',
        year: f.year || 2026,
        dueDate: f.dueDate,
        grossFee: grossAmount,
        discount,
        discountReason: f.discountReason || '',
        fine,
        fineReason: f.fineReason || '',
        totalPayable: netCalculatedPayable,
        paid,
        due,
        status: f.status,
        paymentDate: f.paymentDate,
        transactionId: f.transactionId,
        paymentMethod: f.paymentMethod
      };
    });

    res.json({
      success: true,
      student,
      structure,
      summary: {
        totalPayable,
        totalPaid,
        totalDiscount,
        totalFine,
        totalOutstanding
      },
      monthlyBreakdown,
      paymentHistory: receipts.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Generate or adjust month fee for an individual student (preserves historic records)
// @route   POST /api/admin/fees/student/:studentId/monthly-fee
router.post('/fees/student/:studentId/monthly-fee', async (req, res) => {
  const { studentId } = req.params;
  const { month, year, feeAmount, discountAmount, discountReason, fineAmount, fineReason, dueDate, forceOverwrite } = req.body;

  if (!month) return res.status(400).json({ success: false, message: 'Please specify the month' });
  const numYear = Number(year) || new Date().getFullYear();
  const numAmount = Number(feeAmount);
  if (isNaN(numAmount) || numAmount < 0) {
    return res.status(400).json({ success: false, message: 'Please provide a valid fee amount' });
  }

  try {
    let student = null;
    let existingInvoice = null;

    if (mockStore.isMock) {
      student = await mockStore.findById('students', studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      const allFees = await mockStore.find('fees');
      existingInvoice = allFees.find(f => 
        String(f.studentId) === String(studentId) && 
        f.month === month && 
        Number(f.year) === numYear && 
        f.status !== 'cancelled'
      );
    } else {
      student = await Student.findById(studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      existingInvoice = await Fee.findOne({
        studentId,
        month,
        year: numYear,
        status: { $ne: 'cancelled' }
      });
    }

    // Historical record protection: if already paid or partially paid, do not overwrite unless forceOverwrite explicitly approved
    if (existingInvoice && (existingInvoice.status === 'paid' || existingInvoice.paidAmount > 0) && !forceOverwrite) {
      return res.status(400).json({
        success: false,
        message: `Historical payment exists for ${month} ${numYear} (Paid: ₹${existingInvoice.paidAmount}). Changing current monthly rate must not modify historical settled transactions. Set forceOverwrite=true only if specifically authorized.`
      });
    }

    const numDiscount = Number(discountAmount) || 0;
    const numFine = Number(fineAmount) || 0;
    const netTotal = Math.max(0, numAmount - numDiscount + numFine);
    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(`${month} 15, ${numYear}`);

    let resultInvoice = null;
    if (existingInvoice) {
      // Update existing unpaid or pending invoice
      const updatedFields = {
        amount: numAmount,
        term: `${month} ${numYear} Monthly Fee (${student.class})`,
        discountAmount: numDiscount,
        discountReason: discountReason || '',
        fineAmount: numFine,
        fineReason: fineReason || '',
        totalPayable: netTotal,
        remainingAmount: Math.max(0, netTotal - (existingInvoice.paidAmount || 0)),
        dueDate: isNaN(parsedDueDate.getTime()) ? existingInvoice.dueDate : parsedDueDate
      };

      if (mockStore.isMock) {
        resultInvoice = await mockStore.findByIdAndUpdate('fees', existingInvoice._id, updatedFields);
      } else {
        Object.assign(existingInvoice, updatedFields);
        resultInvoice = await existingInvoice.save();
      }
    } else {
      // Create new month invoice
      const newInvoiceData = {
        studentId,
        amount: numAmount,
        term: `${month} ${numYear} Monthly Fee (${student.class})`,
        feeType: 'monthly',
        month,
        year: numYear,
        dueDate: isNaN(parsedDueDate.getTime()) ? new Date() : parsedDueDate,
        discountAmount: numDiscount,
        discountReason: discountReason || '',
        fineAmount: numFine,
        fineReason: fineReason || '',
        totalPayable: netTotal,
        paidAmount: 0,
        remainingAmount: netTotal,
        previousDue: 0,
        status: 'pending'
      };

      if (mockStore.isMock) {
        resultInvoice = await mockStore.create('fees', newInvoiceData);
      } else {
        resultInvoice = await Fee.create(newInvoiceData);
      }
    }

    res.json({
      success: true,
      message: `Monthly fee for ${month} ${numYear} configured successfully!`,
      data: resultInvoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Universal payment record (Supports full, partial, multiple payments, advance, overdue settlement)
// @route   POST /api/admin/fees/record-payment
router.post('/fees/record-payment', async (req, res) => {
  const {
    studentId,
    feeId,
    paymentAmount,
    paymentMethod,
    discountApplied,
    fineApplied,
    month,
    year,
    feeType,
    remarks,
    adminName
  } = req.body;

  const payAmt = Number(paymentAmount);
  if (isNaN(payAmt) || payAmt <= 0) {
    return res.status(400).json({ success: false, message: 'Please enter a valid positive payment amount' });
  }

  const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const rcpNumber = `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const method = paymentMethod || 'Admission Desk Cash';
  const now = new Date();

  try {
    let student = null;
    let targetFee = null;

    if (mockStore.isMock) {
      if (studentId) {
        student = await mockStore.findById('students', studentId);
      }
      if (feeId) {
        targetFee = await mockStore.findById('fees', feeId);
        if (!student && targetFee) {
          student = await mockStore.findById('students', targetFee.studentId);
        }
      } else if (studentId) {
        // Find earliest unpaid or partially paid invoice for student
        const allFees = await mockStore.find('fees');
        const studentFees = allFees
          .filter(f => String(f.studentId) === String(studentId) && f.status !== 'paid' && f.status !== 'cancelled')
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        targetFee = studentFees[0];
      }
    } else {
      if (studentId) {
        student = await Student.findById(studentId);
      }
      if (feeId) {
        targetFee = await Fee.findById(feeId);
        if (!student && targetFee) {
          student = await Student.findById(targetFee.studentId);
        }
      } else if (studentId) {
        targetFee = await Fee.findOne({
          studentId,
          status: { $in: ['pending', 'partially_paid', 'overdue'] }
        }).sort({ dueDate: 1 });
      }
    }

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found' });
    }

    // If no existing invoice found, this is an advance or on-demand payment invoice
    if (!targetFee) {
      const targetMonth = month || MONTH_NAMES[now.getMonth()];
      const targetYear = Number(year) || now.getFullYear();
      const newInvData = {
        studentId: student._id,
        amount: payAmt,
        term: `${targetMonth} ${targetYear} Fee / Advance Payment`,
        feeType: feeType || 'advance',
        month: targetMonth,
        year: targetYear,
        dueDate: now,
        discountAmount: Number(discountApplied) || 0,
        fineAmount: Number(fineApplied) || 0,
        totalPayable: payAmt,
        paidAmount: payAmt,
        remainingAmount: 0,
        previousDue: 0,
        status: 'paid',
        paymentDate: now,
        transactionId: txnId,
        paymentMethod: method
      };

      if (mockStore.isMock) {
        targetFee = await mockStore.create('fees', newInvData);
      } else {
        targetFee = await Fee.create(newInvData);
      }
    } else {
      // Apply discount & fine if provided
      if (discountApplied !== undefined) {
        targetFee.discountAmount = Number(discountApplied) || 0;
      }
      if (fineApplied !== undefined) {
        targetFee.fineAmount = Number(fineApplied) || 0;
      }

      const gross = Number(targetFee.amount || 0);
      const disc = Number(targetFee.discountAmount || 0);
      const fn = Number(targetFee.fineAmount || 0);
      const netPayable = Math.max(0, gross - disc + fn);
      targetFee.totalPayable = netPayable;

      const currentPaid = Number(targetFee.paidAmount || 0);
      const newPaid = currentPaid + payAmt;
      const remaining = Math.max(0, netPayable - newPaid);
      const isFullySettled = remaining === 0;

      const installments = targetFee.installments || [];
      installments.push({
        amount: payAmt,
        date: now,
        method,
        transactionId: txnId,
        receiptNumber: rcpNumber
      });

      const updatedFields = {
        paidAmount: newPaid,
        remainingAmount: remaining,
        status: isFullySettled ? 'paid' : 'partially_paid',
        paymentDate: now,
        transactionId: txnId,
        paymentMethod: method,
        installments
      };

      if (mockStore.isMock) {
        targetFee = await mockStore.findByIdAndUpdate('fees', targetFee._id, updatedFields);
      } else {
        Object.assign(targetFee, updatedFields);
        await targetFee.save();
      }
    }

    // Create immutable receipt / payment record
    const receiptData = {
      feeId: targetFee._id,
      studentId: student._id,
      receiptNumber: rcpNumber,
      amountPaid: payAmt,
      feeType: targetFee.feeType || 'monthly',
      month: targetFee.month || '',
      amountDue: targetFee.totalPayable || targetFee.amount,
      discount: targetFee.discountAmount || 0,
      fine: targetFee.fineAmount || 0,
      remainingAmount: targetFee.remainingAmount || 0,
      paymentMethod: method,
      paymentDate: now,
      transactionId: txnId,
      status: 'completed',
      createdByAdmin: adminName || 'Admin Desk',
      remarks: remarks || 'Payment recorded via Admin Fee Desk'
    };

    let receipt = null;
    if (mockStore.isMock) {
      receipt = await mockStore.create('receipts', receiptData);
    } else {
      receipt = await Receipt.create(receiptData);
    }

    // Automatically create Cash Desk Transaction for the ledger
    const cashDeskPayload = {
      transactionId: txnId,
      date: now.toISOString().slice(0, 10),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      type: 'collection',
      category: targetFee.feeType === 'admission' ? 'Admission Fee' : (targetFee.month ? `${targetFee.month} Fee` : 'Monthly Fee'),
      studentId: student._id,
      studentName: student.name,
      feeId: targetFee._id,
      receiptId: receipt._id,
      paymentMethod: method,
      amount: payAmt,
      referenceNumber: rcpNumber,
      collectedBy: adminName || 'Admin Desk',
      notes: remarks || `Fee payment collected for ${student.name}`,
      status: 'completed',
      createdAt: now
    };

    if (mockStore.isMock) {
      await mockStore.create('cashDeskTransactions', cashDeskPayload);
    } else {
      await CashDeskTransaction.create(cashDeskPayload);
    }

    // Write financial Audit Log
    await recordAuditLog(
      'PAYMENT_RECORDED',
      'FINANCE',
      'FEE_INVOICE',
      targetFee._id,
      `Recorded payment of ₹${payAmt} for ${student.name} (${student.class}). Receipt: ${rcpNumber}. Method: ${method}`,
      adminName || 'Admin Desk'
    );

    res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmt.toLocaleString('en-IN')} recorded successfully! Receipt generated: ${rcpNumber}`,
      fee: targetFee,
      receipt,
      student: { name: student.name, studentId: student.studentId, class: student.class }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Cancel / reverse a payment transaction (maintains audit trail without hard deletion)
// @route   POST /api/admin/fees/receipts/:id/cancel
router.post('/fees/receipts/:id/cancel', async (req, res) => {
  const { reason, adminName } = req.body;
  try {
    let receipt = null;
    let fee = null;

    if (mockStore.isMock) {
      receipt = await mockStore.findById('receipts', req.params.id);
      if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
      if (receipt.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'This receipt has already been reversed' });
      }

      fee = await mockStore.findById('fees', receipt.feeId);
      await mockStore.findByIdAndUpdate('receipts', receipt._id, {
        status: 'cancelled',
        remarks: `REVERSED by ${adminName || 'Admin'}: ${reason || 'Transaction cancelled'}`
      });

      if (fee) {
        const revisedPaid = Math.max(0, (fee.paidAmount || 0) - receipt.amountPaid);
        const netPayable = fee.totalPayable || fee.amount;
        await mockStore.findByIdAndUpdate('fees', fee._id, {
          paidAmount: revisedPaid,
          remainingAmount: Math.max(0, netPayable - revisedPaid),
          status: revisedPaid === 0 ? 'pending' : 'partially_paid'
        });
      }
    } else {
      receipt = await Receipt.findById(req.params.id);
      if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
      if (receipt.status === 'cancelled') {
        return res.status(400).json({ success: false, message: 'This receipt has already been reversed' });
      }

      fee = await Fee.findById(receipt.feeId);
      receipt.status = 'cancelled';
      receipt.remarks = `REVERSED by ${adminName || 'Admin'}: ${reason || 'Transaction cancelled'}`;
      await receipt.save();

      if (fee) {
        const revisedPaid = Math.max(0, (fee.paidAmount || 0) - receipt.amountPaid);
        const netPayable = fee.totalPayable || fee.amount;
        fee.paidAmount = revisedPaid;
        fee.remainingAmount = Math.max(0, netPayable - revisedPaid);
        fee.status = revisedPaid === 0 ? 'pending' : 'partially_paid';
        await fee.save();
      }

      // Update corresponding cash desk transaction
      const deskTxn = await CashDeskTransaction.findOne({ receiptId: receipt._id });
      if (deskTxn) {
        deskTxn.status = 'cancelled';
        deskTxn.notes = `CANCELLED: ${reason || 'Transaction reversed'}`;
        await deskTxn.save();
      }
    }

    if (mockStore.isMock) {
      const allDeskTxns = await mockStore.find('cashDeskTransactions');
      const targetDesk = allDeskTxns.find(d => String(d.receiptId) === String(receipt._id));
      if (targetDesk) {
        await mockStore.findByIdAndUpdate('cashDeskTransactions', targetDesk._id, {
          status: 'cancelled',
          notes: `CANCELLED: ${reason || 'Transaction reversed'}`
        });
      }
    }

    await recordAuditLog(
      'TRANSACTION_CANCELLED',
      'FINANCE',
      'RECEIPT',
      receipt._id,
      `Reversed payment receipt ${receipt.receiptNumber} (Amount: ₹${receipt.amountPaid}). Reason: ${reason || 'N/A'}`,
      adminName || 'Admin Desk'
    );

    res.json({
      success: true,
      message: `Transaction ${receipt.receiptNumber} successfully cancelled and reversed. Audit trail updated.`,
      receipt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Enhanced Fee Dashboard KPIs & Chart Aggregations
// @route   GET /api/admin/fees/dashboard-stats
router.get('/fees/dashboard-stats', async (req, res) => {
  try {
    let allFees = [];
    let allReceipts = [];
    let allStudents = [];

    if (mockStore.isMock) {
      allFees = await mockStore.find('fees');
      allReceipts = await mockStore.find('receipts');
      allStudents = await mockStore.find('students');
    } else {
      allFees = await Fee.find().lean();
      allReceipts = await Receipt.find({ status: { $ne: 'cancelled' } }).lean();
      allStudents = await Student.find().lean();
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentMonthIndex = now.getMonth();
    const currentMonthName = MONTH_NAMES[currentMonthIndex];
    const currentYear = now.getFullYear();

    // 1. Core KPIs
    let totalFees = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    const pendingStudentIds = new Set();
    const overdueStudentIds = new Set();

    allFees.forEach(f => {
      if (f.status === 'cancelled') return;
      const netPayable = f.totalPayable !== undefined ? Number(f.totalPayable) : Number(f.amount || 0);
      const paid = Number(f.paidAmount || (f.status === 'paid' ? f.amount : 0));
      const remaining = Math.max(0, netPayable - paid);

      totalFees += netPayable;
      totalCollected += paid;

      if (remaining > 0) {
        totalPending += remaining;
        pendingStudentIds.add(String(f.studentId));

        const dueDate = new Date(f.dueDate);
        if (dueDate < now || f.status === 'overdue') {
          totalOverdue += remaining;
          overdueStudentIds.add(String(f.studentId));
        }
      }
    });

    // 2. Today's Collection
    let todayCollection = 0;
    let thisMonthCollection = 0;

    allReceipts.forEach(r => {
      if (r.status === 'cancelled') return;
      const pDate = new Date(r.paymentDate || r.createdAt);
      if (pDate.toISOString().slice(0, 10) === todayStr) {
        todayCollection += Number(r.amountPaid || 0);
      }
      if (pDate.getMonth() === currentMonthIndex && pDate.getFullYear() === currentYear) {
        thisMonthCollection += Number(r.amountPaid || 0);
      }
    });

    // 3. Current Month Expected Collection
    let currentMonthExpected = 0;
    allFees.forEach(f => {
      if (f.status === 'cancelled') return;
      const d = new Date(f.dueDate);
      if (d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear) {
        currentMonthExpected += Number(f.totalPayable !== undefined ? f.totalPayable : f.amount);
      }
    });

    // 4. Monthly Collection Trends (Last 6 Months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yVal = d.getFullYear();
      const mLabel = `${MONTH_NAMES[mIdx].slice(0, 3)} ${yVal}`;

      let collectedAmt = 0;
      allReceipts.forEach(r => {
        if (r.status === 'cancelled') return;
        const rd = new Date(r.paymentDate || r.createdAt);
        if (rd.getMonth() === mIdx && rd.getFullYear() === yVal) {
          collectedAmt += Number(r.amountPaid || 0);
        }
      });

      let invoicedAmt = 0;
      allFees.forEach(f => {
        if (f.status === 'cancelled') return;
        const fd = new Date(f.dueDate);
        if (fd.getMonth() === mIdx && fd.getFullYear() === yVal) {
          invoicedAmt += Number(f.totalPayable !== undefined ? f.totalPayable : f.amount);
        }
      });

      monthlyTrends.push({
        month: mLabel,
        invoiced: invoicedAmt,
        collected: collectedAmt
      });
    }

    // 5. Course-wise / Class-wise Collection
    const classMap = {};
    allStudents.forEach(s => {
      classMap[String(s._id)] = s.class || 'Other';
    });

    const courseCollectionMap = {};
    allFees.forEach(f => {
      if (f.status === 'cancelled') return;
      const className = classMap[String(f.studentId)] || 'General';
      if (!courseCollectionMap[className]) {
        courseCollectionMap[className] = { class: className, totalInvoiced: 0, collected: 0, pending: 0 };
      }
      const net = f.totalPayable !== undefined ? Number(f.totalPayable) : Number(f.amount || 0);
      const pd = Number(f.paidAmount || (f.status === 'paid' ? f.amount : 0));
      courseCollectionMap[className].totalInvoiced += net;
      courseCollectionMap[className].collected += pd;
      courseCollectionMap[className].pending += Math.max(0, net - pd);
    });

    res.json({
      success: true,
      kpis: {
        totalFees,
        totalCollected,
        totalPending,
        totalOverdue,
        todayCollection,
        thisMonthCollection,
        currentMonthExpected,
        studentsWithPendingFees: pendingStudentIds.size,
        studentsWithOverdueFees: overdueStudentIds.size
      },
      charts: {
        monthlyTrends,
        pendingVsCollected: {
          collected: totalCollected,
          pending: totalPending,
          overdue: totalOverdue
        },
        courseWiseCollection: Object.values(courseCollectionMap)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create announcement
router.post('/announcements', async (req, res) => {
  const { title, content, category, targetAudience } = req.body;
  try {
    if (mockStore.isMock) {
      const ann = await mockStore.create('announcements', { title, content, category, targetAudience, date: new Date() });
      return res.status(201).json({ success: true, message: 'Announcement created!', data: ann });
    }
    const ann = await Announcement.create({ title, content, category, targetAudience });
    res.status(201).json({ success: true, message: 'Announcement created!', data: ann });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    if (mockStore.isMock) {
      await mockStore.findByIdAndDelete('announcements', req.params.id);
      return res.json({ success: true, message: 'Announcement deleted' });
    }
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// CALENDAR & EVENTS MANAGEMENT
// ==========================================

// @desc    Get all calendar events
// @route   GET /api/admin/events
router.get('/events', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const list = await mockStore.find('events');
      return res.json({ success: true, count: list.length, data: list });
    }
    const list = await Event.find().sort({ startDate: 1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create and post a new event
// @route   POST /api/admin/events
router.post('/events', async (req, res) => {
  const { title, description, startDate, endDate, type } = req.body;
  try {
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please provide event title, start date, and end date' });
    }

    if (mockStore.isMock) {
      const newEv = await mockStore.create('events', {
        title,
        description: description || '',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || 'celebration'
      });
      return res.status(201).json({ success: true, message: 'Event scheduled & posted successfully!', data: newEv });
    }

    const event = await Event.create({
      title,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: type || 'celebration'
    });

    res.status(201).json({ success: true, message: 'Event scheduled & posted successfully!', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Edit and update an existing event
// @route   PUT /api/admin/events/:id
router.put('/events/:id', async (req, res) => {
  const { title, description, startDate, endDate, type } = req.body;
  try {
    if (mockStore.isMock) {
      const updated = await mockStore.findByIdAndUpdate('events', req.params.id, {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(type && { type })
      });
      return res.json({ success: true, message: 'Event updated successfully!', data: updated });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate) event.endDate = new Date(endDate);
    if (type) event.type = type;

    await event.save();
    res.json({ success: true, message: 'Event updated successfully!', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete an event
// @route   DELETE /api/admin/events/:id
router.delete('/events/:id', async (req, res) => {
  try {
    if (mockStore.isMock) {
      await mockStore.findByIdAndDelete('events', req.params.id);
      return res.json({ success: true, message: 'Event removed from calendar' });
    }
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event removed from calendar' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create gallery item
router.post('/gallery', uploadGallery.single('file'), async (req, res) => {
  const { title, description, category, type } = req.body;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file (jpg/jpeg/png)' });
    }
    const fileBuffer = fs.readFileSync(req.file.path);
    const contentType = req.file.mimetype || 'image/jpeg';

    if (mockStore.isMock) {
      const galId = 'gal_' + Math.random().toString(36).substr(2, 9);
      const gal = await mockStore.create('gallery', {
        _id: galId,
        title,
        description,
        url: `/api/public/gallery/image/${galId}`,
        category: category || 'events',
        type: type || 'image',
        imageData: { data: fileBuffer.toString('base64'), contentType },
        date: new Date()
      });
      return res.status(201).json({ success: true, message: 'Media added to gallery!', data: gal });
    }

    const galId = generateId();
    const gal = await Gallery.create({
      _id: galId,
      title,
      description,
      url: `/api/public/gallery/image/${galId}`,
      category: category || 'events',
      type: type || 'image',
      imageData: { data: fileBuffer ? fileBuffer.toString('base64') : '', contentType }
    });
    res.status(201).json({ success: true, message: 'Media added to gallery!', data: gal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete gallery item
router.delete('/gallery/:id', async (req, res) => {
  try {
    if (mockStore.isMock) {
      await mockStore.findByIdAndDelete('gallery', req.params.id);
      return res.json({ success: true, message: 'Gallery item removed' });
    }
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Gallery item removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get queries
router.get('/queries', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const list = await mockStore.find('queries');
      return res.json({ success: true, count: list.length, data: list });
    }
    const list = await Query.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update query status (Resolve)
router.put('/queries/:id', async (req, res) => {
  const { status } = req.body;
  try {
    if (mockStore.isMock) {
      const q = await mockStore.findByIdAndUpdate('queries', req.params.id, { status });
      if (!q) return res.status(404).json({ success: false, message: 'Query not found' });
      return res.json({ success: true, message: 'Query status updated!', data: q });
    }
    const q = await Query.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!q) return res.status(404).json({ success: false, message: 'Query not found' });
    res.json({ success: true, message: 'Query status updated!', data: q });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get receipt details for an invoice (Admin)
// @route   GET /api/admin/receipt/:feeId
router.get('/receipt/:feeId', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const receipt = await mockStore.findOne('receipts', { feeId: req.params.feeId });
      if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
      const student = await mockStore.findById('students', receipt.studentId);
      const fee = await mockStore.findById('fees', receipt.feeId);
      return res.json({ 
        success: true, 
        receipt, 
        student: student ? { name: student.name, studentId: student.studentId, class: student.class } : null,
        fee: fee ? { term: fee.term } : null
      });
    }

    const receipt = await Receipt.findOne({ feeId: req.params.feeId })
      .populate('studentId', 'name studentId class')
      .populate('feeId', 'term');
      
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });

    res.json({ 
      success: true, 
      receipt,
      student: receipt.studentId,
      fee: receipt.feeId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Admin marks a fee as paid (Desk cash collection)
// @route   POST /api/admin/fees/:feeId/pay
router.post('/fees/:feeId/pay', async (req, res) => {
  const { paymentMethod } = req.body;
  const txnId = `TXN-DESK-${Math.floor(100000000 + Math.random() * 900000000)}`;

  try {
    if (mockStore.isMock) {
      const fee = await mockStore.findByIdAndUpdate('fees', req.params.feeId, {
        status: 'paid',
        paymentDate: new Date(),
        transactionId: txnId,
        paymentMethod: paymentMethod || 'Admission Desk Cash'
      });
      if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found' });
      
      const receipt = await mockStore.create('receipts', {
        feeId: req.params.feeId,
        studentId: fee.studentId,
        receiptNumber: `REC-${Date.now()}`,
        amountPaid: fee.amount,
        paymentMethod: paymentMethod || 'Admission Desk Cash',
        paymentDate: new Date(),
        transactionId: txnId
      });

      return res.json({ success: true, message: 'Fee marked as paid successfully!', data: fee, receipt });
    }

    const fee = await Fee.findById(req.params.feeId);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found' });

    fee.status = 'paid';
    fee.paymentDate = new Date();
    fee.transactionId = txnId;
    fee.paymentMethod = paymentMethod || 'Admission Desk Cash';
    await fee.save();

    const receipt = await Receipt.create({
      feeId: fee._id,
      studentId: fee.studentId,
      receiptNumber: `REC-${Date.now()}`,
      amountPaid: fee.amount,
      paymentMethod: paymentMethod || 'Admission Desk Cash',
      paymentDate: new Date(),
      transactionId: txnId
    });

    res.json({ success: true, message: 'Fee marked as paid successfully!', data: fee, receipt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get student fee balance & pending invoices summary
// @route   GET /api/admin/students/:id/fee-balance
router.get('/students/:id/fee-balance', async (req, res) => {
  try {
    const studentId = req.params.id;

    if (mockStore.isMock) {
      const student = await mockStore.findById('students', studentId);
      const allFees = await mockStore.find('fees');
      const studentFees = allFees.filter(f => String(f.studentId) === String(studentId));
      const totalFees = studentFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const paidFees = studentFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
      const remainingFees = Math.max(0, totalFees - paidFees);

      return res.json({
        success: true,
        student,
        totalFees,
        paidFees,
        remainingFees,
        pendingFees: studentFees.filter(f => f.status !== 'paid').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
        paidFeesList: studentFees.filter(f => f.status === 'paid').sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
      });
    }

    const student = await Student.findById(studentId).populate('parentId', 'name email phone address');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const studentFees = await Fee.find({ studentId }).sort({ dueDate: 1 }).lean();
    const totalFees = studentFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const paidFees = studentFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const remainingFees = Math.max(0, totalFees - paidFees);

    res.json({
      success: true,
      student,
      totalFees,
      paidFees,
      remainingFees,
      pendingFees: studentFees.filter(f => f.status !== 'paid'),
      paidFeesList: studentFees.filter(f => f.status === 'paid')
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Collect cash payment for a student fee or custom cash amount
// @route   POST /api/admin/fees/collect-cash
router.post('/fees/collect-cash', async (req, res) => {
  const { studentId, feeId, amount, paymentMethod } = req.body;
  const txnId = `TXN-CASH-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const method = paymentMethod || 'Cash at Desk';

  try {
    if (mockStore.isMock) {
      let targetFee = null;
      if (feeId) {
        targetFee = await mockStore.findById('fees', feeId);
      } else if (studentId) {
        const allFees = await mockStore.find('fees');
        targetFee = allFees.find(f => String(f.studentId) === String(studentId) && f.status !== 'paid');
      }

      if (!targetFee) {
        return res.status(404).json({ success: false, message: 'No pending fee found for this student' });
      }

      const updatedFee = await mockStore.findByIdAndUpdate('fees', targetFee._id, {
        status: 'paid',
        paymentDate: new Date(),
        transactionId: txnId,
        paymentMethod: method
      });

      const receipt = await mockStore.create('receipts', {
        feeId: updatedFee._id,
        studentId: updatedFee.studentId,
        receiptNumber: `REC-${Date.now()}`,
        amountPaid: updatedFee.amount,
        paymentMethod: method,
        paymentDate: new Date(),
        transactionId: txnId
      });

      return res.json({
        success: true,
        message: 'Cash fee collected successfully!',
        fee: updatedFee,
        receipt
      });
    }

    let targetFee = null;
    if (feeId) {
      targetFee = await Fee.findById(feeId);
    } else if (studentId) {
      targetFee = await Fee.findOne({ studentId, status: { $ne: 'paid' } }).sort({ dueDate: 1 });
    }

    if (!targetFee) {
      return res.status(404).json({ success: false, message: 'No pending fee invoice found to pay' });
    }

    targetFee.status = 'paid';
    targetFee.paymentDate = new Date();
    targetFee.transactionId = txnId;
    targetFee.paymentMethod = method;
    if (amount && Number(amount) > 0) {
      targetFee.amount = Number(amount);
    }
    await targetFee.save();

    const receipt = await Receipt.create({
      feeId: targetFee._id,
      studentId: targetFee.studentId,
      receiptNumber: `REC-${Date.now()}`,
      amountPaid: targetFee.amount,
      paymentMethod: method,
      paymentDate: new Date(),
      transactionId: txnId
    });

    // Fetch updated summary for immediate response
    const allStudentFees = await Fee.find({ studentId: targetFee.studentId }).lean();
    const totalFees = allStudentFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const paidFees = allStudentFees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const remainingFees = Math.max(0, totalFees - paidFees);

    res.json({
      success: true,
      message: 'Cash fee collected & recorded successfully!',
      fee: targetFee,
      receipt,
      totalFees,
      paidFees,
      remainingFees
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    AI Predictive Financial Analytics & Fee Default Forecasting
// @route   GET /api/admin/ai/financial-forecast
// @access  Private (Admin)
router.get('/ai/financial-forecast', protect, authorize('admin'), async (req, res) => {
  try {
    let feeRecords = [];
    if (mockStore.isMock) {
      feeRecords = await mockStore.find('fees');
    } else {
      feeRecords = await Fee.find().lean();
    }

    const forecast = generateFinancialForecastAI({ feeRecords });
    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    AI School Notice & Circular Writer
// @route   POST /api/admin/ai/compose-circular
// @access  Private (Admin)
router.post('/ai/compose-circular', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, keyPoints, tone, audience } = req.body;
    const circular = generateSchoolNoticeAI({
      title,
      keyPoints,
      tone,
      audience
    });
    res.json({ success: true, data: circular });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================================
// CASH DESK OPERATIONS & DAILY CLOSING (ERP SPECIFICATION)
// ==============================================================================

// Helper: Log audit action
async function recordAuditLog(action, category, targetEntity, targetId, details, performedBy = 'Admin', changes = null) {
  try {
    const payload = {
      action,
      category,
      performedBy,
      performedByRole: 'admin',
      targetEntity,
      targetId,
      details,
      changes,
      ipAddress: '127.0.0.1'
    };
    if (mockStore.isMock) {
      await mockStore.create('auditLogs', payload);
    } else {
      await AuditLog.create(payload);
    }
  } catch (err) {
    console.error('Audit log failure:', err.message);
  }
}

// @desc    Get Cash Desk Dashboard (Today's metrics, breakdown by payment method, transactions, closing status)
// @route   GET /api/admin/cash-desk/today
router.get('/cash-desk/today', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    let allTxns = [];
    let closingRecord = null;

    if (mockStore.isMock) {
      const txns = await mockStore.find('cashDeskTransactions');
      allTxns = txns.filter(t => t.date === todayStr);
      closingRecord = (await mockStore.find('cashDeskClosings')).find(c => c.closingDate === todayStr);
    } else {
      allTxns = await CashDeskTransaction.find({ date: todayStr }).lean();
      closingRecord = await CashDeskClosing.findOne({ closingDate: todayStr }).lean();
    }

    let cashCollection = 0;
    let upiCollection = 0;
    let cardCollection = 0;
    let bankCollection = 0;
    let expenses = 0;
    let refunds = 0;

    allTxns.forEach(t => {
      if (t.status === 'cancelled') return;
      const amt = Number(t.amount) || 0;
      if (t.type === 'collection') {
        const m = (t.paymentMethod || '').toLowerCase();
        if (m.includes('cash')) cashCollection += amt;
        else if (m.includes('upi') || m.includes('qr')) upiCollection += amt;
        else if (m.includes('card')) cardCollection += amt;
        else bankCollection += amt;
      } else if (t.type === 'expense') {
        expenses += amt;
      } else if (t.type === 'refund') {
        refunds += amt;
      }
    });

    const openingCash = closingRecord?.openingCash || 10000;
    const totalCollection = cashCollection + upiCollection + cardCollection + bankCollection;
    const digitalCollection = upiCollection + cardCollection + bankCollection;
    const expectedClosingCash = Math.max(0, openingCash + cashCollection - expenses - refunds);

    res.json({
      success: true,
      date: todayStr,
      summary: {
        openingCash,
        cashCollection,
        upiCollection,
        cardCollection,
        bankCollection,
        digitalCollection,
        totalCollection,
        expenses,
        refunds,
        expectedClosingCash,
        isClosed: !!closingRecord && closingRecord.status === 'closed',
        closingRecord
      },
      transactions: allTxns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Record Cash Desk Transaction (Expense, Refund, Custom Collection)
// @route   POST /api/admin/cash-desk/transaction
router.post('/cash-desk/transaction', async (req, res) => {
  const {
    type,
    category,
    amount,
    paymentMethod,
    studentId,
    studentName,
    referenceNumber,
    notes,
    collectedBy
  } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Please enter a valid positive transaction amount' });
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const txnId = `TXN-DESK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  try {
    const payload = {
      transactionId: txnId,
      date: todayStr,
      time: timeStr,
      type: type || 'collection',
      category: category || 'Other Fee',
      studentId: studentId || null,
      studentName: studentName || null,
      feeId: null,
      receiptId: null,
      paymentMethod: paymentMethod || 'Cash',
      amount: numAmount,
      referenceNumber: referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      collectedBy: collectedBy || 'Admin Desk',
      notes: notes || '',
      status: 'completed',
      createdAt: now
    };

    let txn = null;
    if (mockStore.isMock) {
      txn = await mockStore.create('cashDeskTransactions', payload);
    } else {
      txn = await CashDeskTransaction.create(payload);
    }

    await recordAuditLog(
      'CASH_DESK_ENTRY',
      'CASH_DESK',
      'TRANSACTION',
      txn._id,
      `Recorded ${type} of ₹${numAmount} under category ${category}`,
      collectedBy || 'Admin'
    );

    res.status(201).json({
      success: true,
      message: `${type.toUpperCase()} of ₹${numAmount.toLocaleString('en-IN')} recorded in Cash Desk!`,
      data: txn
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Perform Daily Cash Desk Closing
// @route   POST /api/admin/cash-desk/close
router.post('/cash-desk/close', async (req, res) => {
  const {
    openingCash,
    actualCash,
    discrepancyReason,
    closedBy,
    notes
  } = req.body;

  const todayStr = new Date().toISOString().slice(0, 10);

  try {
    let allTxns = [];
    if (mockStore.isMock) {
      const txns = await mockStore.find('cashDeskTransactions');
      allTxns = txns.filter(t => t.date === todayStr);
    } else {
      allTxns = await CashDeskTransaction.find({ date: todayStr }).lean();
    }

    let cashCollection = 0;
    let upiCollection = 0;
    let cardCollection = 0;
    let bankCollection = 0;
    let expenses = 0;
    let refunds = 0;

    allTxns.forEach(t => {
      if (t.status === 'cancelled') return;
      const amt = Number(t.amount) || 0;
      if (t.type === 'collection') {
        const m = (t.paymentMethod || '').toLowerCase();
        if (m.includes('cash')) cashCollection += amt;
        else if (m.includes('upi') || m.includes('qr')) upiCollection += amt;
        else if (m.includes('card')) cardCollection += amt;
        else bankCollection += amt;
      } else if (t.type === 'expense') {
        expenses += amt;
      } else if (t.type === 'refund') {
        refunds += amt;
      }
    });

    const openCash = Number(openingCash) || 10000;
    const actCash = Number(actualCash) !== undefined ? Number(actualCash) : 0;
    const digital = upiCollection + cardCollection + bankCollection;
    const expectedCash = Math.max(0, openCash + cashCollection - expenses - refunds);
    const discrepancy = actCash - expectedCash;

    if (discrepancy !== 0 && !discrepancyReason) {
      return res.status(400).json({
        success: false,
        message: `There is a cash difference of ₹${discrepancy}. Please provide an authorized explanation reason for the variance before closing.`
      });
    }

    const closingPayload = {
      closingDate: todayStr,
      openingCash: openCash,
      totalCashCollected: cashCollection,
      totalUpiCollected: upiCollection,
      totalCardCollected: cardCollection,
      totalBankCollected: bankCollection,
      totalDigitalCollected: digital,
      totalExpenses: expenses,
      totalRefunds: refunds,
      expectedCash,
      actualCash: actCash,
      discrepancy,
      discrepancyReason: discrepancyReason || 'Reconciled successfully',
      closedBy: closedBy || 'Admin Desk',
      status: 'closed',
      notes: notes || '',
      closedAt: new Date()
    };

    let record = null;
    if (mockStore.isMock) {
      const existing = (await mockStore.find('cashDeskClosings')).find(c => c.closingDate === todayStr);
      if (existing) {
        record = await mockStore.findByIdAndUpdate('cashDeskClosings', existing._id, closingPayload);
      } else {
        record = await mockStore.create('cashDeskClosings', closingPayload);
      }
    } else {
      const existing = await CashDeskClosing.findOne({ closingDate: todayStr });
      if (existing) {
        Object.assign(existing, closingPayload);
        record = await existing.save();
      } else {
        record = await CashDeskClosing.create(closingPayload);
      }
    }

    await recordAuditLog(
      'DAILY_CASH_CLOSING',
      'CASH_DESK',
      'DAILY_CLOSING',
      record._id,
      `Daily closing finalized for ${todayStr}. Expected: ₹${expectedCash}, Actual: ₹${actCash}, Variance: ₹${discrepancy}`,
      closedBy || 'Admin'
    );

    res.json({
      success: true,
      message: `Cash Desk successfully closed for ${todayStr}! Report archived permanently.`,
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================================
// AUTOMATED & SCHEDULED FEE REMINDER SYSTEM
// ==============================================================================

// @desc    Get all Fee Reminders (Upcoming, Due Today, Overdue)
// @route   GET /api/admin/reminders
router.get('/reminders', async (req, res) => {
  try {
    let reminders = [];
    if (mockStore.isMock) {
      reminders = await mockStore.find('feeReminders');
    } else {
      reminders = await FeeReminder.find().sort({ createdAt: -1 }).lean();
    }

    const now = new Date();
    let pendingInvoices = [];
    let students = [];
    let parents = [];
    if (mockStore.isMock) {
      const allFees = await mockStore.find('fees');
      pendingInvoices = allFees.filter(f => f.status !== 'paid' && f.status !== 'cancelled');
      students = await mockStore.find('students');
      parents = await mockStore.find('parents');
    } else {
      pendingInvoices = await Fee.find({ status: { $in: ['pending', 'partially_paid', 'overdue'] } }).lean();
      students = await Student.find().lean();
      parents = await Parent.find().lean();
    }

    const studentMap = {};
    students.forEach(s => { studentMap[String(s._id)] = s; });

    const parentMap = {};
    parents.forEach(p => { parentMap[String(p._id)] = p; });

    // Classify pending fees into reminder categories with rich detail
    const upcomingList = [];
    const dueTodayList = [];
    const overdueList = [];

    pendingInvoices.forEach(f => {
      const std = studentMap[String(f.studentId)];
      if (!std) return;
      const prnt = std.parentId ? parentMap[String(std.parentId._id || std.parentId)] : null;
      const parentName = prnt?.name || std.fatherName || 'Parent';
      const parentEmail = prnt?.email || '';
      const parentPhone = prnt?.phone || '';

      const d = new Date(f.dueDate);
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      const dueAmt = f.remainingAmount !== undefined ? f.remainingAmount : (f.amount - (f.paidAmount || 0));

      const itemPayload = {
        student: { _id: std._id, name: std.name, class: std.class, studentId: std.studentId },
        fee: f,
        dueAmount: dueAmt,
        dueDate: f.dueDate,
        parentName,
        parentEmail,
        parentPhone,
        daysRemaining: diffDays,
        daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,
        reminderNotice: diffDays > 0 
          ? `Next month fee will pay after ${diffDays} day${diffDays === 1 ? '' : 's'}`
          : diffDays === 0 ? 'Fee is due today' : `Fee is overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`
      };

      if (diffDays > 0) upcomingList.push(itemPayload);
      else if (diffDays === 0) dueTodayList.push(itemPayload);
      else overdueList.push(itemPayload);
    });

    res.json({
      success: true,
      stats: {
        upcomingDue: upcomingList.length,
        dueToday: dueTodayList.length,
        overdue: overdueList.length,
        totalSent: reminders.length
      },
      upcoming: upcomingList.sort((a, b) => a.daysRemaining - b.daysRemaining),
      dueToday: dueTodayList,
      overdue: overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue),
      logs: reminders.sort((a, b) => new Date(b.sentAt || b.createdAt) - new Date(a.sentAt || a.createdAt)),
      reminders: reminders.sort((a, b) => new Date(b.sentAt || b.createdAt) - new Date(a.sentAt || a.createdAt))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Dispatch Automated Fee Reminders (Cron Process or Manual Trigger)
// @route   POST /api/admin/reminders/dispatch
router.post('/reminders/dispatch', async (req, res) => {
  const { channel, reminderType, targetClass } = req.body;
  const chosenChannel = channel || 'email';
  const chosenType = reminderType || 'all';

  try {
    let fees = [];
    let students = [];
    let parents = [];

    if (mockStore.isMock) {
      fees = await mockStore.find('fees');
      students = await mockStore.find('students');
      parents = await mockStore.find('parents');
    } else {
      fees = await Fee.find({ status: { $in: ['pending', 'partially_paid', 'overdue'] } }).lean();
      students = await Student.find().lean();
      parents = await Parent.find().lean();
    }

    const studentMap = {};
    students.forEach(s => { studentMap[String(s._id)] = s; });

    const parentMap = {};
    parents.forEach(p => { parentMap[String(p._id)] = p; });

    const now = new Date();
    const dispatchedReminders = [];

    for (const f of fees) {
      if (f.status === 'paid' || f.status === 'cancelled') continue;
      const std = studentMap[String(f.studentId)];
      if (!std) continue;
      if (targetClass && std.class !== targetClass) continue;

      const prnt = std.parentId ? parentMap[String(std.parentId._id || std.parentId)] : null;
      const parentName = prnt?.name || std.fatherName || 'Parent';
      const parentEmail = prnt?.email || `${std.name.toLowerCase().replace(/\s+/g, '')}@parent.apnaschool.edu`;
      const parentPhone = prnt?.phone || '+91 98XXX-XXXXX';

      const d = new Date(f.dueDate);
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));

      let determinedType = 'due_today';
      let message = '';
      const dueAmt = f.remainingAmount !== undefined ? f.remainingAmount : f.amount;

      if (diffDays > 0) {
        determinedType = 'upcoming';
        message = `Dear ${parentName}, this is a gentle reminder that the monthly fee for ${std.name} (${std.class}) is due on ${d.toLocaleDateString('en-IN')}. Amount due: ₹${dueAmt.toLocaleString('en-IN')}.`;
      } else if (diffDays === 0) {
        determinedType = 'due_today';
        message = `Dear ${parentName}, the school fee of ₹${dueAmt.toLocaleString('en-IN')} for ${std.name} is due today. Kindly complete payment at the school cash desk or online.`;
      } else {
        determinedType = 'overdue';
        message = `Dear ${parentName}, the fee payment of ₹${dueAmt.toLocaleString('en-IN')} for ${std.name} is overdue. Please settle at the cash desk immediately to avoid late fees.`;
      }

      if (chosenType !== 'all' && chosenType !== determinedType) continue;

      const record = {
        studentId: std._id,
        studentName: std.name,
        parentName,
        parentEmail,
        parentPhone,
        feeId: f._id,
        month: f.month || 'Current Month',
        amountDue: dueAmt,
        reminderType: determinedType,
        channel: chosenChannel,
        message,
        scheduledFor: now,
        sentAt: now,
        status: 'DELIVERED',
        providerResponse: `Delivered via ${chosenChannel.toUpperCase()} gateway (Code 200)`,
        failureReason: null,
        sentBy: req.body.sentBy || 'Scheduled Cron Engine'
      };

      if (mockStore.isMock) {
        const saved = await mockStore.create('feeReminders', record);
        dispatchedReminders.push(saved);
      } else {
        const saved = await FeeReminder.create(record);
        dispatchedReminders.push(saved);
      }
    }

    await recordAuditLog(
      'REMINDERS_DISPATCHED',
      'REMINDERS',
      'FEE_REMINDER',
      'BATCH',
      `Dispatched ${dispatchedReminders.length} fee reminders via ${chosenChannel.toUpperCase()}`,
      req.body.sentBy || 'Admin'
    );

    res.json({
      success: true,
      message: `Successfully processed and dispatched ${dispatchedReminders.length} reminders!`,
      count: dispatchedReminders.length,
      data: dispatchedReminders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==============================================================================
// AUDIT LOG & COMPREHENSIVE REPORTS ENDPOINT
// ==============================================================================

// @desc    Get Financial Audit Logs
// @route   GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    let logs = [];
    if (mockStore.isMock) {
      logs = await mockStore.find('auditLogs');
    } else {
      logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    }
    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Export Comprehensive Financial ERP Reports (Daily, Monthly, Student Ledger, Overdue, Cash Desk)
// @route   GET /api/admin/fees/reports
router.get('/fees/reports', async (req, res) => {
  const { reportType, fromDate, toDate } = req.query;
  try {
    let allFees = [];
    let allReceipts = [];
    let allStudents = [];
    let allCashTxns = [];

    if (mockStore.isMock) {
      allFees = await mockStore.find('fees');
      allReceipts = await mockStore.find('receipts');
      allStudents = await mockStore.find('students');
      allCashTxns = await mockStore.find('cashDeskTransactions');
    } else {
      allFees = await Fee.find().lean();
      allReceipts = await Receipt.find().lean();
      allStudents = await Student.find().lean();
      allCashTxns = await CashDeskTransaction.find().lean();
    }

    const studentMap = {};
    allStudents.forEach(s => { studentMap[String(s._id)] = s; });

    let reportRows = [];
    let reportTitle = 'Financial Summary Report';

    if (reportType === 'daily_collection') {
      reportTitle = 'Daily Collection Report';
      reportRows = allReceipts
        .filter(r => r.status !== 'cancelled')
        .map(r => ({
          ReceiptNo: r.receiptNumber,
          StudentName: studentMap[String(r.studentId)]?.name || 'Student',
          Class: studentMap[String(r.studentId)]?.class || 'N/A',
          Date: new Date(r.paymentDate || r.createdAt).toLocaleDateString('en-IN'),
          Month: r.month || 'Current',
          Method: r.paymentMethod,
          AmountPaid: r.amountPaid,
          Status: r.status
        }));
    } else if (reportType === 'overdue_ledger') {
      reportTitle = 'Overdue Fees Ledger';
      const now = new Date();
      reportRows = allFees
        .filter(f => f.status !== 'paid' && f.status !== 'cancelled' && new Date(f.dueDate) < now)
        .map(f => ({
          StudentID: studentMap[String(f.studentId)]?.studentId || 'N/A',
          StudentName: studentMap[String(f.studentId)]?.name || 'Student',
          Class: studentMap[String(f.studentId)]?.class || 'N/A',
          Month: f.month || f.term,
          DueDate: new Date(f.dueDate).toLocaleDateString('en-IN'),
          AmountBilled: f.amount,
          AmountPaid: f.paidAmount || 0,
          OverdueBalance: f.remainingAmount !== undefined ? f.remainingAmount : (f.amount - (f.paidAmount || 0))
        }));
    } else if (reportType === 'cash_desk') {
      reportTitle = 'Cash Desk Transactions Ledger';
      reportRows = allCashTxns.map(t => ({
        TransactionID: t.transactionId,
        Date: t.date,
        Time: t.time,
        Type: t.type.toUpperCase(),
        Category: t.category,
        PartyName: t.studentName || 'School Desk',
        Method: t.paymentMethod,
        Amount: t.amount,
        RecordedBy: t.collectedBy,
        Status: t.status
      }));
    } else {
      // Default: Comprehensive Master Student Fee Ledger
      reportTitle = 'Master Student Fee Accounting Ledger';
      reportRows = allFees.map(f => ({
        InvoiceID: f._id,
        StudentName: studentMap[String(f.studentId)]?.name || 'Student',
        Class: studentMap[String(f.studentId)]?.class || 'N/A',
        Particulars: f.term || (f.month ? `${f.month} Fee` : 'Fee Item'),
        FeeType: f.feeType || 'monthly',
        GrossFee: f.amount,
        Discount: f.discountAmount || 0,
        Fine: f.fineAmount || 0,
        NetPayable: f.totalPayable !== undefined ? f.totalPayable : f.amount,
        Paid: f.paidAmount || 0,
        DueBalance: f.remainingAmount !== undefined ? f.remainingAmount : (f.amount - (f.paidAmount || 0)),
        Status: f.status
      }));
    }

    res.json({
      success: true,
      reportTitle,
      generatedAt: new Date(),
      totalRecords: reportRows.length,
      data: reportRows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

