/**
 * Example: "Disciplinas - LCA" => "lca"
 * @param unformatedCode
 * @returns actual code
 */
export const formatCourseCode = (unformatedCode: string): string => {
  return unformatedCode.split(" - ")[1].toLowerCase()
}

/**
 * Example: "lca" => "https://fenix.isutc.ac.mz/isutc/cursos/lca/paginas-de-disciplinas"
 * @param code
 * @returns course url
 */
export const getCourseUrlFromCode = (code: string): string => {
  return `https://fenix.isutc.ac.mz/isutc/cursos/${code}/paginas-de-disciplinas`
}

/**
 * Example: "https://fenix.isutc.ac.mz/isutc/publico/executionCourse.do?method=submitMarks&executionCourseID=281887293571874" => "281887293571874"
 * @param link
 * @returns
 */
export const getExecutionCourseIDFromLink = (link: string): string => {
  return link.split("executionCourseID=")[1]
}

export const getScoreCardsUrlFromExecutionCourseID = (executionCourseID: string): string => {
  return `https://fenix.isutc.ac.mz/isutc/publico/executionCourse.do?method=marks&executionCourseID=${executionCourseID}`
}
