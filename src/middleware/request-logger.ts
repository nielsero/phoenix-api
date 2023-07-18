import { type Request, type Response, type NextFunction } from "express"
import logger from "../util/logger"

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  logger.info("request-logger", `${req.method} ${req.path}`)
  logger.info("request-logger", "Request body:")
  console.log(req.body)
  next()
}

export default requestLogger
