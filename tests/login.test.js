const http = require('http');
const app = require('../src/index');
const prisma = require('../src/config/database');

let server;
let baseUrl;

beforeAll(async () => {
    server = http.createServer(app);
    await new Promise((done) => {
        server.listen(0, () => {
            const { port } = server.address();
            baseUrl = `http://127.0.0.1:${port}`;
            done();
        });
    });
});

afterAll(async () => {
    await new Promise((done) => server.close(done) );
    await prisma.$disconnect();
});

describe('signup login apis', ()=> {
    test('POST /api/auth/signup empty fail', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                empty: "yup its empty"
            })           
        }));
        const data = await res.json();

        expect(res.status).toBe(400);
    });

    test('POST /api/auth/signup not @charlotte.edu', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: "example",
                first_name: "e",
                last_name: "xample",
                email: "example@a.com",
                password: "example123",
                graduation_year: "2027",
            })
        }));
        const data = await res.json();

        expect(res.status).toBe(400);
    });
});

describe('/login login apis', ()=> {
    test('POST /api/auth/signup empty fail', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: "example",
                graduation_year: "2027",
            })
        }));
        const data = await res.json();
        expect(res.status).toBe(400);
    });

    test('POST /api/auth/signup invalid email', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: "example@a.com",
                password: "example123",
            })           
        }));
        const data = await res.json();
        expect(res.status).toBe(401);
    });

    test('POST /api/auth/signup invalid pass', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                 email: "example@charlotte.edu",
                password: "wrong",
            })           
        }));
        const data = await res.json();
        expect(res.status).toBe(401);
    });
});

