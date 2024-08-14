import { OpenAPIHono } from '@hono/zod-openapi'

const app = new OpenAPIHono({
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
