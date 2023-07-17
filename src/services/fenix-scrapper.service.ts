import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { type Browser, type Page } from "puppeteer"
import config from "../config"
import { formatCourseCode } from "../util"

interface Course {
  code: string
  name: string
}

const authenticateUser = async (page: Page): Promise<void> => {}

const getCourses = async (page: Page): Promise<Course[]> => {
  await page.goto(config.fenixCoursesURL)

  let courses = await page.evaluate(() => {
    const courses: Course[] = []
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

const start = async (): Promise<void> => {
  console.log("[fenix-scraper] Started")

  puppeteer.use(StealthPlugin()) // avoids bot detection
  const browser: Browser = await puppeteer.launch({ headless: false })
  const page: Page = await browser.newPage()
  await authenticateUser(page)

  console.log("[fenix-scrapper] Courses:")
  const courses = await getCourses(page)
  console.log(courses)

  await browser.close()
  console.log("[fenix-scraper] Finished")
}

export default { start }
