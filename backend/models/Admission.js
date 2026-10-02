import mongoose from 'mongoose';

const AdmissionSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  studentDetails: {
    name: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true },
    class: { 
      type: String, 
      required: true,
      enum: ['Pre-Nursery', 'Nursery', 'Junior KG', 'Senior KG', 'Preschool', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
    }
  },
  parentDetails: {
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  documents: {
    birthCertificate: { type: String },
    photo: { type: String },
    parentIdProof: { type: String },
    reportCard: { type: String },
    transferCertificate: { type: String },
    aadhaarCard: { type: String },
    fatherAadhaarCard: { type: String },
    motherAadhaarCard: { type: String },
    addressProofType: { type: String },
    addressProof: { type: String }
  },
  documentData: {
    birthCertificate: { data: Buffer, contentType: String, filename: String },
    photo: { data: Buffer, contentType: String, filename: String },
    parentIdProof: { data: Buffer, contentType: String, filename: String },
    reportCard: { data: Buffer, contentType: String, filename: String },
    transferCertificate: { data: Buffer, contentType: String, filename: String },
    aadhaarCard: { data: Buffer, contentType: String, filename: String },
    fatherAadhaarCard: { data: Buffer, contentType: String, filename: String },
    motherAadhaarCard: { data: Buffer, contentType: String, filename: String },
    addressProof: { data: Buffer, contentType: String, filename: String }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  remarks: {
    type: String,
    default: ''
  },
  submissionDate: {
    type: Date,
    default: Date.now
  }
});

AdmissionSchema.index({ status: 1 });
AdmissionSchema.index({ submissionDate: -1 });

export default mongoose.model('Admission', AdmissionSchema);
