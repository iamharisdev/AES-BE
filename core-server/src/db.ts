import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { schema } from '@/models'

const USERNAME = process.env.DATABASE_USERNAME
const PASSWORD = process.env.DATABASE_PASSWORD
const HOST = process.env.DATABASE_HOST
const PORT = process.env.DATABASE_PORT || 5432
const NAME = process.env.DATABASE_NAME

const databaseConnectionString = `postgres://${USERNAME}:${PASSWORD}@${HOST}:${PORT}/${NAME}`

const queryClient = postgres(databaseConnectionString)

export const db = drizzle(queryClient, { schema })
