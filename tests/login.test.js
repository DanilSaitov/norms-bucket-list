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
    const user = await prisma.user.deleteMany({
      where: {
        OR: [
          { username: "works" },
          { email: "works@charlotte.edu" }
        ]
      }
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

    test('POST /api/auth/signup existingUser', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: "test",
                first_name: "e",
                last_name: "xample",
                email: "test@charlotte.edu",
                password: "example123",
                graduation_year: "2027",
            })
        }));
        const data = await res.json();

        expect(res.status).toBe(409);
    });

    test('POST /api/auth/signup existingUser', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                username: "works",
                first_name: "e",
                last_name: "xample",
                email: "works@charlotte.edu",
                password: "worksworks",
                graduation_year: "2027",
            })
        }));
        const data = await res.json();

        expect(res.status).toBe(201);
        expect(data.user.username).toBe("works");
    });
});

describe('/login login apis', ()=> {
    test('POST /api/auth/login empty fail', async () => {
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

    test('POST /api/auth/login invalid email', async () => {
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

    test('POST /api/auth/login invalid pass', async () => {
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

    test('POST /api/auth/login SUCCESS', async () => {
        const res = await(fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                 email: "test@charlotte.edu",
                password: "testtest",
            })           
        }));
        const data = await res.json();

        console.log("==============================\n" + res.status);
        console.log("==============================\n" + data);
    });
});

