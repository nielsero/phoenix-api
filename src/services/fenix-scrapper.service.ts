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

  // Get the names and codes (unformatted) of the courses
  const { names, codes } = await page.evaluate(() => {
    const names: string[] = []
    const codes: string[] = []
    const table: HTMLTableElement | null =
      document.querySelector(".degreeTable")

    if (table === null) throw new Error("No courses table found")

    const rows = Array.from(table.querySelectorAll("tr"))
    for (const row of rows) {
      const cells = Array.from(row.querySelectorAll("td"))
      const name = cells[0].querySelector("a")?.title ?? ""
      const code = cells[1].querySelector("a")?.title ?? ""
      names.push(name)
      codes.push(code)
    }
    return { names, codes }
  })

  // Format the codes
  const formattedCodes = codes.map((code) => formatCourseCode(code))

  // Create the courses
  const courses = names.map((name, index) => ({
    name,
    code: formattedCodes[index]
  }))

  return courses
}

const scrapeCourses = async (page: Page): Promise<void> => {
  console.log("[fenix-scrapper-service] Scraping courses ...")

  const courses = await getCourses(page)
  console.log("[fenix-scrapper-service] Courses scraped:", courses)

  // Populate courses if they don't exist
  courses.forEach(async (course) => {
    try {
      await courseService.create(course.code, course.name)
    } catch (err: any) {
      console.error("[fenix-scrapper-service]", err.message)
    }
  })

  console.log("[fenix-scrapper-service] Finished scraping courses")
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
  const course = await courseService.findByCode(courseCode)
  const courseURL = getCourseUrlFromCode(courseCode)
  await page.goto(courseURL)

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

const scrapeSubjects = async (page: Page): Promise<void> => {
  console.log("[fenix-scrapper-service] Scraping subjects ...")

  const courses = await courseService.getAll()

  courses.forEach(async (course) => {
    try {
      console.log(
        "[fenix-scraper-service] Scraping subjects for course:",
        course.code
      )
      const subjects = await getCourseSubjects(page, course.code)
      console.log("[fenix-scraper-service] Subjects scraped:", subjects)
    } catch (err: any) {
      console.error("[fenix-scraper-service]", err.message)
    }
  })

  console.log("[fenix-scrapper-service] Finished scraping subjects")
}

/**
 * Starts scrapping fenix website for courses, subjects and grades
 */
const start = async (): Promise<void> => {
  console.log("[fenix-scraper-service] Started ...")

  // Initial setup
  puppeteer.use(StealthPlugin()) // avoids bot detection
  const browser: Browser = await puppeteer.launch() // launch the browser
  const page: Page = await browser.newPage() // open a new page

  await authenticateUser(page)
  await scrapeCourses(page)

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

  await browser.close()
  console.log("[fenix-scraper-service] Finished")
}

export default { start }
