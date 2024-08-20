import { OpenAPIHono } from '@hono/zod-openapi'
import { JwtPayload } from './middleware/jwt'

type Variables = {
	jwtPayload: JwtPayload
}

const app = new OpenAPIHono<{ Variables: Variables }>({
	defaultHook: (result, c) => {
		if (!result.success) {
			return c.json(
				{
					ok: false,
					errors: result.error.errors,
				},
				422,
			)
		}
	},
})

export default app
