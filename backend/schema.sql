-- ==============================================================================
-- Apna School Kindergarten Management System
-- Hostinger MySQL Database Schema & Initial Data
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'parent', 'teacher', 'user') NOT NULL DEFAULT 'user',
  `profileImage` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Parents Table
CREATE TABLE IF NOT EXISTS `parents` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `fatherName` VARCHAR(255) DEFAULT '',
  `motherName` VARCHAR(255) DEFAULT '',
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `address` TEXT NOT NULL,
  `occupation` VARCHAR(255) DEFAULT '',
  `children` JSON NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_parents_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Teachers Table
CREATE TABLE IF NOT EXISTS `teachers` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `userId` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `specialization` VARCHAR(255) DEFAULT 'Early Childhood Education',
  `qualifications` TEXT NOT NULL,
  `classesAssigned` JSON NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_teachers_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Students Table
CREATE TABLE IF NOT EXISTS `students` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL UNIQUE,
  `dateOfBirth` DATE NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `class` VARCHAR(50) NOT NULL,
  `parentId` VARCHAR(64) NOT NULL,
  `fatherName` VARCHAR(255) DEFAULT '',
  `motherName` VARCHAR(255) DEFAULT '',
  `photo` TEXT NULL,
  `photoData` JSON NULL,
  `teacherId` VARCHAR(64) NULL,
  `attendance` JSON NULL,
  `progressReports` JSON NULL,
  `activities` JSON NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_students_class` (`class`),
  INDEX `idx_students_parentId` (`parentId`),
  INDEX `idx_students_teacherId` (`teacherId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Fees Invoices Table
CREATE TABLE IF NOT EXISTS `fees` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `studentId` VARCHAR(64) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `term` VARCHAR(255) NOT NULL,
  `dueDate` DATETIME NOT NULL,
  `status` ENUM('paid', 'pending', 'overdue', 'partially_paid', 'cancelled') NOT NULL DEFAULT 'pending',
  `feeType` VARCHAR(50) DEFAULT 'monthly',
  `month` VARCHAR(50) DEFAULT '',
  `year` INT DEFAULT 2026,
  `discountAmount` DOUBLE DEFAULT 0,
  `discountReason` VARCHAR(255) DEFAULT '',
  `fineAmount` DOUBLE DEFAULT 0,
  `fineReason` VARCHAR(255) DEFAULT '',
  `totalPayable` DOUBLE DEFAULT 0,
  `paidAmount` DOUBLE DEFAULT 0,
  `remainingAmount` DOUBLE DEFAULT 0,
  `previousDue` DOUBLE DEFAULT 0,
  `installments` JSON NULL,
  `paymentDate` DATETIME NULL,
  `transactionId` VARCHAR(255) DEFAULT '',
  `paymentMethod` VARCHAR(255) DEFAULT '',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_fees_studentId` (`studentId`),
  INDEX `idx_fees_status` (`status`),
  INDEX `idx_fees_dueDate` (`dueDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Fee Structures Table (Class-level Defaults)
CREATE TABLE IF NOT EXISTS `fee_structures` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `class` VARCHAR(50) NOT NULL UNIQUE,
  `admissionFee` DOUBLE DEFAULT 0,
  `tuitionFee` DOUBLE DEFAULT 0,
  `computerFee` DOUBLE DEFAULT 0,
  `developmentFee` DOUBLE DEFAULT 0,
  `activityFee` DOUBLE DEFAULT 0,
  `smartClassFee` DOUBLE DEFAULT 0,
  `transportFee` DOUBLE DEFAULT 0,
  `examinationFee` DOUBLE DEFAULT 0,
  `annualCharges` DOUBLE DEFAULT 0,
  `customFees` JSON NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6b. Student Fee Structures Table (Individual Student Specific Structure)
