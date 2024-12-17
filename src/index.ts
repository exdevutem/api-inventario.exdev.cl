import { Hono } from 'hono'
import { sessionMiddleware, MemoryStore } from 'hono-sessions'
import {clerkMiddleware, getAuth} from "@hono/clerk-auth";
import {findItemInDatabase, listItemsInDatabase} from "./lib/notion";
import { cors } from 'hono/cors'

type Bindings = {
  NOTION_API_KEY: string;
  FRONTEND_URL: string;
}
const app = new Hono<{ Bindings: Bindings }>()
const memoryStore = new MemoryStore()

app.use('*', cors({
  origin: (origin, c) => {
    const { FRONTEND_URL } = c.env
    if (origin === FRONTEND_URL) {
      return origin
    }
    return ''
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}))
app.use('*', sessionMiddleware({ store: memoryStore }))
app.use('*', clerkMiddleware())
app.get('/', async (c) => {
  const auth = getAuth(c)

  if(!auth?.userId) {
    return c.json({
      message: 'Por favor inicia sesión.'
    }, 401)
  }

  return c.json({
    message: 'Bienvenido a la API de inventario.',
    user: {
      id: auth.userId,
    }
  })
})

app.get('/items', async c => {
  try {
    const { NOTION_API_KEY } = c.env
    const startCursor = c.req.query('startCursor')
    const query = c.req.query('query')
    const items = await listItemsInDatabase({
      apiKey: NOTION_API_KEY,
      startCursor,
      query
    })

    return c.json(items)
  } catch (error: any) {
    return c.json({
      error: error?.message
    }, 500)
  }
})

app.get('/items/:id', async c => {
  const inventoryId = c.req.param('id')
  const startCursor = c.req.query('startCursor')
  const { NOTION_API_KEY } = c.env
  const item = await findItemInDatabase({
    apiKey: NOTION_API_KEY,
    inventoryId,
    startCursor,
  })

  return c.json(item)
})

export default app