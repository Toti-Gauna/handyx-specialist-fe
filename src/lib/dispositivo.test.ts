import assert from 'node:assert/strict';
import { it } from 'node:test';
import { esDispositivoApple } from './dispositivo.ts';

it('Apple solo en iPhone, iPad y Mac', () => {
  const ua = {
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    android: 'Mozilla/5.0 (Linux; Android 14; Moto G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36',
    windows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  };
  assert.equal(esDispositivoApple({ userAgent: ua.iphone }), true);
  assert.equal(esDispositivoApple({ userAgent: ua.ipad }), true);
  assert.equal(esDispositivoApple({ userAgent: ua.android }), false);
  assert.equal(esDispositivoApple({ userAgent: ua.windows }), false);
  // Con userAgentData manda la plataforma declarada
  assert.equal(esDispositivoApple({ userAgent: ua.android, plataforma: 'Android' }), false);
  assert.equal(esDispositivoApple({ userAgent: ua.windows, plataforma: 'macOS' }), true);
});