CREATE TABLE IF NOT EXISTS `student_fee_structures` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `studentId` VARCHAR(64) NOT NULL UNIQUE,
  `academicYear` VARCHAR(20) DEFAULT '2026-2027',
  `admissionFee` JSON NULL,
  `registrationFee` JSON NULL,
  `tuitionFee` JSON NULL,
  `monthlyFee` JSON NULL,
  `examFee` JSON NULL,
  `transportFee` JSON NULL,
  `hostelFee` JSON NULL,
  `libraryFee` JSON NULL,
  `otherCharges` JSON NULL,
  `discount` JSON NULL,
  `fine` JSON NULL,
  `notes` TEXT NULL,
  `isActive` BOOLEAN DEFAULT TRUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_student_fee_structures_studentId` (`studentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Fine Rules Table
CREATE TABLE IF NOT EXISTS `fine_rules` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `minDays` INT NOT NULL,
  `maxDays` INT NOT NULL,
  `fineAmount` DOUBLE NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Receipts Table
CREATE TABLE IF NOT EXISTS `receipts` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `feeId` VARCHAR(64) NOT NULL,
  `studentId` VARCHAR(64) NOT NULL,
  `receiptNumber` VARCHAR(255) NOT NULL UNIQUE,
  `amountPaid` DOUBLE NOT NULL,
  `feeType` VARCHAR(50) DEFAULT 'monthly',
  `month` VARCHAR(50) DEFAULT '',
  `amountDue` DOUBLE DEFAULT 0,
  `discount` DOUBLE DEFAULT 0,
  `fine` DOUBLE DEFAULT 0,
  `remainingAmount` DOUBLE DEFAULT 0,
  `paymentMethod` VARCHAR(255) NOT NULL,
  `paymentDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `transactionId` VARCHAR(255) NOT NULL,
  `status` ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
  `createdByAdmin` VARCHAR(100) DEFAULT 'Admin Desk',
  `remarks` TEXT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_receipts_feeId` (`feeId`),
  INDEX `idx_receipts_studentId` (`studentId`),
  INDEX `idx_receipts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Admissions Applications Table
CREATE TABLE IF NOT EXISTS `admissions` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `applicationNumber` VARCHAR(100) NOT NULL UNIQUE,
  `studentDetails` JSON NOT NULL,
  `parentDetails` JSON NOT NULL,
  `documents` JSON NULL,
  `documentData` JSON NULL,
  `aiVerification` JSON NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'under_review') NOT NULL DEFAULT 'pending',
  `remarks` TEXT NULL,
  `submissionDate` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_admissions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Announcements Table
CREATE TABLE IF NOT EXISTS `announcements` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` VARCHAR(50) DEFAULT 'general',
  `targetAudience` VARCHAR(50) DEFAULT 'all',
  `attachmentUrl` TEXT NULL,
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Events Calendar Table
CREATE TABLE IF NOT EXISTS `events` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `startDate` DATETIME NOT NULL,
  `endDate` DATETIME NOT NULL,
  `type` VARCHAR(50) DEFAULT 'celebration',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Gallery Table
CREATE TABLE IF NOT EXISTS `gallery` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `type` VARCHAR(20) DEFAULT 'image',
  `url` TEXT NULL,
  `imageData` JSON NULL,
  `category` VARCHAR(50) DEFAULT 'events',
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Messages Table
CREATE TABLE IF NOT EXISTS `messages` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `senderId` VARCHAR(64) NOT NULL,
  `receiverId` VARCHAR(64) NOT NULL,
  `content` TEXT NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `isRead` BOOLEAN DEFAULT FALSE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_messages_senderId` (`senderId`),
  INDEX `idx_messages_receiverId` (`receiverId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Contact Queries Table
