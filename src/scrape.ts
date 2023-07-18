import mongoose from "mongoose"
import config from "./config"
import logger from "./util/logger"
import fenixScraperService from "./services/fenix-scraper.service"

mongoose
  .connect(config.mongoURI, { retryWrites: true, w: "majority" })
  .then(async () => {
    logger.info("mongoose", "Connected to database!")
    await fenixScraperService.start()
    await mongoose.connection.close()
    process.exit(0)
  })
  .catch((err) => {
    logger.error("mongoose", err.message)
    process.exit(1)
  })
