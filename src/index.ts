import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction
} from "express"
import mongoose from "mongoose"
import config from "./config"
import requestLogger from "./middleware/requestLogger"

mongoose
  .connect(config.mongoURI, { retryWrites: true, w: "majority" })
  .then(() => {
    console.log("[mongoose] Connected to database!")

    const app: Application = express()
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    app.use(requestLogger)

    app.use("/health", (req: Request, res: Response, next: NextFunction) => {
      res.status(200).json({ status: "OK" })
    })

    app.listen(config.port, () => {
      console.log(`[express] Server is listening on port ${config.port}!`)
    })
  })
  .catch((err) => {
    console.log("[mongoose] Error connecting to database:")
    console.log(err)
  })
