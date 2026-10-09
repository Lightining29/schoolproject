import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists safely
const uploadDir = path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('Notice: Could not create uploads directory synchronously:', e.message);
}

// Disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (e) {}
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname || '.jpg'));
  }
});

// File filters
const galleryFilter = (req, file, cb) => {
  const allowedTypes = ['.png', '.jpg', '.jpeg', '.webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (allowedTypes.includes(ext) || file.mimetype?.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, JPEG, PNG, and WEBP images are allowed for the gallery'), false);
  }
};

const admissionsFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
  if (allowedExts.includes(ext) || file.mimetype?.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Only PDF, JPG, JPEG, and PNG files are allowed.`), false);
  }
};

const memoryStorage = multer.memoryStorage();

export const uploadGallery = multer({
  storage,
  fileFilter: galleryFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Use memoryStorage for admissions so buffers are directly available to save into Hostinger MySQL
export const uploadAdmissions = multer({
  storage: memoryStorage,
  fileFilter: admissionsFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});
