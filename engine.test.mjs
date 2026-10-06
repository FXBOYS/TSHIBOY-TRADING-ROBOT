import test from 'node:test';import assert from 'node:assert/strict';import {analyse} from './engine.mjs';
test('no signal without market data',()=>assert.equal(analyse([],80).status,'NO TRADE'));
test('reject invalid candles',()=>assert.equal(analyse(Array.from({length:60},()=>({open:5,high:4,low:6,close:5})),80).status,'NO TRADE'));
test('flat market gives no trade',()=>assert.equal(analyse(Array.from({length:60},()=>({open:10,high:11,low:9,close:10})),80).status,'NO TRADE'));
