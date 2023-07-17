import SubjectModel, { type ISubject } from "../models/subject.model"
import CourseModel from "../models/course.model"

const create = async (
  name: string,
  link: string,
  executionCodeID: string,
  courseID: string = ""
): Promise<ISubject> => {
  const course = await CourseModel.findById(courseID)
  if (course === null) throw new Error("Course not found")

  const subjectExists = await SubjectModel.exists({ executionCodeID })
  if (subjectExists !== null) throw new Error("Subject already exists")

  const subject = await SubjectModel.create({
    name,
    link,
    executionCodeID,
    course: courseID
  })
  return subject
}

export default { create }
