import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface IProjectMember {
  user: Types.ObjectId;
  projectRole: 'lead' | 'member';
  addedAt: Date;
}

export interface IProject extends Document {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  color: string;
  owner: Types.ObjectId;
  members: IProjectMember[];
  startDate: Date;
  deadline?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 2000 },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
      default: 'active',
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    color: { type: String, default: '#6366f1' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        projectRole: { type: String, enum: ['lead', 'member'], default: 'member' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    startDate: { type: Date, default: Date.now },
    deadline: { type: Date },
    tags: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

projectSchema.index({ status: 1 });
projectSchema.index({ 'members.user': 1 });

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', projectSchema);
