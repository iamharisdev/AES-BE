import { schema } from '@/models'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from './env'

const USERNAME = env.DATABASE_USERNAME
const PASSWORD = env.DATABASE_PASSWORD
const HOST = env.DATABASE_HOST
const PORT = env.DATABASE_PORT || 5432
const NAME = env.DATABASE_NAME

const databaseConnectionString = `postgres://${USERNAME}:${PASSWORD}@${HOST}:${PORT}/${NAME}`

const queryClient = postgres(databaseConnectionString)

export const db = drizzle(queryClient, { schema })
