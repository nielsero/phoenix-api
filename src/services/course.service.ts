import CourseModel, { type ICourseDocument } from "../models/course.model"

const create = async (code: string, name: string): Promise<ICourseDocument> => {
  if (findByCode(code) !== null) throw new Error("Course already exists")
  const course = await CourseModel.create({ code, name })
  return course
}

const findByCode = async (code: string): Promise<ICourseDocument | null> => {
  const course = await CourseModel.findOne({ code })
  return course
}

const getAll = async (): Promise<ICourseDocument[]> => {
  const courses = await CourseModel.find()
  return courses
}

export default { create, findByCode, getAll }
