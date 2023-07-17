import dotenv from "dotenv"

dotenv.config()

export default {
  port: process.env.PORT !== undefined ? process.env.PORT : 5000,
  mongoURI:
    process.env.NODE_ENV === "production"
      ? (process.env.MONGO_URI_PROD as string)
      : (process.env.MONGO_URI_DEV as string),
  fenixUsername: process.env.FENIX_USERNAME,
  fenixPassword: process.env.FENIX_PASSWORD
}
