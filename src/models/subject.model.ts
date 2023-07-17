import { model, Schema, type Types, type Document } from "mongoose"

export interface ISubject {
  name: string
  link: string
  executionCodeID: string
  course?: Types.ObjectId
}

export interface ISubjectDocument extends ISubject, Document {}

const subjectSchema = new Schema<ISubject>({
  name: { type: String, required: true },
  link: { type: String, required: true },
  executionCodeID: { type: String, required: true, unique: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true }
})

const SubjectModel = model<ISubjectDocument>("Subject", subjectSchema)

export default SubjectModel
