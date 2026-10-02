import express from 'express';
import Student from '../models/Student.js';
import Parent from '../models/Parent.js';
import Teacher from '../models/Teacher.js';
import Fee from '../models/Fee.js';
import Receipt from '../models/Receipt.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import FineRule from '../models/FineRule.js';
import { protect, authorize } from '../middleware/auth.js';
import mockStore from '../config/mockStore.js';
import { createPaymentOrder, verifyPaymentSignature, getPublicPaymentKey } from '../config/paymentService.js';

const router = express.Router();

// ==========================================
// PARENT PORTAL ENDPOINTS
// ==========================================

// @desc    Get parent's children details
// @route   GET /api/portal/parent/children
// @access  Private (Parent)
router.get('/parent/children', protect, authorize('parent'), async (req, res) => {
  try {
    if (mockStore.isMock) {
      const parent = await mockStore.findOne('parents', { userId: req.user._id });
      if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });
      const children = await mockStore.find('students', { parentId: parent._id });
      return res.json({ success: true, children });
    }

    const parent = await Parent.findOne({ userId: req.user._id });
    if (!parent) return res.status(404).json({ success: false, message: 'Parent profile not found' });
    const children = await Student.find({ parentId: parent._id }).populate('teacherId');
    res.json({ success: true, children });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get fees for a student with fine rules and sibling discount
// @route   GET /api/portal/parent/child/:childId/fees
// @access  Private (Parent)
router.get('/parent/child/:childId/fees', protect, authorize('parent'), async (req, res) => {
  try {
    let rawFees = [];
    let fineRules = [];

    if (mockStore.isMock) {
      rawFees = await mockStore.find('fees', { studentId: req.params.childId });
      fineRules = await mockStore.find('fineRules');
    } else {
      rawFees = await Fee.find({ studentId: req.params.childId }).sort({ dueDate: 1 });
      fineRules = await FineRule.find();
    }

    const now = new Date();
    const fees = rawFees.map(feeItem => {
      const fee = feeItem.toObject ? feeItem.toObject() : { ...feeItem };
      const paidAmt = Number(fee.paidAmount || 0);
      const originalAmt = Number(fee.amount || 0);

      // Late fine calculation
      let fine = 0;
      if (fee.status !== 'paid' && fee.dueDate) {
        const dueDate = new Date(fee.dueDate);
        if (now > dueDate) {
          const diffDays = Math.floor(Math.abs(now - dueDate) / (1000 * 60 * 60 * 24));
          if (diffDays > 0) {
            for (const rule of fineRules) {
              if (diffDays >= rule.minDays && diffDays <= rule.maxDays) {
                fine = rule.fineAmount;
                break;
              }
            }
            if (fine === 0 && fineRules.length > 0) {
              const sorted = [...fineRules].sort((a, b) => b.maxDays - a.maxDays);
              if (diffDays > sorted[0].maxDays) fine = sorted[0].fineAmount;
            }
          }
        }
      }

      const totalBilled = originalAmt + fine;
      const balanceAmount = Math.max(0, totalBilled - paidAmt);

      return {
        ...fee,
        fine,
        totalAmount: totalBilled,
        paidAmount: paidAmt,
        balanceAmount: fee.status === 'paid' ? 0 : balanceAmount,
        installments: fee.installments || []
      };
    });

    res.json({ success: true, fees, paymentKey: getPublicPaymentKey() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create Razorpay Order for Fee Payment
// @route   POST /api/portal/parent/create-order/:feeId
// @access  Private (Parent)
router.post('/parent/create-order/:feeId', protect, authorize('parent'), async (req, res) => {
  const { customAmount } = req.body;
  try {
    let fee = null;
    if (mockStore.isMock) {
      fee = await mockStore.findById('fees', req.params.feeId);
    } else {
      fee = await Fee.findById(req.params.feeId);
    }
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const payAmount = Number(customAmount) > 0 ? Number(customAmount) : (fee.amount - (fee.paidAmount || 0));

    const orderData = await createPaymentOrder({
      amount: payAmount,
      receipt: `RCP_${fee._id.toString().slice(-6)}_${Date.now().toString().slice(-4)}`,
      notes: {
        feeId: fee._id.toString(),
        studentId: fee.studentId.toString(),
        term: fee.term
      }
    });

    res.json({ success: true, ...orderData, feeId: fee._id, payAmount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify Razorpay Payment and Record Installment
// @route   POST /api/portal/parent/verify-payment
// @access  Private (Parent)
router.post('/parent/verify-payment', protect, authorize('parent'), async (req, res) => {
  const { feeId, studentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, paidAmount, paymentMethod } = req.body;

  try {
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed' });
    }

    const payAmt = Number(paidAmount);
    const txnId = razorpay_payment_id || `TXN-RP-${Date.now()}`;
    const rcpNumber = `REC-RP-${Date.now()}`;
    const now = new Date();

    let fee = null;
    if (mockStore.isMock) {
      fee = await mockStore.findById('fees', feeId);
      if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

      const prevPaid = Number(fee.paidAmount || 0);
      const newPaid = prevPaid + payAmt;
      const isFull = newPaid >= fee.amount;
      const newStatus = isFull ? 'paid' : 'partially_paid';

      const installments = fee.installments || [];
      installments.push({
        amount: payAmt,
        date: now,
        method: paymentMethod || 'Razorpay UPI/Cards',
        transactionId: txnId,
        receiptNumber: rcpNumber
      });

      fee = await mockStore.findByIdAndUpdate('fees', feeId, {
        paidAmount: newPaid,
        status: newStatus,
        paymentDate: now,
        transactionId: txnId,
        paymentMethod: paymentMethod || 'Razorpay UPI/Cards',
        installments
      });

      const receipt = await mockStore.create('receipts', {
        feeId,
        studentId: fee.studentId,
        receiptNumber: rcpNumber,
        amountPaid: payAmt,
        paymentMethod: paymentMethod || 'Razorpay UPI/Cards',
        paymentDate: now,
        transactionId: txnId
      });

      return res.json({
        success: true,
        message: isFull ? 'Fee fully paid successfully!' : 'Installment payment recorded successfully!',
        fee,
        receipt
      });
    }

    // MySQL
    fee = await Fee.findById(feeId);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const prevPaid = Number(fee.paidAmount || 0);
    const newPaid = prevPaid + payAmt;
    const isFull = newPaid >= fee.amount;
    const newStatus = isFull ? 'paid' : 'partially_paid';

    const installments = fee.installments || [];
    installments.push({
      amount: payAmt,
      date: now,
      method: paymentMethod || 'Razorpay UPI/Cards',
      transactionId: txnId,
      receiptNumber: rcpNumber
    });

    fee.paidAmount = newPaid;
    fee.status = newStatus;
    fee.paymentDate = now;
    fee.transactionId = txnId;
    fee.paymentMethod = paymentMethod || 'Razorpay UPI/Cards';
    fee.installments = installments;
    await fee.save();

    const receipt = await Receipt.create({
      feeId: fee._id,
      studentId: fee.studentId,
      receiptNumber: rcpNumber,
      amountPaid: payAmt,
      paymentMethod: paymentMethod || 'Razorpay UPI/Cards',
      paymentDate: now,
      transactionId: txnId
    });

    res.json({
      success: true,
      message: isFull ? 'Fee fully paid successfully!' : 'Installment payment recorded successfully!',
      fee,
      receipt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Simulate or Process Direct Fee Payment (with Partial Payment support)
// @route   POST /api/portal/parent/child/:childId/pay-fee/:feeId
// @access  Private (Parent)
router.post('/parent/child/:childId/pay-fee/:feeId', protect, authorize('parent'), async (req, res) => {
  const { paymentMethod, customAmount } = req.body;
  const txnId = `TXN-${Math.floor(100000000 + Math.random() * 900000000)}`;
  const now = new Date();
  const rcpNumber = `REC-${Date.now()}`;

  try {
    if (mockStore.isMock) {
      const fee = await mockStore.findById('fees', req.params.feeId);
      if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found' });

      const prevPaid = Number(fee.paidAmount || 0);
      const remainingBalance = Math.max(0, fee.amount - prevPaid);
      const payAmt = Number(customAmount) > 0 ? Math.min(Number(customAmount), remainingBalance || fee.amount) : remainingBalance || fee.amount;
      const newPaid = prevPaid + payAmt;
      const isFull = newPaid >= fee.amount;

      const installments = fee.installments || [];
      installments.push({
        amount: payAmt,
        date: now,
        method: paymentMethod || 'Online Payment',
        transactionId: txnId,
        receiptNumber: rcpNumber
      });

      const updatedFee = await mockStore.findByIdAndUpdate('fees', req.params.feeId, {
        status: isFull ? 'paid' : 'partially_paid',
        paidAmount: newPaid,
        paymentDate: now,
        transactionId: txnId,
        paymentMethod: paymentMethod || 'Online Payment',
        installments
      });
      
      const receipt = await mockStore.create('receipts', {
        feeId: req.params.feeId,
        studentId: req.params.childId,
        receiptNumber: rcpNumber,
        amountPaid: payAmt,
        paymentMethod: paymentMethod || 'Online Payment',
        paymentDate: now,
        transactionId: txnId
      });

      return res.json({
        success: true,
        message: isFull ? 'Fee paid in full successfully!' : `Partial payment of ₹${payAmt} recorded!`,
        data: updatedFee,
        receipt
      });
    }

    const fee = await Fee.findById(req.params.feeId);
    if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found' });

    const prevPaid = Number(fee.paidAmount || 0);
    const remainingBalance = Math.max(0, fee.amount - prevPaid);
    const payAmt = Number(customAmount) > 0 ? Math.min(Number(customAmount), remainingBalance || fee.amount) : remainingBalance || fee.amount;
    const newPaid = prevPaid + payAmt;
    const isFull = newPaid >= fee.amount;

    const installments = fee.installments || [];
    installments.push({
      amount: payAmt,
      date: now,
      method: paymentMethod || 'Credit Card / UPI',
      transactionId: txnId,
      receiptNumber: rcpNumber
    });

    fee.status = isFull ? 'paid' : 'partially_paid';
    fee.paidAmount = newPaid;
    fee.paymentDate = now;
    fee.transactionId = txnId;
    fee.paymentMethod = paymentMethod || 'Credit Card / UPI';
    fee.installments = installments;
    await fee.save();

    const receipt = await Receipt.create({
      feeId: fee._id,
      studentId: fee.studentId,
      receiptNumber: rcpNumber,
      amountPaid: payAmt,
      paymentMethod: paymentMethod || 'Credit Card / UPI',
      paymentDate: now,
      transactionId: txnId
    });

    res.json({
      success: true,
      message: isFull ? 'Fee paid in full successfully!' : `Partial payment of ₹${payAmt} recorded!`,
      data: fee,
      receipt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed receipt for PDF generation
// @route   GET /api/portal/parent/receipt/:feeId
// @access  Private (Parent)
router.get('/parent/receipt/:feeId', protect, authorize('parent'), async (req, res) => {
  try {
    let receipt = null;
    let student = null;
    let fee = null;
    let parent = null;

    if (mockStore.isMock) {
      receipt = await mockStore.findOne('receipts', { feeId: req.params.feeId });
      fee = await mockStore.findById('fees', req.params.feeId);
      if (fee) student = await mockStore.findById('students', fee.studentId);
      if (student) parent = await mockStore.findById('parents', student.parentId);
    } else {
      receipt = await Receipt.findOne({ feeId: req.params.feeId });
      fee = await Fee.findById(req.params.feeId);
      if (fee) student = await Student.findById(fee.studentId);
      if (student) parent = await Parent.findById(student.parentId);
    }

    if (!fee) return res.status(404).json({ success: false, message: 'Fee invoice not found' });

    // Fallback receipt if not generated yet
    if (!receipt) {
      receipt = {
        _id: `rec_${Date.now()}`,
        feeId: fee._id,
        studentId: fee.studentId,
        receiptNumber: fee.transactionId ? `REC-${fee.transactionId}` : `REC-${Date.now()}`,
        amountPaid: fee.paidAmount || fee.amount,
        paymentMethod: fee.paymentMethod || 'Online Gateway',
        paymentDate: fee.paymentDate || new Date(),
        transactionId: fee.transactionId || `TXN-${Date.now()}`
      };
    }

    res.json({
      success: true,
      receipt,
      student: student ? {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        class: student.class,
        fatherName: student.fatherName || parent?.fatherName || '',
        motherName: student.motherName || parent?.motherName || ''
      } : null,
      parent: parent ? {
        name: parent.name,
        phone: parent.phone,
        address: parent.address
      } : null,
      fee: {
        _id: fee._id,
        term: fee.term,
        amount: fee.amount,
        paidAmount: fee.paidAmount || fee.amount,
        discountAmount: fee.discountAmount || 0,
        discountReason: fee.discountReason || '',
        balanceAmount: Math.max(0, fee.amount - (fee.paidAmount || 0)),
        status: fee.status,
        dueDate: fee.dueDate,
        installments: fee.installments || []
      },
      school: {
        name: 'Apna School Kindergarten & Primary Wing',
        tagline: 'Nurturing Little Minds with Love & Care',
        address: 'Plot 42, Knowledge Park, City Center',
        phone: '+91 98765-43210',
        email: 'info@apnaschool.edu',
        registrationNo: 'REG/KIND/2026/089'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// TEACHER PORTAL ENDPOINTS
// ==========================================

// @desc    Get teacher's assigned students
// @route   GET /api/portal/teacher/students
// @access  Private (Teacher)
router.get('/teacher/students', protect, authorize('teacher'), async (req, res) => {
  try {
    if (mockStore.isMock) {
      const teacher = await mockStore.findOne('teachers', { userId: req.user._id });
      if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });
      // In mock, get students taught by this teacher or matched by class
      const students = await mockStore.find('students', { teacherId: teacher._id });
      return res.json({ success: true, students });
    }

    const teacher = await Teacher.findOne({ userId: req.user._id });
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });
    
    // Find students whose class matches teacher's assigned classes or is assigned directly
    const students = await Student.find({
      $or: [
        { teacherId: teacher._id },
        { class: { $in: teacher.classesAssigned } }
      ]
    }).populate('parentId');
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log student attendance
// @route   POST /api/portal/teacher/student/:studentId/attendance
// @access  Private (Teacher)
router.post('/teacher/student/:studentId/attendance', protect, authorize('teacher'), async (req, res) => {
  const { date, status } = req.body; // status: present, absent, late
  const targetDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  try {
    if (mockStore.isMock) {
      const student = await mockStore.findById('students', req.params.studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      
      // Check if already logged
      const existingIdx = student.attendance.findIndex(att => att.date === targetDate);
      if (existingIdx !== -1) {
        student.attendance[existingIdx].status = status;
      } else {
        student.attendance.push({ date: targetDate, status });
      }
      await mockStore.findByIdAndUpdate('students', req.params.studentId, { attendance: student.attendance });
      return res.json({ success: true, message: 'Attendance updated successfully!', data: student });
    }

    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Check if attendance for this date is already logged
    const existingIndex = student.attendance.findIndex(
      (att) => att.date.toISOString().split('T')[0] === targetDate
    );

    if (existingIndex !== -1) {
      student.attendance[existingIndex].status = status;
    } else {
      student.attendance.push({ date: new Date(targetDate), status });
    }

    await student.save();
    res.json({ success: true, message: 'Attendance updated successfully!', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Submit student progress report
// @route   POST /api/portal/teacher/student/:studentId/progress
// @access  Private (Teacher)
router.post('/teacher/student/:studentId/progress', protect, authorize('teacher'), async (req, res) => {
  const { term, cognitive, social, creative, motorSkills, notes } = req.body;

  try {
    if (mockStore.isMock) {
      const student = await mockStore.findById('students', req.params.studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      // Add or update progress report
      const existingIdx = student.progressReports.findIndex(rep => rep.term === term);
      const reportData = { term, cognitive, social, creative, motorSkills, notes };

      if (existingIdx !== -1) {
        student.progressReports[existingIdx] = reportData;
      } else {
        student.progressReports.push(reportData);
      }

      await mockStore.findByIdAndUpdate('students', req.params.studentId, { progressReports: student.progressReports });
      return res.json({ success: true, message: 'Progress report updated!', data: student });
    }

    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const existingIdx = student.progressReports.findIndex((rep) => rep.term === term);
    const reportData = { term, cognitive, social, creative, motorSkills, notes };

    if (existingIdx !== -1) {
      student.progressReports[existingIdx] = reportData;
    } else {
      student.progressReports.push(reportData);
    }

    await student.save();
    res.json({ success: true, message: 'Progress report updated!', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Log child daily activity update
// @route   POST /api/portal/teacher/student/:studentId/activity
// @access  Private (Teacher)
router.post('/teacher/student/:studentId/activity', protect, authorize('teacher'), async (req, res) => {
  const { title, description, category } = req.body; // category: art, food, nap, play, academic
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    if (mockStore.isMock) {
      const student = await mockStore.findById('students', req.params.studentId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      const activity = {
        date: new Date().toISOString().split('T')[0],
        time,
        title,
        description,
        category
      };
      student.activities.unshift(activity); // Add to beginning
      await mockStore.findByIdAndUpdate('students', req.params.studentId, { activities: student.activities });
      return res.json({ success: true, message: 'Activity logged successfully!', data: student });
    }

    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const activity = {
      date: new Date(),
      time,
      title,
      description,
      category
    };

    student.activities.unshift(activity);
    await student.save();
    res.json({ success: true, message: 'Activity logged successfully!', data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
// SHARED MESSAGING SYSTEM ENDPOINTS
// ==========================================

// @desc    Get chat contacts (teachers for parents, parents for teachers)
// @route   GET /api/portal/messages/contacts
// @access  Private
router.get('/messages/contacts', protect, async (req, res) => {
  try {
    if (mockStore.isMock) {
      if (req.user.role === 'parent') {
        const teachers = await mockStore.find('users', { role: 'teacher' });
        return res.json({ success: true, contacts: teachers });
      } else if (req.user.role === 'teacher') {
        const parents = await mockStore.find('users', { role: 'parent' });
        return res.json({ success: true, contacts: parents });
      } else {
        const users = await mockStore.find('users');
        return res.json({ success: true, contacts: users.filter(u => u._id !== req.user._id) });
      }
    }

    if (req.user.role === 'parent') {
      const teachers = await User.find({ role: 'teacher' }).select('name email profileImage');
      res.json({ success: true, contacts: teachers });
    } else if (req.user.role === 'teacher') {
      const parents = await User.find({ role: 'parent' }).select('name email profileImage');
      res.json({ success: true, contacts: parents });
    } else {
      const all = await User.find({ _id: { $ne: req.user._id } }).select('name email role profileImage');
      res.json({ success: true, contacts: all });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get chat history between current user and partner
// @route   GET /api/portal/messages/:partnerId
// @access  Private
router.get('/messages/:partnerId', protect, async (req, res) => {
  const myId = req.user._id.toString();
  const partnerId = req.params.partnerId;

  try {
    if (mockStore.isMock) {
      const allMsgs = await mockStore.find('messages');
      const filtered = allMsgs.filter(
        msg =>
          (msg.senderId.toString() === myId && msg.receiverId.toString() === partnerId) ||
          (msg.senderId.toString() === partnerId && msg.receiverId.toString() === myId)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Mark partner's messages as read
      allMsgs.forEach(msg => {
        if (msg.senderId.toString() === partnerId && msg.receiverId.toString() === myId) {
          msg.isRead = true;
        }
      });

      return res.json({ success: true, data: filtered });
    }

    const chatHistory = await Message.find({
      $or: [
        { senderId: myId, receiverId: partnerId },
        { senderId: partnerId, receiverId: myId }
      ]
    }).sort({ timestamp: 1 });

    // Mark as read
    await Message.updateMany(
      { senderId: partnerId, receiverId: myId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, data: chatHistory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Send a message
// @route   POST /api/portal/messages
// @access  Private
router.post('/messages', protect, async (req, res) => {
  const { receiverId, content } = req.body;

  try {
    if (mockStore.isMock) {
      const msg = await mockStore.create('messages', {
        senderId: req.user._id.toString(),
        receiverId,
        content,
        timestamp: new Date(),
        isRead: false
      });
      return res.status(201).json({ success: true, data: msg });
    }

    const msg = await Message.create({
      senderId: req.user._id,
      receiverId,
      content
    });

    res.status(201).json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
