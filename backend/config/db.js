import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import mockStore from './mockStore.js';
import { wrapModel, generateId } from './modelHelper.js';

// Resolve Hostinger MySQL configuration from environment variables
const dbHost = process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
const dbUser = process.env.DB_USER || process.env.MYSQL_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
const dbName = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'apna_school';
const dbSsl = process.env.DB_SSL === 'true';

// Support full URL if provided (e.g. mysql://user:pass@host:3306/dbname)
const dbUri = process.env.MYSQL_URI || process.env.DATABASE_URL;

export const sequelize = dbUri
  ? new Sequelize(dbUri, {
      dialect: 'mysql',
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: {
        connectTimeout: 60000,
        decimalNumbers: true,
        ...(dbSsl ? { ssl: { rejectUnauthorized: false } } : {})
      }
    })
  : new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: {
        connectTimeout: 60000,
        decimalNumbers: true,
        ...(dbSsl ? { ssl: { rejectUnauthorized: false } } : {})
      }
    });

// ==========================================================
// SEQUELIZE RAW MODEL DEFINITIONS FOR HOSTINGER MYSQL
// ==========================================================

// 1. User
export const UserRaw = sequelize.define('User', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'parent', 'teacher', 'user'), defaultValue: 'user' },
  profileImage: { type: DataTypes.TEXT, defaultValue: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'users',
  timestamps: true
});

UserRaw.beforeCreate(async (user) => {
  if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

UserRaw.beforeUpdate(async (user) => {
  if (user.changed('password') && user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

UserRaw.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 2. Parent
export const ParentRaw = sequelize.define('Parent', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  userId: { type: DataTypes.STRING(64), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  fatherName: { type: DataTypes.STRING(255), defaultValue: '' },
  motherName: { type: DataTypes.STRING(255), defaultValue: '' },
  email: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(50), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  occupation: { type: DataTypes.STRING(255), defaultValue: '' },
  children: { type: DataTypes.JSON, defaultValue: [] },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'parents',
  timestamps: true
});

// 3. Teacher
export const TeacherRaw = sequelize.define('Teacher', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  userId: { type: DataTypes.STRING(64), allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(50), allowNull: false },
  specialization: { type: DataTypes.STRING(255), defaultValue: 'Early Childhood Education' },
  qualifications: { type: DataTypes.TEXT, allowNull: false },
  classesAssigned: { type: DataTypes.JSON, defaultValue: [] },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'teachers',
  timestamps: true
});

// 4. Student
export const StudentRaw = sequelize.define('Student', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  name: { type: DataTypes.STRING(255), allowNull: false },
  studentId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: false },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: false },
  class: { type: DataTypes.STRING(50), allowNull: false },
  parentId: { type: DataTypes.STRING(64), allowNull: false },
  fatherName: { type: DataTypes.STRING(255), defaultValue: '' },
  motherName: { type: DataTypes.STRING(255), defaultValue: '' },
  photo: { type: DataTypes.TEXT, defaultValue: '' },
  photoData: { type: DataTypes.JSON, defaultValue: null },
  teacherId: { type: DataTypes.STRING(64), defaultValue: null },
  attendance: { type: DataTypes.JSON, defaultValue: [] },
  progressReports: { type: DataTypes.JSON, defaultValue: [] },
  activities: { type: DataTypes.JSON, defaultValue: [] },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'students',
  timestamps: true
});

// 5. Fee
export const FeeRaw = sequelize.define('Fee', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  studentId: { type: DataTypes.STRING(64), allowNull: false },
  amount: { type: DataTypes.DOUBLE, allowNull: false },
  term: { type: DataTypes.STRING(255), allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('paid', 'pending', 'overdue', 'partially_paid', 'cancelled'), defaultValue: 'pending' },
  feeType: { type: DataTypes.STRING(50), defaultValue: 'monthly' },
  month: { type: DataTypes.STRING(50), defaultValue: '' },
  year: { type: DataTypes.INTEGER, defaultValue: 2026 },
  discountAmount: { type: DataTypes.DOUBLE, defaultValue: 0 },
  discountReason: { type: DataTypes.STRING(255), defaultValue: '' },
  fineAmount: { type: DataTypes.DOUBLE, defaultValue: 0 },
  fineReason: { type: DataTypes.STRING(255), defaultValue: '' },
  totalPayable: { type: DataTypes.DOUBLE, defaultValue: 0 },
  paidAmount: { type: DataTypes.DOUBLE, defaultValue: 0 },
  remainingAmount: { type: DataTypes.DOUBLE, defaultValue: 0 },
  previousDue: { type: DataTypes.DOUBLE, defaultValue: 0 },
  installments: { type: DataTypes.JSON, defaultValue: [] },
  paymentDate: { type: DataTypes.DATE, defaultValue: null },
  transactionId: { type: DataTypes.STRING(255), defaultValue: '' },
  paymentMethod: { type: DataTypes.STRING(255), defaultValue: '' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'fees',
  timestamps: true
});

// 6. FeeStructure
export const FeeStructureRaw = sequelize.define('FeeStructure', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  class: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  admissionFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  tuitionFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  computerFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  developmentFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  activityFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  smartClassFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  transportFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  examinationFee: { type: DataTypes.DOUBLE, defaultValue: 0 },
  annualCharges: { type: DataTypes.DOUBLE, defaultValue: 0 },
  customFees: { type: DataTypes.JSON, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'fee_structures',
  timestamps: true
});

// 6b. StudentFeeStructure
export const StudentFeeStructureRaw = sequelize.define('StudentFeeStructure', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  studentId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  academicYear: { type: DataTypes.STRING(20), defaultValue: '2026-2027' },
  admissionFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  registrationFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  tuitionFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  monthlyFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: true } },
  examFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  transportFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  hostelFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  libraryFee: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  otherCharges: { type: DataTypes.JSON, defaultValue: { amount: 0, enabled: false } },
  discount: { type: DataTypes.JSON, defaultValue: { amount: 0, reason: '' } },
  fine: { type: DataTypes.JSON, defaultValue: { amount: 0, reason: '' } },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'student_fee_structures',
  timestamps: true
});

