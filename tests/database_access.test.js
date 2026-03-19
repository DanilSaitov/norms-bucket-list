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

        expect(res.status).toBe(400);
        // TODO: unsure if needed.
        expect(data).toEqual({
            error: "Query required"
        });
    });

    test('GET /api/traditions?search where search has a query', async () => {
        const res = await(fetch(`${baseUrl}/api/traditions?search=football`));
        const data = await res.json();

        expect(res.status).toBe(200);
        expect(data[0].title).toEqual("Football game");
    });
});
