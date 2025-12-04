import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import parcelRoutes from './routes/parcels.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Log environment for debugging
console.log('CORS_ORIGIN env:', process.env.CORS_ORIGIN);
console.log('NODE_ENV:', process.env.NODE_ENV);

// CORS configuration - simplified for production
const corsOptions = {
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// Rate limiting configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests, please try again later',
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api/', limiter); // Apply rate limiting to API routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
        },
    });
});

// API routes
app.use('/api/v1', parcelRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Error handler
app.use((err, req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API base: http://localhost:${PORT}/api/v1`);
});