// 7. FineRule
export const FineRuleRaw = sequelize.define('FineRule', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  minDays: { type: DataTypes.INTEGER, allowNull: false },
  maxDays: { type: DataTypes.INTEGER, allowNull: false },
  fineAmount: { type: DataTypes.DOUBLE, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'fine_rules',
  timestamps: true
});

// 8. Receipt
export const ReceiptRaw = sequelize.define('Receipt', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  feeId: { type: DataTypes.STRING(64), allowNull: false },
  studentId: { type: DataTypes.STRING(64), allowNull: false },
  receiptNumber: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  amountPaid: { type: DataTypes.DOUBLE, allowNull: false },
  feeType: { type: DataTypes.STRING(50), defaultValue: 'monthly' },
  month: { type: DataTypes.STRING(50), defaultValue: '' },
  amountDue: { type: DataTypes.DOUBLE, defaultValue: 0 },
  discount: { type: DataTypes.DOUBLE, defaultValue: 0 },
  fine: { type: DataTypes.DOUBLE, defaultValue: 0 },
  remainingAmount: { type: DataTypes.DOUBLE, defaultValue: 0 },
  paymentMethod: { type: DataTypes.STRING(255), allowNull: false },
  paymentDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  transactionId: { type: DataTypes.STRING(255), allowNull: false },
  status: { type: DataTypes.ENUM('completed', 'cancelled'), defaultValue: 'completed' },
  createdByAdmin: { type: DataTypes.STRING(100), defaultValue: 'Admin Desk' },
  remarks: { type: DataTypes.TEXT, defaultValue: '' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'receipts',
  timestamps: true
});

// 9. Admission
export const AdmissionRaw = sequelize.define('Admission', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  applicationNumber: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  studentDetails: { type: DataTypes.JSON, allowNull: false },
  parentDetails: { type: DataTypes.JSON, allowNull: false },
  documents: { type: DataTypes.JSON, defaultValue: {} },
  documentData: { type: DataTypes.JSON, defaultValue: {} },
  aiVerification: { type: DataTypes.JSON, defaultValue: null },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'under_review'), defaultValue: 'pending' },
  remarks: { type: DataTypes.TEXT, defaultValue: '' },
  submissionDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'admissions',
  timestamps: true
});

// 10. Announcement
export const AnnouncementRaw = sequelize.define('Announcement', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  title: { type: DataTypes.STRING(255), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING(50), defaultValue: 'general' },
  targetAudience: { type: DataTypes.STRING(50), defaultValue: 'all' },
  attachmentUrl: { type: DataTypes.TEXT, defaultValue: '' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'announcements',
  timestamps: true
});

