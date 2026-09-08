import bcrypt from 'bcryptjs';
import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type Role = 'admin' | 'member';
export type MemberType = 'team_lead' | 'regular_member';

export interface ISession {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  memberType: MemberType | null;
  jobTitle: string;
  avatarColor: string;
  active: boolean;
  lastLogin?: Date;
  notificationPrefs: { email: boolean; tasks: boolean; deadlines: boolean };
  sessions: ISession[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'];

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    memberType: { type: String, enum: ['team_lead', 'regular_member', null], default: null },
    jobTitle: { type: String, default: '', maxlength: 80 },
    avatarColor: { type: String, default: () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)] },
    active: { type: Boolean, default: true },
    lastLogin: { type: Date },
    notificationPrefs: {
      email: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      deadlines: { type: Boolean, default: true },
    },
    sessions: [{ id: String, userAgent: String, ip: String, createdAt: { type: Date, default: Date.now } }],
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
