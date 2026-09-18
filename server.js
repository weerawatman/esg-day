import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import QRCode from 'qrcode';
import { Game } from './lib/game.js';
import { networkUrls, primaryAddress } from './lib/network.js';
import { saveSnapshot } from './lib/persistence.js';
const root=path.dirname(fileURLToPath(import.meta.url));
export function createApp({persist=true}={}) {
 const dir=path.join(root,'data'),file=path.join(dir,'rooms.json');
 const rooms=persist&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
 const save=persist?(data)=>saveSnapshot(file,data):()=>{};
 const game=new Game({rooms,save});
 const preferredAddress=primaryAddress();
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data))};
  try {
   const url=new URL(req.url,'http://localhost'),p=url.pathname;
   const auth=req.headers.authorization?.replace(/^Bearer /,'');
   let body={};
   if(req.method==='POST'){
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)throw new Error('ไม่อนุญาตคำสั่งจากเว็บไซต์อื่น');
    if(!req.headers['content-type']?.startsWith('application/json'))throw new Error('ต้องส่งข้อมูลแบบ JSON');
    let input='';for await(const chunk of req){input+=chunk;if(input.length>8192)throw new Error('ข้อมูลมีขนาดใหญ่เกินไป')}body=JSON.parse(input||'{}');
   }
   if(p==='/api/config'&&req.method==='GET'){
    const port=server.address().port;const addresses=networkUrls(os.networkInterfaces(),port,await preferredAddress);
    return send({addresses,publicUrl:process.env.PUBLIC_URL||addresses[0]||`http://localhost:${port}`});
   }
   if(p==='/api/qr'&&req.method==='GET'){const target=new URL(url.searchParams.get('url'));if(!['http:','https:'].includes(target.protocol)||target.href.length>1500)throw new Error('ลิงก์ไม่ถูกต้อง');const svg=await QRCode.toString(target.href,{type:'svg',margin:2,width:260,color:{dark:'#14283F',light:'#FFFFFF'}});res.writeHead(200,{'Content-Type':'image/svg+xml'});return res.end(svg)}
   if(p==='/api/rooms'&&req.method==='POST')return send(game.create(body.demo===true));
   const match=p.match(/^\/api\/rooms\/(\d{6})(?:\/(join|control|answer))?$/);
   if(match){const [,code,action]=match;if(req.method==='GET'&&!action)return send(game.view(code,auth));if(req.method==='POST'){if(action==='join')return send(game.join(code,body.name,body.employeeId,false,body.joinKey??null));if(action==='control')return send(game.control(code,auth,body.action,body));if(action==='answer')return send(game.answer(code,auth,body.q,body.choice))}}
   const assets={'/':'index.html','/app.js':'app.js','/effects.js':'effects.js','/style.css':'style.css','/live.css':'live.css','/favicon.svg':'favicon.svg'};
   if(req.method==='GET'&&assets[p]){const ext=path.extname(assets[p]);res.writeHead(200,{'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'}[ext]});return fs.createReadStream(path.join(root,'public',assets[p])).pipe(res)}
   send({error:'ไม่พบหน้านี้'},404);
  }catch(e){send({error:e.message},400)}
 });
 server.requestTimeout=15000;return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT)||3000;const server=createApp();server.listen(port,'0.0.0.0',()=>console.log(`Data Guardians ready: http://localhost:${port}`));server.on('error',e=>{console.error(e.message);process.exit(1)});
}
