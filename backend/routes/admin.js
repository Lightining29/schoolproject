import express from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
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
import FineRule from '../models/FineRule.js';
import Event from '../models/Event.js';
import { protect, authorize } from '../middleware/auth.js';
import mockStore from '../config/mockStore.js';
import { uploadGallery, uploadAdmissions } from '../middleware/upload.js';

const router = express.Router();

async function assignFeesForStudent(studentId, className, isMock, customAdmissionFee) {
  let structure = null;
  if (isMock) {
    structure = await mockStore.findOne('feeStructures', { class: className, isActive: true });
  } else {
    structure = await FeeStructure.findOne({ class: className, isActive: true }).lean();
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

  let monthlySum = defaultClassFees[className] || 1250;
  let admissionFee = Number(customAdmissionFee) || 0;
  let annualCharges = 0;
  let examinationFee = 0;

  if (structure) {
    if (!admissionFee && structure.admissionFee) admissionFee = structure.admissionFee;
    annualCharges = structure.annualCharges || 0;
    examinationFee = structure.examinationFee || 0;
    
    monthlySum = (structure.tuitionFee || monthlySum) +
                 (structure.computerFee || 0) +
                 (structure.developmentFee || 0) +
                 (structure.activityFee || 0) +
                 (structure.smartClassFee || 0) +
                 (structure.transportFee || 0) +
                 (structure.customFees || []).reduce((sum, f) => sum + (f.amount || 0), 0);
  }

  const feeRecords = [];
  const now = new Date();

  // 1. Create Admission Fee if any
  if (admissionFee > 0) {
    feeRecords.push({
      studentId,
      amount: admissionFee,
      term: 'Admission Fee',
      dueDate: now,
      status: 'paid',
      paymentDate: now,
      transactionId: `TXN-ADM-${Date.now()}`,
      paymentMethod: 'Admission Desk Cash'
    });
  }

  // 2. Create Annual Charges if any
  if (annualCharges > 0) {
    feeRecords.push({
      studentId,
      amount: annualCharges,
      term: 'Annual Maintenance Charges',
      dueDate: now,
      status: 'pending',
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
      dueDate: examDate,
      status: 'pending',
      paymentDate: null,
      transactionId: '',
      paymentMethod: ''
    });
  }

  // 4. Create 12 Monthly Tuition/Component Fee invoices
  for (let i = 1; i <= 12; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + (i - 1));
    const isPaid = i === 1; // Month 1 paid by default upon admission
    feeRecords.push({
      studentId,
      amount: monthlySum,
      term: `Month ${i} Tuition Fee (${className})`,
      dueDate,
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
    if (mockStore.isMock) {
      const admission = await mockStore.findById('admissions', id);
      if (!admission) return res.status(404).send('Admission record not found');
      
      const doc = admission.documentData?.[fieldName];
      if (doc && doc.data) {
        res.contentType(doc.contentType || 'application/octet-stream');
        return res.send(Buffer.from(doc.data, 'base64'));
      }
      const path = admission.documents?.[fieldName];
      if (path && typeof path === 'string') {
        return res.redirect(path);
      }
      return res.status(404).send('Document not found');
    }

    const admission = await Admission.findById(id);
    if (!admission) return res.status(404).send('Admission record not found');
    
    const doc = admission.documentData?.[fieldName];
    if (doc && doc.data) {
      res.contentType(doc.contentType || 'application/octet-stream');
      return res.send(doc.data);
    }
    const path = admission.documents?.[fieldName];
    if (path && typeof path === 'string') {
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
    if (mockStore.isMock) {
      const student = await mockStore.findById('students', id);
      if (!student) return res.status(404).send('Student not found');
      
      const photo = student.photoData;
      if (photo && photo.data) {
        res.contentType(photo.contentType || 'image/png');
        return res.send(Buffer.from(photo.data, 'base64'));
      }
      const path = student.photo;
      if (path && typeof path === 'string') {
        return res.redirect(path);
      }
      return res.status(404).send('Photo not found');
    }

    const student = await Student.findById(id);
    if (!student) return res.status(404).send('Student not found');
    
    const photo = student.photoData;
    if (photo && photo.data) {
      res.contentType(photo.contentType || 'image/png');
      return res.send(photo.data);
    }
    const path = student.photo;
    if (path && typeof path === 'string') {
      return res.redirect(path);
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

        // Automatically assign fee structure according to class
        await assignFeesForStudent(newStudent._id, newStudent.class, true);
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
      const studentDbId = new mongoose.Types.ObjectId();
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

      // Automatically assign fee structure according to class
      await assignFeesForStudent(student._id, student.class, false);
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
  let { studentDetails, parentDetails, password, admissionFee, addressProofType } = req.body;
  
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
      : new mongoose.Types.ObjectId();
    const studentDbId = isMock
      ? 'std_' + Math.random().toString(36).substr(2, 9)
      : new mongoose.Types.ObjectId();

    const getFileUrl = (file, fieldName) => {
      if (!file) return '';
      if (file.filename) return `/uploads/${file.filename}`;
      return `/api/admin/admissions/document/${admissionId}/${fieldName}`;
    };

    const makeDocData = (file) => {
      if (!file) return undefined;
      // Only keep small in-memory buffers if memoryStorage was used and file is tiny (<500KB)
      if (file.buffer && file.buffer.length < 500 * 1024) {
        return {
          data: isMock ? file.buffer.toString('base64') : file.buffer,
          contentType: file.mimetype,
          filename: file.originalname
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

      // Create Admission Fee invoice + receipt if provided
      let createdAdmissionFee = null;
      let createdReceipt = null;
      const admissionFeeVal = Number(admissionFee) || 0;
      if (admissionFeeVal > 0) {
        const txnId = `TXN-ADM-${Math.floor(100000 + Math.random() * 900000)}`;
        createdAdmissionFee = await mockStore.create('fees', {
          studentId: newStudent._id,
          amount: admissionFeeVal,
          term: 'Admission Fee',
          dueDate: new Date(),
          status: 'paid',
          paymentDate: new Date(),
          transactionId: txnId,
          paymentMethod: 'Admission Desk Cash'
        });
        createdReceipt = await mockStore.create('receipts', {
          feeId: createdAdmissionFee._id,
          studentId: newStudent._id,
          receiptNumber: `REC-ADM-${Date.now()}`,
          amountPaid: admissionFeeVal,
          paymentMethod: 'Admission Desk Cash',
          paymentDate: new Date(),
          transactionId: txnId
        });
      }

      for (let i = 1; i <= 12; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        await mockStore.create('fees', {
          studentId: newStudent._id,
          amount: 150,
          term: `Month ${i} Tuition Fee`,
          dueDate,
          status: i === 1 ? 'paid' : 'pending',
          paymentDate: i === 1 ? new Date() : null,
          transactionId: i === 1 ? `TXN-INIT-${Math.floor(100000 + Math.random() * 900000)}` : '',
          paymentMethod: i === 1 ? 'Admission Desk Cash' : ''
        });
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

    // Automatically assign and generate structured fees based on student's class
    let createdReceipt = null;
    const admissionFeeVal = Number(admissionFee) || 0;
    await assignFeesForStudent(student._id, student.class, isMock, admissionFeeVal);

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
  const { name, dateOfBirth, gender, studentClass, parentName, parentEmail, parentPhone, parentAddress, password } = req.body;
  
  try {
    const generatedStudentId = `STD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

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

      for (let i = 1; i <= 12; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        await mockStore.create('fees', {
          studentId: student._id,
          amount: 150,
          term: `Month ${i} Tuition Fee`,
          dueDate,
          status: i === 1 ? 'paid' : 'pending',
          paymentDate: i === 1 ? new Date() : null,
          transactionId: i === 1 ? `TXN-INIT-${Math.floor(100000 + Math.random() * 900000)}` : '',
          paymentMethod: i === 1 ? 'Admission Desk Cash' : ''
        });
      }

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

    // Automatically assign and generate structured fees based on student's class
    await assignFeesForStudent(student._id, student.class, isMock, 0);

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

    const galId = new mongoose.Types.ObjectId();
    const gal = await Gallery.create({
      _id: galId,
      title,
      description,
      url: `/api/public/gallery/image/${galId}`,
      category: category || 'events',
      type: type || 'image',
      imageData: { data: fileBuffer, contentType }
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

// Document serving endpoints relocated to the top (public routes)

export default router;
