import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['fest', 'workshop', 'talk', 'sports', 'cultural', 'hackathon'],
      default: 'fest'
    },
    catLabel: {
      type: String,
      default: 'Tech Fest'
    },
    dateTime: {
      type: String,
      required: true
    },
    rawDate: {
      type: Date,
      default: Date.now
    },
    venue: {
      type: String,
      required: true,
      trim: true
    },
    seatCap: {
      type: Number,
      required: true,
      min: 1
    },
    seatsLeft: {
      type: Number,
      required: true,
      min: 0
    },
    desc: {
      type: String,
      required: true
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    organizerName: {
      type: String,
      default: 'RV University Student Club'
    },
    department: {
      type: String,
      default: 'School of CSE'
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled'],
      default: 'open'
    },
    tags: [
      {
        type: String
      }
    ],
    bannerUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Event = mongoose.model('Event', eventSchema);
export default Event;
