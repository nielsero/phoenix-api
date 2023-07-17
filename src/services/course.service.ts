import CourseModel, { type ICourse } from "../models/course.model"

const create = async (code: string, name: string): Promise<ICourse> => {
  if (findByCode(code) !== null) throw new Error("Course already exists")
  const course = await CourseModel.create({ code, name })
  console.log(course)
  return course
}

const findByCode = async (code: string): Promise<ICourse | null> => {
  const course = await CourseModel.findOne({ code })
  return course
}

export default { create, findByCode }
