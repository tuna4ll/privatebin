import mongoose, { Schema, Document } from 'mongoose';

export interface IPaste extends Document {
  pasteId: string;
  encryptedContent: string;
  iv: string;
  salt?: string;
  isMarkdown: boolean;
  expiresAt: Date;
  burnAfterReading: boolean;
  createdAt: Date;
}

const PasteSchema: Schema = new Schema({
  pasteId: { type: String, required: true, unique: true, index: true },
  encryptedContent: { type: String, required: true },
  iv: { type: String, required: true },
  salt: { type: String },
  isMarkdown: { type: Boolean, default: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  burnAfterReading: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Paste || mongoose.model<IPaste>('Paste', PasteSchema);
