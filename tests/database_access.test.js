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

describe('tradition db controller', ()=> {
    test('GET /api/traditions?search where search is empty', async () => {
        const res = await(fetch(`${baseUrl}/api/traditions?search=`));
        const data = await res.json();

        expect(data.length).toBe(8);
    });

    test('GET /api/traditions?search where search has a query', async () => {
        const res = await(fetch(`${baseUrl}/api/traditions?search=football`));
        const data = await res.json();

        expect(res.status).toBe(200);
    });


    test('POST upload-image empty', async () => {
        const res = await(fetch(`${baseUrl}/api/traditions/upload-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                empty: "yup its empty"
            })           
        }));

        expect(res.status).toBe(400);
    });

    test('GET /submissions/me/pending empty', async () => {
        const res = await(fetch(`${baseUrl}/api/traditions/submissions/me/pending`));
        const data = res.json();
        expect(data.length).toBe(undefined);
    });

    test('POST create empty', async () => {
        const res = await(fetch(`${baseUrl}/api/traditions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                empty: "yup its empty"
            })           
        }));

        expect(res.status).toBe(400);
    });
    
    test('POST create pass', async () => {
        const res = await(fetch(`${baseUrl}/api/traditions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                title: "test",
                description: "test",
                image: "/uploads/submissions/1775328159640-2025_BEST-UNC-CLT_25001_.jpg",
                tags: "sports"
            })           
        }));

    });

});
