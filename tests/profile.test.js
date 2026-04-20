const http = require('http');
const app = require('../src/index');
const prisma = require('../src/config/database');

let server;
let baseUrl;

function extractCookie(res, cookieName) {
    const header = res.headers.get('set-cookie');
    if (!header) return null;
    const match = header.match(new RegExp(`${cookieName}=([^;]+)`));
    return match ? match[1] : null;
}

beforeAll(async () => {
    server = http.createServer(app);
    await new Promise((done) => {
        server.listen(0, () => {
            const { port } = server.address();
            baseUrl = `http://127.0.0.1:${port}`;
            done();
        });
    });

    await prisma.user.deleteMany({
        where: {
            OR: [
                { username: 'profiletest' },
                { email: 'profiletest@charlotte.edu' }
            ]
        }
    });
});

afterAll(async () => {
    await new Promise((done) => server.close(done));
    await prisma.$disconnect();
});

describe('profile update apis', () => {
    let authCookie;

    test('POST /api/auth/signup create profile test user', async () => {
        const res = await fetch(`${baseUrl}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: 'profiletest',
                first_name: 'Profile',
                last_name: 'Tester',
                email: 'profiletest@charlotte.edu',
                password: 'Profile123!',
                graduation_year: '2028'
            })
        });

        const data = await res.json();
        expect(res.status).toBe(201);
        expect(data.user.username).toBe('profiletest');
        expect(data.user.email).toBe('profiletest@charlotte.edu');
    });

    test('POST /api/auth/login returns auth cookie', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: 'profiletest@charlotte.edu',
                password: 'Profile123!'
            })
        });

        const data = await res.json();
        authCookie = extractCookie(res, 'auth_token');

        expect(res.status).toBe(200);
        expect(data.user).toBeDefined();
        expect(authCookie).toBeTruthy();
    });

    test('PATCH /api/auth/me updates username and graduation year', async () => {
        const res = await fetch(`${baseUrl}/api/auth/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cookie': `auth_token=${authCookie}`
            },
            body: JSON.stringify({
                username: 'profileupdated',
                first_name: 'Updated',
                last_name: 'User',
                graduation_year: new Date().getFullYear() + 2
            })
        });

        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.user.username).toBe('profileupdated');
        expect(data.user.first_name).toBe('Updated');
        expect(data.user.last_name).toBe('User');
        expect(data.user.graduation_year).toBe(new Date().getFullYear() + 2);
    });

    test('PATCH /api/auth/password rejects wrong current password', async () => {
        const res = await fetch(`${baseUrl}/api/auth/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cookie': `auth_token=${authCookie}`
            },
            body: JSON.stringify({
                current_password: 'WrongPassword!',
                new_password: 'NewPassword123!'
            })
        });

        const data = await res.json();
        expect(res.status).toBe(401);
        expect(data.error).toBe('Current password is incorrect');
    });

    test('PATCH /api/auth/password updates password successfully', async () => {
        const res = await fetch(`${baseUrl}/api/auth/password`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cookie': `auth_token=${authCookie}`
            },
            body: JSON.stringify({
                current_password: 'Profile123!',
                new_password: 'NewProfile123!'
            })
        });

        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.message).toBe('Password updated successfully');
    });

    test('POST /api/auth/login succeeds with new password', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: 'profiletest@charlotte.edu',
                password: 'NewProfile123!'
            })
        });

        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.user.username).toBe('profileupdated');
    });
});
