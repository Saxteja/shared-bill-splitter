import { Hono } from 'hono'
import { errorHandler, notFoundHandler } from './middleware/error-handler'
import balanceRoutes from './routes/balances'
import billRoutes from './routes/bills'
import homeRoutes from './routes/home'
import memberRoutes from './routes/members'
import shareRoutes from './routes/shares'

const app = new Hono<{ Bindings: Env }>()

app.onError(errorHandler)
app.notFound(notFoundHandler)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

app.route('/api/homes', homeRoutes)
app.route('/api/homes', memberRoutes)
app.route('/api/homes', billRoutes)
app.route('/api/bills', shareRoutes)
app.route('/api/homes', balanceRoutes)

export default app
