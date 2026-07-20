import mongoose from "mongoose"

const mongodbUrl = process.env.MONGODB_URL

if (!mongodbUrl) {
  throw new Error("MONGODB_URL environment variable is not defined")
}

interface MongooseCache {
  conn: mongoose.Connection | null
  promise: Promise<mongoose.Connection> | null
}

let cached: MongooseCache = global.mongooseConnection

if (!cached) {
  cached = global.mongooseConnection = { conn: null, promise: null }
}

const connectDb = async (): Promise<mongoose.Connection> => {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongodbUrl, { dbName: "nexride" })
      .then((c) => c.connection)
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default connectDb
