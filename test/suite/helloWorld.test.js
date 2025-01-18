const assert = require('assert');

suite('Hello World Test Suite', () => {
    test('hello world!', () => {
        assert.strictEqual('Hello, World!', 'Hello, World!');
    });
});