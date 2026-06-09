import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface ISavedStop extends Document {
  userId: string;
  passioStopId: string;
  stopName: string;
  createdAt: Date;
}

const SavedStopSchema = new Schema<ISavedStop>({
  userId: {
    type: String,
    required: true,
    index: true, // This speeds up database queries when finding stops for a specific user
  },
  passioStopId: {
    type: String,
    required: true,
  },
  stopName: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// We check `models.SavedStop` first to prevent Next.js from throwing an OverwriteModelError during hot-reloads
const SavedStop = models.SavedStop || model<ISavedStop>('SavedStop', SavedStopSchema);

export default SavedStop;