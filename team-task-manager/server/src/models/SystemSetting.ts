import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISystemSetting extends Document {
  key: { type: String; unique: true };
  appName: string;
  allowRegistration: boolean;
  defaultMemberType: 'team_lead' | 'regular_member';
  emailNotifications: boolean;
  taskNotifications: boolean;
  deadlineReminders: boolean;
  maintenanceMode: boolean;
  sessionDays: number;
}

const systemSettingSchema = new Schema<ISystemSetting>({
  key: { type: String, default: 'global', unique: true },
  appName: { type: String, default: 'Team Task Manager' },
  allowRegistration: { type: Boolean, default: true },
  defaultMemberType: { type: String, enum: ['team_lead', 'regular_member'], default: 'regular_member' },
  emailNotifications: { type: Boolean, default: true },
  taskNotifications: { type: Boolean, default: true },
  deadlineReminders: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },
  sessionDays: { type: Number, default: 7 },
});

export const SystemSetting: Model<ISystemSetting> =
  mongoose.models.SystemSetting || mongoose.model<ISystemSetting>('SystemSetting', systemSettingSchema);

export async function getSettings(): Promise<ISystemSetting> {
  let doc = await SystemSetting.findOne({ key: 'global' });
  if (!doc) doc = await SystemSetting.create({ key: 'global' });
  return doc;
}
