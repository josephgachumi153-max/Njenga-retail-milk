import { supabase, supabaseConfigurationMessage } from './lib/supabaseClient.js'

export async function registerRoutes(fastify) {
  const requireSupabase = (reply) => {
    if (supabase) return supabase
    reply.code(503).send({ error: supabaseConfigurationMessage })
    return null
  }

  fastify.get('/api/products', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data: products, error } = await client
      .from('products')
      .select('*, inventory(quantity)')
      .order('name')
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(products)
  })

  fastify.post('/api/products', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('products').insert([req.body])
    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(data)
  })

  fastify.get('/api/inventory/:productId', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { productId } = req.params
    const { data, error } = await client
      .from('inventory')
      .select('quantity, last_stock_count')
      .eq('product_id', productId)
      .single()
    if (error) return reply.code(404).send({ error: error.message })
    return reply.send(data)
  })

  fastify.post('/api/stock/move', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('stock_movements').insert([req.body])
    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(data)
  })

  fastify.get('/api/suppliers', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('suppliers').select('*')
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  fastify.get('/api/categories', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('categories').select('*')
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  fastify.get('/api/purchases', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('purchase_orders').select('*')
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  fastify.post('/api/purchases', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('purchase_orders').insert([req.body])
    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(data)
  })

  fastify.get('/api/sales', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('sales').select('*')
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  fastify.post('/api/sales', async (req, reply) => {
    const client = requireSupabase(reply)
    if (!client) return
    const { data, error } = await client.from('sales').insert([req.body])
    if (error) return reply.code(500).send({ error: error.message })
    return reply.code(201).send(data)
  })
}
