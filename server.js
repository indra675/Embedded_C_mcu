// CodeShelf server: serves the site + login + saved progress. No dependencies (Node 18+).
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const DIR=process.env.DATA_DIR||path.join(__dirname,'data'),FILE=path.join(DIR,'db.json');
fs.mkdirSync(DIR,{recursive:true});
let db={users:{},tokens:{}};try{db=JSON.parse(fs.readFileSync(FILE))}catch{}
const save=()=>fs.writeFileSync(FILE,JSON.stringify(db));
const hash=(p,s)=>crypto.scryptSync(p,s,32).toString('hex');
const send=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json'});r.end(JSON.stringify(o))};
const body=q=>new Promise(res=>{let b='';q.on('data',d=>{b+=d;if(b.length>1e6)q.destroy()});q.on('end',()=>{try{res(JSON.parse(b||'{}'))}catch{res({})}})});
http.createServer(async(q,r)=>{
 const u=q.url.split('?')[0];
 if(u.startsWith('/api/')){
  const b=q.method==='POST'||q.method==='PUT'?await body(q):{};
  if(u==='/api/register'||u==='/api/login'){
   const n=String(b.user||'').trim().toLowerCase(),p=String(b.pass||'');
   if(!/^[a-z0-9_.-]{3,32}$/.test(n))return send(r,400,{error:'Username: 3-32 letters, numbers, _ . -'});
   if(p.length<6)return send(r,400,{error:'Password must be at least 6 characters'});
   let usr=db.users[n];
   if(u==='/api/register'){
    if(usr)return send(r,409,{error:'Username already taken'});
    const salt=crypto.randomBytes(16).toString('hex');usr=db.users[n]={salt,h:hash(p,salt),done:[]};
   }else if(!usr||!crypto.timingSafeEqual(Buffer.from(hash(p,usr.salt)),Buffer.from(usr.h)))return send(r,401,{error:'Wrong username or password'});
   const t=crypto.randomBytes(24).toString('hex');db.tokens[t]=n;save();return send(r,200,{token:t,user:n});
  }
  const n=db.tokens[(q.headers.authorization||'').slice(7)];
  if(!n)return send(r,401,{error:'Unauthorized'});
  if(u==='/api/progress'){
   if(q.method==='PUT'){db.users[n].done=[...new Set((b.done||[]).filter(x=>typeof x==='string'&&x.length<120))].slice(0,2000);save()}
   return send(r,200,{done:db.users[n].done});
  }
  return send(r,404,{error:'Not found'});
 }
 if(u==='/'||u==='/index.html'){fs.readFile(path.join(__dirname,'index.html'),(e,d)=>{r.writeHead(e?500:200,{'Content-Type':'text/html; charset=utf-8'});r.end(e?'error':d)});return}
 r.writeHead(404);r.end('Not found');
}).listen(process.env.PORT||3000,()=>console.log('CodeShelf running on port '+(process.env.PORT||3000)));
