import { model, Schema, type Types } from "mongoose"

export interface ICourse {
  code: string
  name: string
  subjects?: Types.ObjectId[]
}

const courseSchema = new Schema<ICourse>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  subjects: {
    type: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    default: []
  }
})

const CourseModel = model<ICourse>("Course", courseSchema)

export default CourseModel
