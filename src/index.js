require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Import routes
const authRoutes = require('./routes/authRoutes');
const dbRoutes = require('./routes/traditionsDbRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Middleware
// CORS - Allow frontend dev servers on localhost to communicate with backend
app.use(cors({
	origin: (origin, callback) => {
		// Allow non-browser tools (no Origin header) and localhost/127.0.0.1 dev ports.
		if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
			return callback(null, true);
		}

		return callback(new Error('Not allowed by CORS'));
	},
  credentials: true // Allow cookies to be sent
}));

// Parse JSON request bodies (for POST requests)
app.use(express.json({ limit: '4mb' }));

// Parse cookies from requests
app.use(cookieParser());

// Serve uploaded files (including tradition images) without cache to avoid stale local assets.
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
	etag: false,
	lastModified: false,
	setHeaders: (res) => {
		res.setHeader('Cache-Control', 'no-store');
	},
}));

// API Routes
app.use('/api/auth', authRoutes);

app.use('/api/traditions', dbRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);

// Test route
app.get('/', (req, res) => res.send('Hello from norms-bucket-list'));

app.get('/hello', (req, res) => {
	res.send(`
		<html>
			<head><title>Norm's Bucketlist</title></head>
			<body>
				<h1>Hello from norms-bucket-list</h1>
				<p>Try <a href="/db">/db</a> to see a database-driven page (requires DATABASE_URL).</p>
			</body>
		</html>
	`);
});

app.get('/db', async (req, res) => {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		return res.send('<p>No DATABASE_URL set. Set environment variable to your Postgres connection string.</p>');
	}

	const { Pool } = require('pg');
	const pool = new Pool({ connectionString });
	try {
		// Test connection first
		console.log('Attempting to connect to database...');
		const testResult = await pool.query('SELECT NOW()');
		console.log('Connection successful! Server time:', testResult.rows[0].now);
		
		// create a simple table and seed one row if empty
		await pool.query(`CREATE TABLE IF NOT EXISTS items (id serial PRIMARY KEY, name text)`);
		const countRes = await pool.query('SELECT count(*) FROM items');
		const count = parseInt(countRes.rows[0].count || '0', 10);
		if (count === 0) {
			await pool.query('INSERT INTO items (name) VALUES ($1)', ['Sample item from norms-bucket-list']);
		}
		const { rows } = await pool.query('SELECT id, name FROM items ORDER BY id DESC LIMIT 20');
		const list = rows.map(r => `<li>${r.id}: ${r.name}</li>`).join('');
		res.send(`<h1>DB items</h1><ul>${list}</ul>`);
	} catch (err) {
		console.error('DATABASE ERROR:', err);
		console.error('Error code:', err.code);
		console.error('Error message:', err.message);
		console.error('Error stack:', err.stack);
		res.status(500).send(`<pre>DB error: ${err.message || 'Unknown error'}\nCode: ${err.code || 'N/A'}\n\nConnection string format: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n\nCheck the terminal for full error details.</pre>`);
	} finally {
		try {
			await pool.end();
		} catch (e) {
			console.error('Error closing pool:', e.message);
		}
	}
});

app.listen(port, () => {
	console.log(`Listening on http://localhost:${port}`);
	console.log(`- Home: http://localhost:${port}/`);
	console.log(`- Hello page: http://localhost:${port}/hello`);
	console.log(`- DB page: http://localhost:${port}/db  (requires DATABASE_URL)`);
});

module.exports = app;