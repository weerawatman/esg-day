import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { saveSnapshot } from '../lib/persistence.js';
test('snapshot retries transient Windows file locks without losing the previous snapshot',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'guardians-test-')),file=path.join(dir,'rooms.json');
 fs.writeFileSync(file,'{"old":true}');let attempts=0;
 saveSnapshot(file,{new:true},{rename:(from,to)=>{attempts++;if(attempts<=2){assert.deepEqual(JSON.parse(fs.readFileSync(file)),{old:true});throw Object.assign(new Error('scanner lock'),{code:'EPERM'})}fs.renameSync(from,to)},sleep:()=>{}});
 assert.equal(attempts,3);assert.deepEqual(JSON.parse(fs.readFileSync(file)),{new:true});
 fs.unlinkSync(file);fs.rmdirSync(dir);
});
