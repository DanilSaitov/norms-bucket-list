const sum = require('../src/sum');

// Mock example
test('mock function example', () => {
  const mockFn = jest.fn(x => x * 2);
  mockFn(5);
  expect(mockFn).toHaveBeenCalledWith(5);
  expect(mockFn.mock.results[0].value).toBe(10);
});