import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import crawlRouter from './routes/crawl';
import chatRouter from './routes/chat';

const app = express();
const port = process.env.PORT || 3001;

// Register global middlewares
app.use(cors());
app.use(express.json());

// Register API routes
app.use('/api/crawl', crawlRouter);
app.use('/api/chat', chatRouter);

/**
 * Global error-handling middleware.
 * Catches all unhandled router exceptions and sends structured JSON error response.
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Unhandled Express Server Error:', err);
  res.status(500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Start listening for HTTP connections
app.listen(port, () => {
  console.log(`Express server successfully initialized on port ${port}`);
});

