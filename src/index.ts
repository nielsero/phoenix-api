import express, { type Application, type Request, type Response, type NextFunction } from "express"
import mongoose from "mongoose"
import config from "./config"
import logger from "./util/logger"
import requestLogger from "./middleware/request-logger"
import fenixScraperService from "./services/fenix-scraper.service"

mongoose
  .connect(config.mongoURI, { retryWrites: true, w: "majority" })
  .then(() => {
    logger.info("mongoose", "Connected to database!")

    const app: Application = express()
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    app.use(requestLogger)

    app.use("/health", async (req: Request, res: Response, next: NextFunction) => {
      res.status(200).json({ status: "OK" })
      await fenixScraperService.start()
    })

    app.listen(config.port, () => {
      logger.info("express", `Server is listening on port ${config.port}!`)
    })
  })
  .catch((err) => {
    logger.error("mongoose", err.message)
  })
