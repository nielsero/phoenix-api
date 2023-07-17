import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { type Browser, type Page } from "puppeteer"
import config from "../config"
import {
  formatCourseCode,
  getCourseUrlFromCode,
  getExecutionCourseIDFromLink
} from "../util"
import { type ICourse } from "../models/course.model"
import { type ISubject } from "../models/subject.model"
import courseService from "../services/course.service"
import subjectService from "../services/subject.service"

const authenticateUser = async (page: Page): Promise<void> => {}

const getCourses = async (page: Page): Promise<ICourse[]> => {
  await page.goto(config.fenixCoursesURL)

  let courses = await page.evaluate(() => {
    const courses: ICourse[] = []
    const table: HTMLTableElement | null =
      document.querySelector(".degreeTable")

    if (table === null) return []

    const rows = Array.from(table.querySelectorAll("tr"))
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td"))
      const name = cells[0].querySelector("a")?.title ?? ""
      const code = cells[1].querySelector("a")?.title ?? ""
      courses.push({ code, name })
    }
    return courses
  })

  courses = courses.map((course) => ({
    code: formatCourseCode(course.code),
    name: course.name
  }))

  return courses
}

const getSubjectExecutionCourseID = async (
  page: Page,
  subjectLink: string
): Promise<string> => {
  await page.goto(subjectLink)

  const link = await page.evaluate(() => {
    const latnav = document.querySelector("#latnav")
    const lists = latnav?.querySelectorAll("ul")
    if (lists == null) throw new Error("No lists found in #latnav")
    const lastList = lists[lists.length - 1]
    const link = lastList?.querySelector("a")?.href ?? ""
    return link
  })

  return getExecutionCourseIDFromLink(link)
}

const getCourseSubjects = async (
  page: Page,
  courseCode: string
): Promise<ISubject[]> => {
  const courseURL = getCourseUrlFromCode(courseCode)
  await page.goto(courseURL)

  const course = await courseService.findByCode(courseCode)
  if (course === null) throw new Error("Course not found")

  const subjects: ISubject[] = await page.evaluate(() => {
    const subjects: ISubject[] = []
    const tables = Array.from(document.querySelectorAll(".tab_lay"))

    for (const table of tables) {
      const rows = Array.from(table.querySelectorAll("tr"))

      rows.forEach((row, index) => {
        if (index === 0) return // ignore first title row
        const cells = Array.from(row.querySelectorAll("td"))
        let name = cells[0]?.querySelector("a")?.textContent?.trim() ?? ""
        let link = cells[0]?.querySelector("a")?.href ?? ""
        if (name !== "" && link !== "")
          subjects.push({
            name,
            link,
            executionCodeID: ""
          })

        name = cells[1]?.querySelector("a")?.textContent?.trim() ?? ""
        link = cells[1]?.querySelector("a")?.href ?? ""
        if (name !== "" && link !== "")
          subjects.push({
            name,
            link,
            executionCodeID: ""
          })
      })
    }
    return subjects
  })

  for (const subject of subjects) {
    subject.course = course._id
    subject.executionCodeID = await getSubjectExecutionCourseID(
      page,
      subject.link
    )
  }

  console.log("subjects:", subjects)
  return subjects
}

/**
 * Starts scrapping fenix website for courses, subjects and grades
 */
const start = async (): Promise<void> => {
  console.log("[fenix-scraper] Started")

  puppeteer.use(StealthPlugin()) // avoids bot detection
  const browser: Browser = await puppeteer.launch()
  const page: Page = await browser.newPage()
  await authenticateUser(page)

  console.log("[fenix-scrapper] Courses:")
  const courses = await getCourses(page)

  // Populate courses if they don't exist
  courses.forEach(async (course) => {
    try {
      await courseService.create(course.code, course.name)
    } catch (err: any) {
      console.log(err.message)
    }
  })

  const actualCourses = await courseService.getAll()
  console.log("actualCourses", actualCourses)

  for (const course of actualCourses) {
    console.log("course:", course)
    const subjects = await getCourseSubjects(page, course.code)

    for (const subject of subjects) {
      try {
        await subjectService.create(
          subject.name,
          subject.link,
          subject.executionCodeID,
          subject.course?.toString()
        )
      } catch (err: any) {
        console.log(err.message)
      }
    }
  }

  const subjects = await getCourseSubjects(page, courses[0].code)
  console.log(subjects)

  await browser.close()
  console.log("[fenix-scraper] Finished")
}

export default { start }
