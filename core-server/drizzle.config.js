import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	schema: './src/models',
	dialect: 'postgresql',
	dbCredentials: {
		database: env.DATABASE_NAME,
		host: env.DATABASE_HOST,
		user: env.DATABASE_USERNAME,
		password: env.DATABASE_PASSWORD,
		port: 5432,
		ssl: 'allow',
	},
	migrations: {
		table: 'migrations',
		schema: 'public',
	},
	verbose: true,
	strict: true,
	out: './migrations',
})