CREATE TABLE IF NOT EXISTS `queries` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT '',
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('unread', 'read', 'resolved') DEFAULT 'unread',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Cash Desk Transactions Table
CREATE TABLE IF NOT EXISTS `cash_desk_transactions` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `transactionId` VARCHAR(100) NOT NULL UNIQUE,
  `date` DATE NOT NULL,
  `time` VARCHAR(20) NOT NULL,
  `type` ENUM('collection', 'expense', 'refund', 'adjustment') NOT NULL DEFAULT 'collection',
  `category` VARCHAR(50) NOT NULL DEFAULT 'Monthly Fee',
  `studentId` VARCHAR(64) NULL,
  `studentName` VARCHAR(255) NULL,
  `feeId` VARCHAR(64) NULL,
  `receiptId` VARCHAR(64) NULL,
  `paymentMethod` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `amount` DOUBLE NOT NULL,
  `referenceNumber` VARCHAR(100) NULL,
  `collectedBy` VARCHAR(100) NOT NULL DEFAULT 'Admin Desk',
  `notes` TEXT NULL,
  `status` ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cdt_date` (`date`),
  INDEX `idx_cdt_type` (`type`),
  INDEX `idx_cdt_studentId` (`studentId`),
  INDEX `idx_cdt_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Cash Desk Daily Closings Table
CREATE TABLE IF NOT EXISTS `cash_desk_closings` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `closingDate` DATE NOT NULL UNIQUE,
  `openingCash` DOUBLE NOT NULL DEFAULT 0,
  `totalCashCollected` DOUBLE NOT NULL DEFAULT 0,
  `totalUpiCollected` DOUBLE NOT NULL DEFAULT 0,
  `totalCardCollected` DOUBLE NOT NULL DEFAULT 0,
  `totalBankCollected` DOUBLE NOT NULL DEFAULT 0,
  `totalDigitalCollected` DOUBLE NOT NULL DEFAULT 0,
  `totalExpenses` DOUBLE NOT NULL DEFAULT 0,
  `totalRefunds` DOUBLE NOT NULL DEFAULT 0,
  `expectedCash` DOUBLE NOT NULL DEFAULT 0,
  `actualCash` DOUBLE NOT NULL DEFAULT 0,
  `discrepancy` DOUBLE NOT NULL DEFAULT 0,
  `discrepancyReason` TEXT NULL,
  `closedBy` VARCHAR(100) NOT NULL DEFAULT 'Admin Desk',
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'closed',
  `notes` TEXT NULL,
  `closedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cdc_date` (`closingDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Fee Reminders & Notification Logs Table
CREATE TABLE IF NOT EXISTS `fee_reminders` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `studentId` VARCHAR(64) NOT NULL,
  `studentName` VARCHAR(255) NOT NULL,
  `parentName` VARCHAR(255) NULL,
  `parentEmail` VARCHAR(255) NULL,
  `parentPhone` VARCHAR(50) NULL,
  `feeId` VARCHAR(64) NULL,
  `month` VARCHAR(50) NULL,
  `amountDue` DOUBLE NOT NULL DEFAULT 0,
  `reminderType` ENUM('upcoming', 'due_today', 'overdue', 'custom') NOT NULL DEFAULT 'due_today',
  `channel` ENUM('email', 'sms', 'whatsapp', 'in_app') NOT NULL DEFAULT 'in_app',
  `message` TEXT NOT NULL,
  `scheduledFor` DATETIME NULL,
  `sentAt` DATETIME NULL,
  `status` ENUM('PENDING', 'SENT', 'DELIVERED', 'FAILED') NOT NULL DEFAULT 'SENT',
  `providerResponse` TEXT NULL,
  `failureReason` TEXT NULL,
  `sentBy` VARCHAR(100) NOT NULL DEFAULT 'Automated System',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_rem_studentId` (`studentId`),
  INDEX `idx_rem_status` (`status`),
  INDEX `idx_rem_type` (`reminderType`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Audit Logs Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL DEFAULT 'FINANCE',
  `performedBy` VARCHAR(100) NOT NULL DEFAULT 'Admin',
  `performedByRole` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `targetEntity` VARCHAR(50) NOT NULL,
  `targetId` VARCHAR(64) NULL,
  `details` TEXT NULL,
  `changes` JSON NULL,
  `ipAddress` VARCHAR(50) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_category` (`category`),
  INDEX `idx_audit_target` (`targetEntity`, `targetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

