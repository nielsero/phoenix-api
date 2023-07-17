import { type Request, type Response, type NextFunction } from "express"

const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log("[request-logger]", req.method, req.path)
  console.log("[request-logger]", req.body)
  next()
}

export default requestLogger
