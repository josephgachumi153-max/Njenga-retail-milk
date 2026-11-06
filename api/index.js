import fastify from 'fastify';
import { registerRoutes } from './routes.js';

// Initialize Fastify instance
const app = fastify({ logger: true });

// Register API routes defined in api/routes.ts
app.register(registerRoutes);

// Vercel expects a default export handling (req, res)
export default async function handler(req, res) {
  // Let Fastify handle the incoming request via inject (internal request simulation)
  const result = await app.inject({
    method: req.method,
    url: req.url,
    headers: req.headers,
    payload: req.body,
  });
  // Set response status and headers
  res.statusCode = result.statusCode;
  for (const [key, value] of Object.entries(result.headers)) {
    res.setHeader(key, String(value));
  }
  // Send the payload back to the client
  res.end(result.payload);
}