// 11. Event
export const EventRaw = sequelize.define('Event', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  type: { type: DataTypes.STRING(50), defaultValue: 'celebration' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'events',
  timestamps: true
});

// 12. Gallery
export const GalleryRaw = sequelize.define('Gallery', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  type: { type: DataTypes.STRING(20), defaultValue: 'image' },
  url: { type: DataTypes.TEXT, defaultValue: '' },
  imageData: { type: DataTypes.JSON, defaultValue: null },
  category: { type: DataTypes.STRING(50), defaultValue: 'events' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'gallery',
  timestamps: true
});

// 13. Message
export const MessageRaw = sequelize.define('Message', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  senderId: { type: DataTypes.STRING(64), allowNull: false },
  receiverId: { type: DataTypes.STRING(64), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'messages',
  timestamps: true
});

// 14. Query
export const QueryRaw = sequelize.define('Query', {
  _id: { type: DataTypes.STRING(64), primaryKey: true, defaultValue: generateId },
  name: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(50), defaultValue: '' },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('unread', 'read', 'resolved'), defaultValue: 'unread' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'queries',
  timestamps: true
});

// Wrap raw models with Mongoose-compatible API
export const User = wrapModel(UserRaw);
export const Parent = wrapModel(ParentRaw);
export const Teacher = wrapModel(TeacherRaw);
export const Student = wrapModel(StudentRaw);
export const Fee = wrapModel(FeeRaw);
export const FeeStructure = wrapModel(FeeStructureRaw);
export const StudentFeeStructure = wrapModel(StudentFeeStructureRaw);
export const FineRule = wrapModel(FineRuleRaw);
export const Receipt = wrapModel(ReceiptRaw);
export const Admission = wrapModel(AdmissionRaw);
export const Announcement = wrapModel(AnnouncementRaw);
export const Event = wrapModel(EventRaw);
export const Gallery = wrapModel(GalleryRaw);
export const Message = wrapModel(MessageRaw);
export const Query = wrapModel(QueryRaw);

// Export map of wrapped models
export const getModels = () => ({
  User,
  Parent,
  Teacher,
  Student,
  Fee,
  FeeStructure,
  StudentFeeStructure,
  FineRule,
  Receipt,
  Admission,
  Announcement,
  Event,
  Gallery,
  Message,
  Query
});

// Connect to Hostinger MySQL Database
export const connectDB = async () => {
  try {
    console.log(`Connecting to Hostinger MySQL Database at: ${dbHost}:${dbPort}/${dbName}...`);
    await sequelize.authenticate();
    console.log(`Hostinger MySQL Connection established successfully on ${dbHost}:${dbPort}`);

    // Synchronize all models with Hostinger MySQL tables
    console.log('Synchronizing database schema and tables with Hostinger MySQL...');
    await sequelize.sync({ alter: true });
    console.log('All MySQL tables verified and synchronized successfully.');

    mockStore.isMock = false;
  } catch (error) {
    console.warn('\n==================================================================');
    console.warn('NOTICE: Could not connect to Hostinger MySQL database.');
    console.warn('Reason:', error.message);
    console.warn('------------------------------------------------------------------');
    console.warn('To connect to your Hostinger MySQL database:');
    console.warn('1. Set in backend/.env:');
    console.warn('   DB_HOST=<Your Hostinger MySQL Host or IP, e.g. srvXXXX.hstgr.io>');
    console.warn('   DB_PORT=3306');
    console.warn('   DB_USER=<Your Hostinger MySQL Username, e.g. u123456789_user>');
    console.warn('   DB_PASSWORD=<Your Hostinger MySQL Password>');
    console.warn('   DB_NAME=<Your Hostinger MySQL Database Name, e.g. u123456789_dbname>');
    console.warn('2. In Hostinger hPanel -> Remote MySQL: Add your IP or "%" to allow remote connections.');
    console.warn('------------------------------------------------------------------');
    console.warn('FALLING BACK TO IN-MEMORY STORE: All frontend features, portals,');
    console.warn('and fee payments remain 100% interactive.');
    console.warn('==================================================================\n');
    mockStore.isMock = true;
  }
};
