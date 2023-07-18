const info = (source: string, message: string): void => {
  console.log(`🟩 [${source}] ${message}`)
}

const warn = (source: string, message: string): void => {
  console.warn(`🟨 [${source}] ${message}`)
}

const error = (source: string, message: string): void => {
  console.error(`🟥 [${source}] ${message}`)
}

export default { info, warn, error }
