import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IAuditLog extends Document {
  actor?: Types.ObjectId;
  actorName: string;
  action: string;
  targetModel?: string;
  targetId?: Types.ObjectId;
  targetLabel?: string;
  ip?: string;
  userAgent?: string;
  result: 'success' | 'failure';
  meta?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    actorName: { type: String, default: 'System' },
    action: { type: String, required: true, index: true },
    targetModel: { type: String },
    targetId: { type: Schema.Types.ObjectId },
    targetLabel: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    result: { type: String, enum: ['success', 'failure'], default: 'success' },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
