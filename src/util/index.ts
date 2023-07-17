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
export const getCourseUrl = (code: string): string => {
  return `https://fenix.isutc.ac.mz/isutc/cursos/${code}/paginas-de-disciplinas`
}
