import test from 'node:test';
import assert from 'node:assert/strict';
import { networkUrls } from '../lib/network.js';
test('QR prefers interface with an outbound route over virtual adapters and excludes link-local',()=>{
 const urls=networkUrls({Virtual:[{family:'IPv4',internal:false,address:'192.168.56.1'}],Wifi:[{family:'IPv4',internal:false,address:'172.16.6.160'}],Bluetooth:[{family:'IPv4',internal:false,address:'169.254.2.2'}],Loop:[{family:'IPv4',internal:true,address:'127.0.0.1'}]},3000,'172.16.6.160');
 assert.deepEqual(urls,['http://172.16.6.160:3000','http://192.168.56.1:3000']);
});
