import express from 'express';
import dotenv from 'dotenv';
import { registerUserProfileRoute } from './routes';

dotenv.config();

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// --- CORS SETUP ---
const allowedOrigins = [
  'https://lelekart.com', // Production frontend
  'http://localhost:3000', // Development frontend
  'http://localhost:8081', // React Native Metro bundler
  'http://localhost:19006', // Expo development
];

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV !== 'production') {
      // Allow all origins in development
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  next();
});

registerUserProfileRoute(app);

(async () => {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Root path handler
  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const server = app;

  const port = process.env.PORT || 5000;
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    console.log(`Running in production mode on port ${port}`);
  }
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
  server.listen({
    port: parseInt(port.toString()),
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1',
  }, () => {
    console.log(`Server is running on http://${process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'}:${port}`);
  });
  server.setTimeout(120000);
})(); 