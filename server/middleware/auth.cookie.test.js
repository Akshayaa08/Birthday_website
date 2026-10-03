import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sessionCookieOptions } from './auth.js';

test('production session cookies allow credentialed cross-origin API requests', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const options = sessionCookieOptions();
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, 'none');
    assert.equal(options.httpOnly, true);
  } finally {
    process.env.NODE_ENV = previousNodeEnv;
  }
});
