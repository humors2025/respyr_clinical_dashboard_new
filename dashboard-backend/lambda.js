
'use strict';

// AWS Lambda entry point for DASHBOARD backend.

const serverlessExpress = require('@codegenie/serverless-express');
const app = require('./server');
const pool = require('./db');

// ================================================
// CORS CONFIGURATION
// ================================================

const ALLOWED_ORIGINS = [
    'https://portal.respyr.in',
    'https://www.portal.respyr.in'
];

const getCorsHeaders = (origin) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '300',
    'Vary': 'Origin'
});

// ================================================
// SERVERLESS EXPRESS
// ================================================

const handler = serverlessExpress({
    app,
    binarySettings: {
        contentTypes: [
            'image/*',
            'application/octet-stream',
            'application/pdf',
            'multipart/form-data'
        ]
    },
    logSettings: {
        level: process.env.LOG_LEVEL || 'error'
    }
});

// ================================================
// LAMBDA HANDLER
// ================================================

exports.handler = async (event, context) => {

    context.callbackWaitsForEmptyEventLoop = false;

    const origin =
        event.headers?.origin ||
        event.headers?.Origin ||
        '';

    const method = (
        event.requestContext?.http?.method ||
        event.httpMethod ||
        ''
    ).toUpperCase();

    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin);

    // Handle OPTIONS preflight request.
    if (method === 'OPTIONS') {

        if (!isAllowedOrigin) {
            return {
                statusCode: 403,
                headers: {
                    'Content-Type': 'application/json',
                    'Vary': 'Origin'
                },
                body: JSON.stringify({
                    error: 'Origin not allowed'
                })
            };
        }

        return {
            statusCode: 204,
            headers: getCorsHeaders(origin),
            body: ''
        };
    }

    try {

        // Execute existing Express application.
        const response = await handler(event, context);

        // Add CORS headers for approved origins.
        if (isAllowedOrigin) {
            response.headers = {
                ...(response.headers || {}),
                ...getCorsHeaders(origin)
            };
        }

        return response;

    } catch (error) {

        console.error('Dashboard Lambda error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                ...(isAllowedOrigin
                    ? getCorsHeaders(origin)
                    : { 'Vary': 'Origin' })
            },
            body: JSON.stringify({
                success: false,
                message: 'Internal server error'
            })
        };
    }
};

// ================================================
// MYSQL POOL SHUTDOWN
// ================================================

process.on('SIGTERM', async () => {
    try {
        await pool.end();
    } catch (err) {
        console.error('Error closing MySQL pool:', err);
    }
    process.exit(0);
});
