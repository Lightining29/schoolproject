import bcrypt from 'bcryptjs';

// Seed initial password hash helpers (plain-text passwords are: admin123, parent123, teacher123)
const salt = bcrypt.genSaltSync(10);
const adminEmail = process.env.ADMIN_EMAIL || 'admin@apnaschool.edu';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
const adminHash = bcrypt.hashSync(adminPassword, salt);
const parentHash = bcrypt.hashSync('parent123', salt);
const teacherHash = bcrypt.hashSync('teacher123', salt);

const mockStore = {
  isMock: false, // Will be set to true by db.js if MongoDB is offline

  users: [
    {
      _id: 'usr_admin_1',
      name: 'School Administrator',
      email: adminEmail,
      password: adminHash,
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      createdAt: new Date()
    },
    {
      _id: 'usr_parent_1',
      name: 'Sarah Jenkins',
      email: 'parent@apnaschool.edu',
      password: parentHash,
      role: 'parent',
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      createdAt: new Date()
    },
    {
      _id: 'usr_teacher_1',
      name: 'Miss Emily Stone',
      email: 'teacher@apnaschool.edu',
      password: teacherHash,
      role: 'teacher',
      profileImage: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
      createdAt: new Date()
    }
  ],

  parents: [
    {
      _id: 'prnt_1',
      userId: 'usr_parent_1',
      name: 'Sarah Jenkins',
      email: 'parent@apnaschool.edu',
      phone: '+91 98XXX-XXXXX',
      address: '742 Evergreen Terrace, City Center',
      occupation: 'Pediatrician',
      children: ['std_1'],
      createdAt: new Date()
    }
  ],

  teachers: [
    {
      _id: 'tchr_1',
      userId: 'usr_teacher_1',
      name: 'Miss Emily Stone',
      email: 'teacher@apnaschool.edu',
      phone: '+91 98XXX-XXXXX',
      specialization: 'Early Childhood Education',
      qualifications: 'M.Ed. in Child Development',
      classesAssigned: ['Preschool', 'Nursery', 'Junior KG'],
      createdAt: new Date()
    }
  ],

  students: [
    {
      _id: 'std_1',
      name: 'Tommy Jenkins',
      studentId: 'STD-2026-0001',
      dateOfBirth: '2022-04-12',
      gender: 'Male',
      class: 'Preschool',
      parentId: 'prnt_1',
      teacherId: 'tchr_1',
      attendance: [
        { date: '2026-06-08', status: 'present' },
        { date: '2026-06-09', status: 'present' },
        { date: '2026-06-10', status: 'absent' },
        { date: '2026-06-11', status: 'present' }
      ],
      progressReports: [
        { term: 'Term 1', cognitive: 85, social: 90, creative: 78, motorSkills: 88, notes: 'Tommy is highly curious and loves building blocks.' }
      ],
      activities: [
        { date: '2026-06-11', time: '10:30 AM', title: 'Art & Craft', description: 'Painted a beautiful flower layout.', category: 'art' },
        { date: '2026-06-11', time: '12:00 PM', title: 'Healthy Lunch', description: 'Finished all vegetables and fruit.', category: 'food' },
        { date: '2026-06-11', time: '01:30 PM', title: 'Nap Time', description: 'Slept peacefully for 1 hour.', category: 'nap' }
      ],
      createdAt: new Date()
    },
    {
      _id: 'std_2',
      name: 'Lily Watson',
      studentId: 'STD-2026-0002',
      dateOfBirth: '2021-08-22',
      gender: 'Female',
      class: 'Nursery',
      parentId: 'prnt_2', // Will default map
      teacherId: 'tchr_1',
      attendance: [
        { date: '2026-06-08', status: 'present' },
        { date: '2026-06-09', status: 'present' },
        { date: '2026-06-10', status: 'present' },
        { date: '2026-06-11', status: 'present' }
      ],
      progressReports: [
        { term: 'Term 1', cognitive: 95, social: 88, creative: 92, motorSkills: 85, notes: 'Lily is excellent at drawing and helps other children.' }
      ],
      activities: [
        { date: '2026-06-11', time: '10:00 AM', title: 'Playground Games', description: 'Played tag and slides with peers.', category: 'play' }
      ],
      createdAt: new Date()
    }
  ],

  admissions: [
    {
      _id: 'adm_1001',
      applicationNumber: 'APN-2026-1001',
      studentDetails: { name: 'Aiden Smith', dateOfBirth: '2022-09-15', gender: 'Male', class: 'Pre-Nursery' },
      parentDetails: { fatherName: 'John Smith', motherName: 'Jane Smith', email: 'smith@fake-email.com', phone: '+91 98XXX-XXXXX', address: '123 Main St, City' },
      documents: { birthCertificate: 'mock_birth_cert.pdf', photo: 'mock_photo.jpg' },
      status: 'pending',
      remarks: 'Awaiting birth certificate verification.',
      submissionDate: new Date()
    },
    {
      _id: 'adm_1002',
      applicationNumber: 'APN-2026-1002',
      studentDetails: { name: 'Sophia Grace', dateOfBirth: '2021-11-05', gender: 'Female', class: 'Junior KG' },
      parentDetails: { fatherName: 'Robert Grace', motherName: 'Emma Grace', email: 'grace@fake-email.com', phone: '+91 98XXX-XXXXX', address: '456 Elm St, City' },
      documents: { birthCertificate: 'mock_birth_cert2.pdf', photo: 'mock_photo2.jpg' },
      status: 'approved',
      remarks: 'All documents verified. Admission offered.',
      submissionDate: new Date(Date.now() - 86400000 * 2)
    }
  ],

  announcements: [
    {
      _id: 'ann_1',
      title: 'Summer Vacation Circular 2026',
      content: 'The school will remain closed for summer break starting from June 15th to July 20th. Classes will resume on July 21st with normal timings. Have a safe and happy summer!',
      category: 'circular',
      targetAudience: 'all',
      date: new Date('2026-06-10T10:00:00Z'),
      attachmentUrl: '/assets/documents/summer_vacation_circular.pdf'
    },
    {
      _id: 'ann_2',
      title: 'Parent Teacher Meeting (PTM)',
      content: 'Our monthly Parent Teacher Meeting is scheduled for Saturday, June 13th, from 9:00 AM to 12:30 PM. Please follow the slot timings sent by your respective class teachers.',
      category: 'event',
      targetAudience: 'parents',
      date: new Date('2026-06-11T08:30:00Z')
    },
    {
      _id: 'ann_3',
      title: 'Heavy Rain Warning - School Delayed',
      content: 'Due to warnings of heavy rain and waterlogging tomorrow, school start time is delayed by 2 hours. School buses will pick up children 2 hours later than standard timings.',
      category: 'emergency',
      targetAudience: 'all',
      date: new Date()
    }
  ],

  events: [
    {
      _id: 'ev_1',
      title: 'PTM Meet',
      description: 'Discuss Term 1 children progress and development milestones.',
      startDate: '2026-06-13T09:00:00Z',
      endDate: '2026-06-13T13:00:00Z',
      type: 'ptm'
    },
    {
      _id: 'ev_2',
      title: 'Summer Camp Kickoff',
      description: 'Interactive sports, painting, and music camp for nursery & KG children.',
      startDate: '2026-06-20T08:00:00Z',
      endDate: '2026-06-25T14:00:00Z',
      type: 'celebration'
    },
    {
      _id: 'ev_3',
      title: 'Independence Day Holiday',
      description: 'National holiday celebration and school closed.',
      startDate: '2026-07-04T00:00:00Z',
      endDate: '2026-07-04T23:59:59Z',
      type: 'holiday'
    },
    {
      _id: 'ev_4',
      title: 'Term-1 Examinations',
      description: 'Informal evaluation through educational quizzes and games.',
      startDate: '2026-07-15T09:00:00Z',
      endDate: '2026-07-18T12:00:00Z',
      type: 'exam'
    }
  ],

  gallery: [
    {
      _id: 'gal_1',
      title: 'Annual Day Celebrations',
      description: 'Kids wearing adorable costumes for the theatrical play.',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800',
      category: 'events',
      date: new Date('2026-04-10')
    },
    {
      _id: 'gal_2',
      title: 'Outdoor Fun in the Sandbox',
      description: 'Building sandcastles and learning cooperation.',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800',
      category: 'sports',
      date: new Date('2026-05-18')
    },
    {
      _id: 'gal_3',
      title: 'Little Painters at Work',
      description: 'Expressing creativity in our modern activity rooms.',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800',
      category: 'classroom',
      date: new Date('2026-06-02')
    },
    {
      _id: 'gal_4',
      title: 'Computer Lab Explorers',
      description: 'Children learning basics of computer parts and educational games.',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
      category: 'classroom',
      date: new Date('2026-06-05')
    }
  ],

  fees: [
    {
      _id: 'fee_1',
      studentId: 'std_1',
      amount: 12500,
      term: 'Term 1 (April - June)',
      dueDate: new Date('2026-05-30'),
      status: 'paid',
      paymentDate: new Date('2026-05-28'),
      transactionId: 'TXN-987216439',
      paymentMethod: 'Credit Card'
    },
    {
      _id: 'fee_2',
      studentId: 'std_1',
      amount: 12500,
      term: 'Term 2 (July - Sept)',
      dueDate: new Date('2026-08-30'),
      status: 'pending'
    }
  ],

  receipts: [
    {
      _id: 'rec_1',
      feeId: 'fee_1',
      studentId: 'std_1',
      receiptNumber: 'REC-1718102400000',
      amountPaid: 12500,
      paymentMethod: 'Credit Card',
      paymentDate: new Date('2026-05-28'),
      transactionId: 'TXN-987216439'
    }
  ],

  feeStructures: [
    {
      _id: 'str_1',
      class: 'Nursery',
      admissionFee: 0,
      tuitionFee: 1500,
      computerFee: 200,
      developmentFee: 0,
      activityFee: 100,
      smartClassFee: 0,
      transportFee: 0,
      examinationFee: 0,
      annualCharges: 0,
      customFees: [],
      isActive: true,
      createdAt: new Date()
    },
    {
      _id: 'str_2',
      class: 'LKG',
      admissionFee: 0,
      tuitionFee: 1800,
      computerFee: 200,
      developmentFee: 0,
      activityFee: 100,
      smartClassFee: 0,
      transportFee: 0,
      examinationFee: 0,
      annualCharges: 0,
      customFees: [],
      isActive: true,
      createdAt: new Date()
    },
    {
      _id: 'str_3',
      class: 'Class 1',
      admissionFee: 0,
      tuitionFee: 2500,
      computerFee: 300,
      developmentFee: 0,
      activityFee: 200,
      smartClassFee: 0,
      transportFee: 0,
      examinationFee: 0,
      annualCharges: 0,
      customFees: [],
      isActive: true,
      createdAt: new Date()
    }
  ],

  fineRules: [
    {
      _id: 'fnr_1',
      minDays: 1,
      maxDays: 10,
      fineAmount: 50,
      createdAt: new Date()
    },
    {
      _id: 'fnr_2',
      minDays: 11,
      maxDays: 20,
      fineAmount: 100,
      createdAt: new Date()
    },
    {
      _id: 'fnr_3',
      minDays: 21,
      maxDays: 30,
      fineAmount: 200,
      createdAt: new Date()
    }
  ],

  messages: [
    {
      _id: 'msg_1',
      senderId: 'usr_parent_1',
      receiverId: 'usr_teacher_1',
      content: 'Hello Miss Emily, I noticed Tommy had a bit of sniffles today. Please keep an eye on him during outdoor play.',
      timestamp: new Date(Date.now() - 3600000 * 3),
      isRead: true
    },
    {
      _id: 'msg_2',
      senderId: 'usr_teacher_1',
      receiverId: 'usr_parent_1',
      content: 'Sure Sarah, thank you for letting me know. I will make sure he stays inside the heated play area and stays hydrated.',
      timestamp: new Date(Date.now() - 3600000 * 2),
      isRead: true
    },
    {
      _id: 'msg_3',
      senderId: 'usr_parent_1',
      receiverId: 'usr_teacher_1',
      content: 'Perfect, thank you so much! Let me know if his energy seems low.',
      timestamp: new Date(Date.now() - 3600000 * 1),
      isRead: false
    }
  ],

  queries: [
    {
      _id: 'qr_1',
      name: 'Michael Davis',
      email: 'michael@fake-email.com',
      phone: '+91 98XXX-XXXXX',
      subject: 'Admission Inquiry for KG-1',
      message: 'Hello, I want to know about the admission dates and the bus transport availability for the City area. Thanks!',
      status: 'unread',
      createdAt: new Date()
    }
  ],

  // In-memory helper methods
  async find(collectionName, filter = {}) {
    const list = this[collectionName] || [];
    return list.filter(item => {
      for (let key in filter) {
        if (filter[key] !== undefined && item[key] !== filter[key]) {
          return false;
        }
      }
      return true;
    });
  },

  async findOne(collectionName, filter = {}) {
    const list = await this.find(collectionName, filter);
    return list[0] || null;
  },

  async findById(collectionName, id) {
    const list = this[collectionName] || [];
    return list.find(item => item._id === id) || null;
  },

  async create(collectionName, data) {
    const id = collectionName.slice(0, 3) + '_' + Math.random().toString(36).substr(2, 9);
    const newRecord = { _id: id, ...data, createdAt: new Date() };
    this[collectionName].push(newRecord);
    return newRecord;
  },

  async findByIdAndUpdate(collectionName, id, updates) {
    const item = await this.findById(collectionName, id);
    if (!item) return null;
    Object.assign(item, updates);
    return item;
  },

  async findByIdAndDelete(collectionName, id) {
    const idx = (this[collectionName] || []).findIndex(item => item._id === id);
    if (idx === -1) return null;
    const deleted = this[collectionName].splice(idx, 1);
    return deleted[0];
  }
};

export default mockStore;
