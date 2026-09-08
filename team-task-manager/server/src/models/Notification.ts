import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: 'task_assigned' | 'status_changed' | 'comment' | 'mention' | 'deadline' | 'project' | 'security';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['task_assigned', 'status_changed', 'comment', 'mention', 'deadline', 'project', 'security'],
      default: 'project',
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, read: 1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
