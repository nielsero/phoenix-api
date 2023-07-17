import { model, Schema, type Types, type Document } from "mongoose"

export interface ICourse {
  code: string
  name: string
  subjects?: Types.ObjectId[]
}

export interface ICourseDocument extends ICourse, Document {}

const courseSchema = new Schema<ICourse>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  subjects: {
    type: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    default: []
  }
})

const CourseModel = model<ICourseDocument>("Course", courseSchema)

export default CourseModel
