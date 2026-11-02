import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    ticketCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    qrData: {
      type: String, // Data URL or JSON string encoded in QR
      required: true
    },
    checkedIn: {
      type: Boolean,
      default: false
    },
    checkedInAt: {
      type: Date,
      default: null
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userName: {
      type: String,
      required: true
    },
    userUsn: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    eventTitle: {
      type: String,
      required: true
    },
    eventVenue: {
      type: String,
      required: true
    },
    eventDateTime: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate bookings by the same user for the same event
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
