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
    origin: function (origin, callback) {
        const allowedOrigins = process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : ['http://localhost:5173'];

        console.log('=== CORS DEBUG ===');
        console.log('Incoming origin:', origin);
        console.log('Allowed origins:', allowedOrigins);

        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) {
            console.log('No origin header - allowing request');
            return callback(null, true);
        }

        // TODO: REMOVE THIS
        // Check if origin matches (with or without trailing slash)
        const originWithoutSlash = origin.replace(/\/$/, '');
        console.log('Origin without slash:', originWithoutSlash);

        const isAllowed = allowedOrigins.some(allowed => {
            const allowedWithoutSlash = allowed.replace(/\/$/, '');
            console.log('Comparing with allowed:', allowedWithoutSlash);
            const matches = originWithoutSlash === allowedWithoutSlash;
            console.log('Match result:', matches);
            return matches;
        });

        if (isAllowed) {
            console.log('✓ CORS: Origin allowed');
            callback(null, true);
        } else {
            console.log('✗ CORS: Origin BLOCKED');
            console.log('Blocked origin:', origin);
            console.log('Allowed origins:', allowedOrigins);
            callback(new Error('Not allowed by CORS'));
        }
        console.log('==================');
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
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

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Origin header:', req.headers.origin);
    console.log('Host header:', req.headers.host);
    next();
});

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

// 404 handler - ensure CORS headers are included
app.use((req, res) => {
    console.log('404 - Endpoint not found:', req.method, req.path);
    // CORS headers are already set by the cors middleware above
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
    });
});

// Error handler - ensure CORS headers are included
app.use((err, req, res, _next) => {
    console.error('=== SERVER ERROR ===');
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('Request:', req.method, req.path);
    console.error('Origin:', req.headers.origin);
    console.error('===================');
    // CORS headers are already set by the cors middleware above
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
});

// TODO: remove excessive checks and logging
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API base: http://localhost:${PORT}/api/v1`);
});