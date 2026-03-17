import { traditionsSearch } from '../src/controllers/traditionsDbController';
import { Request, Response } from 'express';

describe('tradition db controller', ()=> {
    test('query', async () => {
        const req = {} as Request;
        const res = {} as Response;

        traditionsSearch(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
