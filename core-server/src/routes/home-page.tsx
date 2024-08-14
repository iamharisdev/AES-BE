import app from '@/app'
import { createRoute, z } from '@hono/zod-openapi'
import type { FC } from 'hono/jsx'

const route = createRoute({
	operationId: 'getHomePage',
	tags: ['Health'],
	method: 'get',
	path: '/',
	responses: {
		200: {
			description: 'Can be Used For Heath Checks',
		},
	},
})

const HomeComponent: FC = (props) => {
	return (
		<html>
			<body>
				<h1>Server Is Up</h1>
				<p>
					Visits <a href='/docs'>/docs</a> to visit Swagger Documentation
				</p>
			</body>
		</html>
	)
}

const handler = app.openapi(route, (c) => {
	return c.html(<HomeComponent />)
})

export type HomeRoute = typeof handler

export default route
