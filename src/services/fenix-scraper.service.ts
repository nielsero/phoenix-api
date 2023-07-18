import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { type Browser, type Page } from "puppeteer"
import config from "../config"
import { formatCourseCode, getCourseUrlFromCode, getExecutionCourseIDFromLink } from "../util"
import logger from "../util/logger"
import { type ICourse } from "../models/course.model"
import { type ISubject } from "../models/subject.model"
import courseService from "./course.service"
import subjectService from "./subject.service"

const authenticateUser = async (page: Page): Promise<void> => {
  logger.info("fenix-scraper-service", "Authenticating user ...")

  await page.goto(config.fenixLoginURL)

  // Fill in the login form
  await page.type("#username", "test")
  await page.type("#password", config.fenixPassword)

  // After clicking submit we have to wait for the page to load
  await Promise.all([page.waitForNavigation(), page.click("[type='submit']")])

  // If authentication is successful, the user will be redirected to the home page
  await page.waitForSelector("html")
  const pageURL = await page.evaluate(() => location.href.trim())
  if (pageURL !== config.fenixHomeURL) throw new Error("Authentication failed")

  logger.info("fenix-scraper-service", "User authenticated")
}

const getCourses = async (page: Page): Promise<ICourse[]> => {
  await page.goto(config.fenixCoursesURL)

  // Get the names and codes (unformatted) of the courses
  const { names, codes } = await page.evaluate(() => {
    const names: string[] = []
    const codes: string[] = []
    const table: HTMLTableElement | null = document.querySelector(".degreeTable")

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
  logger.info("fenix-scraper-service", "Scraping courses ...")

  const courses = await getCourses(page)
  logger.info("fenix-scraper-service", "Courses scraped:")
  console.log(courses)

  // Populate courses if they don't exist
  courses.forEach(async (course) => {
    try {
      await courseService.create(course.code, course.name)
    } catch (err: any) {
      logger.error("fenix-scraper-service", err.message)
    }
  })

  logger.info("fenix-scraper-service", "Finished scraping courses")
}

const getSubjectExecutionCourseID = async (page: Page, subjectLink: string): Promise<string> => {
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

const getCourseSubjects = async (page: Page, courseCode: string): Promise<ISubject[]> => {
  const course = await courseService.findByCode(courseCode)
  const courseURL = getCourseUrlFromCode(courseCode)
  await page.goto(courseURL)

  if (course === null) throw new Error("Course not found")

  const { names, links } = await page.evaluate(() => {
    const names: string[] = []
    const links: string[] = []
    const tables = Array.from(document.querySelectorAll(".tab_lay"))

    tables.forEach((table) => {
      const rows = Array.from(table.querySelectorAll("tr"))

      rows.forEach((row, index) => {
        if (index === 0) return // ignore first title row
        const cells = Array.from(row.querySelectorAll("td"))
        let name = cells[0]?.querySelector("a")?.textContent?.trim() ?? ""
        let link = cells[0]?.querySelector("a")?.href ?? ""
        if (name !== "" && link !== "") {
          names.push(name)
          links.push(link)
        }

        name = cells[1]?.querySelector("a")?.textContent?.trim() ?? ""
        link = cells[1]?.querySelector("a")?.href ?? ""
        if (name !== "" && link !== "") {
          names.push(name)
          links.push(link)
        }
      })
    })
    return { names, links }
  })

  const subjects: ISubject[] = []

  for (let i = 0; i < names.length; i++) {
    const subjectExists = subjectService.findByLink(links[i])
    if (subjectExists !== null) {
      logger.error("fenix-scraper-service", `Subject ${names[i]} already exists, skipping`)
      continue
    }

    const executionCodeID = await getSubjectExecutionCourseID(page, links[i])
    logger.info("fenix-scraper-service", `Execution course id for subject ${names[i]}: ${executionCodeID}`)
    const subject = {
      name: names[i],
      link: links[i],
      executionCodeID,
      course: course._id
    }
    subjects.push(subject)
  }

  return subjects
}

const scrapeSubjects = async (page: Page): Promise<void> => {
  logger.info("fenix-scraper-service", "Scraping subjects ...")
  const courses = await courseService.getAll()

  for (const course of courses) {
    try {
      logger.info("fenix-scraper-service", `Scraping subjects for course ${course.code} ...`)
      const subjects = await getCourseSubjects(page, course.code)
      logger.info("fenix-scraper-service", `Subjects scraped for course ${course.code}:`)
      console.log(subjects)

      // Populate subjects if they don't exist
      subjects.forEach(async (subject) => {
        try {
          await subjectService.create(
            subject.name,
            subject.link,
            subject.executionCodeID,
            subject.course.toString()
          )
        } catch (err: any) {
          logger.error("fenix-scraper-service", err.message)
        }
      })
    } catch (err: any) {
      logger.error("fenix-scraper-service", err.message)
    }
  }

  logger.info("fenix-scraper-service", "Finished scraping subjects")
}

/**
 * Starts scraping fenix website for courses, subjects and grades
 */
const start = async (): Promise<void> => {
  logger.info("fenix-scraper-service", "Starting ...")

  // Initial setup
  puppeteer.use(StealthPlugin()) // avoids bot detection
  const browser: Browser = await puppeteer.launch({ headless: false })
  const page: Page = await browser.newPage()

  await scrapeCourses(page)
  await new Promise((resolve) => setTimeout(resolve, 2000)) // wait for db to store all courses (it takes time)
  await scrapeSubjects(page)

  try {
    await authenticateUser(page)
  } catch (err: any) {
    logger.error("fenix-scraper-service", err.message)
  }

  await browser.close()
  logger.info("fenix-scraper-service", "Finished")
}

export default { start }