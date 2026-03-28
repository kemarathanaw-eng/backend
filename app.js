import express from 'express';
import { corsOptions } from './src/middlewares/cors.middleware.js';
import { sanitiseInputs } from './src/middlewares/sanitise.middleware.js';
import router from './src/routes/index.js';
import { globalErrorHandler } from './src/utils/errorHandler.js';

const app = express();

app.use(corsOptions);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(...sanitiseInputs);

// Serve frontend static files from public (optional)
app.use(express.static('public'));

// Routes
app.use('api/', router);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Global error handler — MUST be last middleware
app.use(globalErrorHandler);

export default app;
