import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
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
    position: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['waiting', 'promoted', 'cancelled'],
      default: 'waiting'
    },
    userName: {
      type: String
    },
    userUsn: {
      type: String
    },
    userEmail: {
      type: String
    },
    eventTitle: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

waitlistSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const Waitlist = mongoose.model('Waitlist', waitlistSchema);
export default Waitlist;
