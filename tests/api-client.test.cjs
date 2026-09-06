const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const vm = require('node:vm');
const output = buildSync({ entryPoints: ['src/services/api-client.ts'], bundle: true, write: false, platform: 'node', format: 'cjs', define: { 'import.meta.env.VITE_API_BASE_URL': '"https://api.example.test"' } }).outputFiles[0].text;
let response; let request; let timeoutCallback;
const context = { exports: {}, module: { exports: {} }, Headers, FormData, AbortController, Error, localStorage: { getItem: () => 'test-token' }, window: { setTimeout: fn => { timeoutCallback = fn; return 1; }, clearTimeout: () => {} }, fetch: async (url, options) => { request = { url, options }; return response; } };
vm.runInNewContext(output, context);
const { apiFetch } = context.module.exports;
test('preserves custom Headers and attaches authentication', async () => {
  response = new Response('{"ok":true}');
  await apiFetch('/api/users', { method: 'POST', body: '{}', headers: new Headers({ 'X-Request-ID': '123' }) });
  assert.equal(request.url, 'https://api.example.test/api/users');
  assert.equal(request.options.headers.get('Authorization'), 'Bearer test-token');
  assert.equal(request.options.headers.get('Content-Type'), 'application/json');
  assert.equal(request.options.headers.get('X-Request-ID'), '123');
});
test('handles empty successful responses', async () => {
  response = new Response(null, { status: 204 }); assert.equal(await apiFetch('/api/sections/s1/students/u1'), undefined);
});
test('surfaces API error messages', async () => {
  response = new Response('{"message":"Section code already exists"}', { status: 400 });
  await assert.rejects(apiFetch('/api/sections'), { message: 'Section code already exists', status: 400 });
});
test('rejects malformed successful responses', async () => {
  response = new Response('<html>Error</html>'); await assert.rejects(apiFetch('/api/users'), /invalid response/);
});
test('does not set a JSON content type for multipart bodies', async () => {
  response = new Response('{}'); await apiFetch('/api/upload', { method: 'POST', body: new FormData() });
  assert.equal(request.options.headers.has('Content-Type'), false);
});
test('aborts timed-out requests with a retryable error', async () => {
  context.fetch = async (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener('abort', () => reject(new Error('Aborted'))); timeoutCallback();
  });
  await assert.rejects(apiFetch('/api/users'), { status: 408 });
});
