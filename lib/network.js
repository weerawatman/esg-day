import dgram from 'node:dgram';
export function networkUrls(interfaces,port,preferred){
 const addresses=[...new Set(Object.values(interfaces).flat().filter(n=>n.family==='IPv4'&&!n.internal&&!n.address.startsWith('169.254.')).map(n=>n.address))];
 addresses.sort((a,b)=>Number(b===preferred)-Number(a===preferred));
 return addresses.map(ip=>`http://${ip}:${port}`);
}
export function primaryAddress(){
 // UDP connect asks the OS to select a route; no datagram is sent.
 return new Promise(resolve=>{const socket=dgram.createSocket('udp4');let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);socket.close();resolve(value)};const timer=setTimeout(()=>finish(null),500);socket.on('error',()=>finish(null));socket.connect(53,'1.1.1.1',()=>finish(socket.address().address))});
}
