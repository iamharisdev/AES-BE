import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/models',
    dialect: 'postgresql',
    dbCredentials: {
        database: process.env.DATABASE_NAME,
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
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
