import fs from 'node:fs';
import path from 'node:path';
const sleep=ms=>Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
export function saveSnapshot(file,data,{rename=fs.renameSync,sleep:pause=sleep}={}) {
 fs.mkdirSync(path.dirname(file),{recursive:true});
 const temp=file+'.tmp';fs.writeFileSync(temp,JSON.stringify(data));
 // Antivirus/indexing on Windows can briefly deny replacing an existing file.
 // Keep the old complete snapshot until replacement succeeds.
 for(let attempt=0;;attempt++){
  try{rename(temp,file);return}catch(error){
   if(!['EPERM','EBUSY','EACCES'].includes(error.code)||attempt>=6)throw error;
   pause(10*2**attempt);
  }
 }
}
