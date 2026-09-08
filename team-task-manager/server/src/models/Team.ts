import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description: string;
  lead: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '' },
    lead: { type: Schema.Types.ObjectId, ref: 'User' },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', teamSchema);
