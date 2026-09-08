import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { Priority } from './Project';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export interface IAttachment {
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: Types.ObjectId;
  data?: Buffer;
  uploadedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description: string;
  project: Types.ObjectId;
  assignee?: Types.ObjectId;
  createdBy: Types.ObjectId;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  tags: string[];
  order: number;
  completedAt?: Date;
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    data: { type: Buffer, select: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, default: '', maxlength: 4000 },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['todo', 'in_progress', 'review', 'completed'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    dueDate: { type: Date },
    tags: [{ type: String, trim: true }],
    order: { type: Number, default: 0 },
    completedAt: { type: Date },
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

taskSchema.index({ status: 1 });
taskSchema.index({ dueDate: 1 });

taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'completed' ? new Date() : undefined;
  }
  next();
});

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
