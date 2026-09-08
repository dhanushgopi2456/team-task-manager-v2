import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface IActivity extends Document {
  actor: Types.ObjectId;
  action:
    | 'created_project'
    | 'updated_project'
    | 'archived_project'
    | 'deleted_project'
    | 'created_task'
    | 'completed_task'
    | 'updated_task'
    | 'changed_status'
    | 'assigned_task'
    | 'added_comment'
    | 'added_member'
    | 'removed_member'
    | 'joined';
  entityType: 'user' | 'project' | 'task' | 'comment' | 'team';
  entityId?: Types.ObjectId;
  project?: Types.ObjectId;
  meta?: Record<string, any>;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      enum: [
        'created_project',
        'updated_project',
        'archived_project',
        'deleted_project',
        'created_task',
        'completed_task',
        'updated_task',
        'changed_status',
        'assigned_task',
        'added_comment',
        'added_member',
        'removed_member',
        'joined',
      ],
      required: true,
    },
    entityType: { type: String, enum: ['user', 'project', 'task', 'comment', 'team'], required: true },
    entityId: { type: Schema.Types.ObjectId },
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ createdAt: -1 });

export const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', activitySchema);
