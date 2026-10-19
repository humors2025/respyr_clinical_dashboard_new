// Local dev runner for the DASHBOARD backend.
// Port 3001 so it can run alongside the app backend (3000) on one machine.
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1';
process.env.DB_PORT = process.env.DB_PORT || '3307';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'respyrpartnersbb';
process.env.DB_SSL = process.env.DB_SSL || 'off';

const app = require('./server');
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Dashboard backend listening on http://localhost:${port}`);
});
