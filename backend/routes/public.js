import express from 'express';
import { generateId } from '../config/modelHelper.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Admission from '../models/Admission.js';
import Announcement from '../models/Announcement.js';
import Gallery from '../models/Gallery.js';
import Event from '../models/Event.js';
import Query from '../models/Query.js';
import mockStore from '../config/mockStore.js';
import { uploadAdmissions } from '../middleware/upload.js';
import { verifyAdmissionDocumentAI } from '../config/aiVerificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 1. ANNOUNCEMENTS
// @desc    Get all announcements
// @route   GET /api/public/announcements
router.get('/announcements', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const list = await mockStore.find('announcements');
      return res.json({ success: true, count: list.length, data: list });
    }
    const list = await Announcement.find().sort({ createdAt: -1 });
    res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GALLERY
// @desc    Get gallery items
// @route   GET /api/public/gallery
router.get('/gallery', async (req, res) => {
  const { category } = req.query;
  try {
    if (mockStore.isMock) {
      let list = await mockStore.find('gallery');
      if (category && category !== 'all') {
        list = list.filter(item => item.category === category);
      }
      const formatted = list.map(item => ({
        ...item,
        url: item.imageData?.data ? `/api/public/gallery/image/${item._id}` : (item.url || `/api/public/gallery/image/${item._id}`)
      }));
      return res.json({ success: true, count: formatted.length, data: formatted });
    }
    const query = category && category !== 'all' ? { category } : {};
    const list = await Gallery.find(query).select('-imageData.data').sort({ date: -1, createdAt: -1 });
    const formatted = list.map(item => {
      const obj = item.toObject();
      return {
        ...obj,
        url: obj.url && (obj.url.startsWith('http') || obj.url.startsWith('/uploads')) 
          ? obj.url 
          : `/api/public/gallery/image/${obj._id}`
      };
    });
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Stream gallery image by ID
// @route   GET /api/public/gallery/image/:id
router.get('/gallery/image/:id', async (req, res) => {
  try {
    let item;
    if (mockStore.isMock) {
      item = await mockStore.findById('gallery', req.params.id);
    } else {
      item = await Gallery.findById(req.params.id);
    }

    if (!item) {
      return res.status(404).send('Gallery item not found');
    }

    // 1. Direct binary data in MongoDB
    if (item.imageData && item.imageData.data) {
      res.set('Content-Type', item.imageData.contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      const buffer = Buffer.isBuffer(item.imageData.data)
        ? item.imageData.data
        : Buffer.from(item.imageData.data, 'base64');
      return res.send(buffer);
    }

    // 2. Relative file on disk
    if (item.url && item.url.startsWith('/uploads/')) {
      const diskPath = path.join(__dirname, '..', item.url);
      if (fs.existsSync(diskPath)) {
        return res.sendFile(diskPath);
      }
    }

    // 3. External HTTP URL
    if (item.url && item.url.startsWith('http')) {
      return res.redirect(item.url);
    }

    return res.status(404).send('Image data not found');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// 3. EVENTS (Calendar)
// @desc    Get school calendar events
// @route   GET /api/public/events
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

// 4. SUBMIT CONTACT QUERY
// @desc    Submit contact query form
// @route   POST /api/public/queries
router.post('/queries', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  try {
    if (mockStore.isMock) {
      const query = await mockStore.create('queries', { name, email, phone, subject, message, status: 'unread' });
      return res.status(201).json({ success: true, message: 'Your message has been sent successfully!', data: query });
    }
    const query = await Query.create({ name, email, phone, subject, message });
    res.status(201).json({ success: true, message: 'Your message has been sent successfully!', data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. SUBMIT ADMISSION FORM
// @desc    Apply for admission
// @route   POST /api/public/admissions/apply
router.post('/admissions/apply', uploadAdmissions.fields([
  { name: 'birthCertificate', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    let { studentDetails, parentDetails } = req.body;
    if (typeof studentDetails === 'string') studentDetails = JSON.parse(studentDetails);
    if (typeof parentDetails === 'string') parentDetails = JSON.parse(parentDetails);

    const appNo = `APN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;

    const birthCertificateFile = req.files?.['birthCertificate']?.[0];
    const photoFile = req.files?.['photo']?.[0];

    const isMock = mockStore.isMock;
    const admissionId = isMock ? 'adm_' + Math.random().toString(36).substr(2, 9) : generateId();

    const makeDocData = (file) => {
      if (!file) return undefined;
      let buf = file.buffer;
      if (!buf && file.path && fs.existsSync(file.path)) {
        try {
          buf = fs.readFileSync(file.path);
        } catch (e) {
          console.error('Error reading upload in public apply:', e);
        }
      }
      if (buf) {
        return {
          data: buf.toString('base64'),
          contentType: file.mimetype || 'image/jpeg',
          filename: file.filename || file.originalname
        };
      }
      return undefined;
    };

    const documents = {
      birthCertificate: birthCertificateFile ? `/api/admin/admissions/document/${admissionId}/birthCertificate` : '',
      photo: photoFile ? `/api/admin/admissions/document/${admissionId}/photo` : '',
      parentIdProof: '',
      reportCard: '',
      transferCertificate: '',
      aadhaarCard: '',
      fatherAadhaarCard: '',
      motherAadhaarCard: '',
      addressProofType: '',
      addressProof: ''
    };

    const documentData = {
      birthCertificate: makeDocData(birthCertificateFile),
      photo: makeDocData(photoFile)
    };

    const parsedDob = studentDetails.dateOfBirth ? new Date(studentDetails.dateOfBirth) : new Date('2022-01-01');

    // Run AI Document & Age Eligibility Verification
    const aiVerification = await verifyAdmissionDocumentAI({
      studentDetails,
      parentDetails
    });

    if (isMock) {
      const admission = await mockStore.create('admissions', {
        _id: admissionId,
        applicationNumber: appNo,
        studentDetails: {
          ...studentDetails,
          dateOfBirth: isNaN(parsedDob.getTime()) ? new Date('2022-01-01') : parsedDob
        },
        parentDetails,
        documents,
        documentData,
        aiVerification,
        status: 'pending',
        remarks: aiVerification.verified ? 'AI Verified: Age & Document Criteria Met' : 'AI Flagged: Requires Manual Age/Document Review',
        submissionDate: new Date()
      });
      return res.status(201).json({ success: true, applicationNumber: appNo, data: admission, aiVerification });
    }

    const admission = await Admission.create({
      _id: admissionId,
      applicationNumber: appNo,
      studentDetails: {
        ...studentDetails,
        dateOfBirth: isNaN(parsedDob.getTime()) ? new Date('2022-01-01') : parsedDob
      },
      parentDetails,
      documents,
      documentData,
      aiVerification,
      status: 'pending',
      remarks: aiVerification.verified ? 'AI Verified: Age & Document Criteria Met' : 'AI Flagged: Requires Manual Age/Document Review',
      submissionDate: new Date()
    });

    res.status(201).json({ success: true, applicationNumber: appNo, data: admission, aiVerification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Live AI Document & Age Eligibility Pre-Check
// @route   POST /api/public/admissions/ai-verify
router.post('/admissions/ai-verify', async (req, res) => {
  try {
    const { studentDetails, parentDetails } = req.body;
    const result = await verifyAdmissionDocumentAI({
      studentDetails: studentDetails || {},
      parentDetails: parentDetails || {}
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. TRACK ADMISSION STATUS
// @desc    Track admission application status
// @route   GET /api/public/admissions/track/:appNo
router.get('/admissions/track/:appNo', async (req, res) => {
  try {
    if (mockStore.isMock) {
      const admission = await mockStore.findOne('admissions', { applicationNumber: req.params.appNo });
      if (!admission) {
        return res.status(404).json({ success: false, message: 'Application number not found' });
      }
      return res.json({ success: true, data: admission });
    }

    const admission = await Admission.findOne({ applicationNumber: req.params.appNo });
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Application number not found' });
    }
    res.json({ success: true, data: admission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
