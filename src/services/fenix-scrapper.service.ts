import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { type Browser, type Page } from "puppeteer"
import config from "../config"
import { formatCourseCode } from "../util"
import { type ICourse } from "../models/course.model"
import courseService from "../services/course.service"

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

/**
 * Starts scrapping fenix website for courses, subjects and grades
 */
const start = async (): Promise<void> => {
  console.log("[fenix-scraper] Started")

  puppeteer.use(StealthPlugin()) // avoids bot detection
  const browser: Browser = await puppeteer.launch({ headless: false })
  const page: Page = await browser.newPage()
  await authenticateUser(page)

  console.log("[fenix-scrapper] Courses:")
  const courses = await getCourses(page)
  console.log(courses)

  courses.forEach(async (course) => {
    try {
      await courseService.create(course.code, course.name)
    } catch (err: any) {
      console.log(err.message)
    }
  })

  await browser.close()
  console.log("[fenix-scraper] Finished")
}

export default { start }
