import { model, Schema, type Types, type Document } from "mongoose"

export interface IStudent {
  code: string
  name: string
  course: Types.ObjectId
  subjects: Types.ObjectId[]
}

export interface IStudentDocument extends IStudent, Document {}

const studentSchema = new Schema<IStudent>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  subjects: {
    type: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    default: []
  }
})

const StudentModel = model<IStudentDocument>("Student", studentSchema)

export default StudentModel
