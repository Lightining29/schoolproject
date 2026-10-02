import mongoose from 'mongoose';

const FeeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add fee amount']
  },
  term: {
    type: String,
    required: [true, 'Please add term name']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add due date']
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  transactionId: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

FeeSchema.index({ studentId: 1, status: 1 });
FeeSchema.index({ status: 1 });
FeeSchema.index({ dueDate: 1 });
FeeSchema.index({ createdAt: -1 });

export default mongoose.model('Fee', FeeSchema);
