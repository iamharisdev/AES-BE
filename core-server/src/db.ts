import { tables } from '@/models'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from './env'

const USERNAME = env.DATABASE_USERNAME
const PASSWORD = env.DATABASE_PASSWORD
const HOST = env.DATABASE_HOST
const PORT = env.DATABASE_PORT || 5432
const NAME = env.DATABASE_NAME

const databaseConnectionString = `postgres://${USERNAME}:${PASSWORD}@${HOST}:${PORT}/${NAME}`

const queryClient = postgres(databaseConnectionString, {
	idle_timeout: 20, // Increase idle timeout
	connect_timeout: 30, // Increase connection timeout
})

export const db = drizzle(queryClient, { schema: tables })
