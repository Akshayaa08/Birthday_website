import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.OWNER_PASSWORD = 'owner-test-password-long';
process.env.BOYFRIEND_PASSWORD = 'boyfriend-test-password-long';
process.env.SESSION_SECRET = 'test-session-secret-that-is-long-enough-to-sign-tokens';
process.env.CLIENT_URL = 'http://localhost:5173';
mongoose.set('bufferTimeoutMS', 250);

const { default: app } = await import('../server.js');

const server = app.listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
process.env.CLIENT_URL = baseUrl;

after(() => new Promise((resolve, reject) => {
  server.closeAllConnections();
  server.close((error) => error ? reject(error) : resolve());
}));

async function login(role, password, usernameOverride) {
  const username = usernameOverride || (role === 'OWNER' ? 'CAZOMON' : role === 'BOYFRIEND' ? 'RASAGULLA' : role);
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: process.env.CLIENT_URL },
    body: JSON.stringify({ username, password }),
  });
  const cookie = response.headers.get('set-cookie')?.split(';')[0] || '';
  return { response, cookie };
}

test('server authenticates account names and rejects cross-role access', async () => {
  const anonymous = await fetch(`${baseUrl}/api/admin/activity`);
  assert.equal(anonymous.status, 401);

  const emptyUsername = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: process.env.CLIENT_URL },
    body: JSON.stringify({ username: '', password: 'not-empty' }),
  });
  assert.equal(emptyUsername.status, 400);

  const emptyPassword = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: process.env.CLIENT_URL },
    body: JSON.stringify({ username: 'CAZOMON', password: '' }),
  });
  assert.equal(emptyPassword.status, 400);

  const missingAccount = await login('NOT_AN_ACCOUNT', 'wrong-password');
  assert.equal(missingAccount.response.status, 401);
  assert.deepEqual(await missingAccount.response.json(), { error: 'Username or password is incorrect.' });

  const badLogin = await login('OWNER', 'wrong-password');
  assert.equal(badLogin.response.status, 401);

  const owner = await login('OWNER', process.env.OWNER_PASSWORD);
  assert.equal(owner.response.status, 200);
  assert.match(owner.response.headers.get('set-cookie'), /HttpOnly/i);
  const restoredOwner = await fetch(`${baseUrl}/auth/me`, { headers: { Cookie: owner.cookie } });
  assert.deepEqual((await restoredOwner.json()).user, {
    userId: 'owner',
    role: 'OWNER',
    username: 'System',
  });
  const ownerVideo = await fetch(`${baseUrl}/api/videos/1`, { headers: { Cookie: owner.cookie } });
  assert.equal(ownerVideo.status, 200);
  const ownerActivity = await fetch(`${baseUrl}/api/admin/activity`, { headers: { Cookie: owner.cookie } });
  assert.equal(ownerActivity.status, 500);

  const logout = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: { Origin: process.env.CLIENT_URL, Cookie: owner.cookie },
  });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/i);

  const boyfriend = await login('BOYFRIEND', process.env.BOYFRIEND_PASSWORD);
  assert.equal(boyfriend.response.status, 200);
  const restoredBoyfriend = await fetch(`${baseUrl}/auth/me`, { headers: { Cookie: boyfriend.cookie } });
  assert.deepEqual((await restoredBoyfriend.json()).user, {
    userId: 'boyfriend',
    role: 'BOYFRIEND',
    username: 'My Love',
  });
  assert.equal((await fetch(`${baseUrl}/api/day/1`, { headers: { Cookie: boyfriend.cookie } })).status, 200);
  const boyfriendVideo = await fetch(`${baseUrl}/api/videos/1`, { headers: { Cookie: boyfriend.cookie } });
  assert.equal(boyfriendVideo.status, 403);
  assert.equal((await fetch(`${baseUrl}/api/admin/activity`, { headers: { Cookie: boyfriend.cookie } })).status, 403);
  assert.equal((await fetch(`${baseUrl}/api/reactions`, { headers: { Cookie: boyfriend.cookie } })).status, 403);

  const lowercaseBoyfriend = await login('BOYFRIEND', process.env.BOYFRIEND_PASSWORD, '  rasagulla  ');
  assert.equal(lowercaseBoyfriend.response.status, 200);
  assert.deepEqual((await (await fetch(`${baseUrl}/auth/me`, { headers: { Cookie: lowercaseBoyfriend.cookie } })).json()).user, {
    userId: 'boyfriend',
    role: 'BOYFRIEND',
    username: 'My Love',
  });
  const mixedCaseBoyfriend = await login('BOYFRIEND', process.env.BOYFRIEND_PASSWORD, 'Rasagulla');
  assert.equal(mixedCaseBoyfriend.response.status, 200);
  assert.deepEqual((await mixedCaseBoyfriend.response.json()).user, {
    userId: 'boyfriend',
    role: 'BOYFRIEND',
    username: 'My Love',
  });

  const lowercaseOwner = await login('OWNER', process.env.OWNER_PASSWORD, 'cazomon');
  assert.equal(lowercaseOwner.response.status, 200);
  assert.deepEqual((await (await fetch(`${baseUrl}/auth/me`, { headers: { Cookie: lowercaseOwner.cookie } })).json()).user, {
    userId: 'owner',
    role: 'OWNER',
    username: 'System',
  });
  const mixedCaseOwner = await login('OWNER', process.env.OWNER_PASSWORD, 'Cazomon');
  assert.equal(mixedCaseOwner.response.status, 200);
  assert.deepEqual((await mixedCaseOwner.response.json()).user, {
    userId: 'owner',
    role: 'OWNER',
    username: 'System',
  });

  const incorrectBoyfriendPassword = await login('BOYFRIEND', 'wrong-password', 'rasagulla');
  assert.equal(incorrectBoyfriendPassword.response.status, 401);
});
