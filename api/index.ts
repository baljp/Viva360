// Vercel Serverless Function Entry Point
// This file wraps the Express app for Vercel's serverless environment

// Important: Import order matters! Environment must be loaded first
import '../backend/src/lib/env';

// Import the Express app
import app from '../backend/src/app';

// Export as default for Vercel
export default app;
