require('dotenv').config();
const express=require('express'),http=require('http'),{Server}=require('socket.io'),session=require('express-session'),
SQLiteStore=require('connect-sqlite3')(session),rateLimit=require('express-rate-limit'),helmet=require('helmet'),
crypto=require('crypto'),fetch=require('node-fetch'),{AbortController}=require('abort-controller'),
HttpsProxyAgent=require('https-proxy-agent'),sqlite3=require('sqlite3').verbose(),{authenticator}=require('otplib'),
QRCode=require('qrcode'),svgCaptcha=require('svg-captcha'),cors=require('cors');

const app=express(),server=http.createServer(app),PORT=process.env.PORT||3000;
const DB_FILE='system_v18.db';

const isProd=process.env.NODE_ENV==='production';
const allowedOrigins=isProd?[process.env.FRONTEND_URL]:['http://localhost:5500',process.env.FRONTEND_URL];
app.set('trust proxy',1);
app.use(cors({origin:allowedOrigins,credentials:true,methods:["GET","POST"]}));
const io=new Server(server,{cors:{origin:allowedOrigins,methods:["GET","POST"],credentials:true},transports:['websocket','polling']});

const db=new sqlite3.Database(DB_FILE);db.serialize(()=>{
    db.run("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,username TEXT UNIQUE,password TEXT,salt TEXT,secret_2fa TEXT,global_content TEXT DEFAULT '{Hello|Hi}')");
    db.run("CREATE TABLE IF NOT EXISTS accounts(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,name TEXT,token TEXT,proxy TEXT,channels TEXT,private_content TEXT,image_url TEXT,FOREIGN KEY(user_id) REFERENCES users(id))");
    db.run("CREATE TABLE IF NOT EXISTS configs(user_id INTEGER PRIMARY KEY,delay_min INTEGER DEFAULT 60,delay_max INTEGER DEFAULT 120,max_concurrency INTEGER DEFAULT 3)");
    db.run("CREATE TABLE IF NOT EXISTS audit_logs(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,action TEXT,ip TEXT,timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)");
});
function audit(u,a,i){db.run("INSERT INTO audit_logs(user_id,action,ip) VALUES(?,?,?)",[u,a,i])}

app.use(helmet({contentSecurityPolicy:false}));app.use(express.json({limit:'10kb'}));
app.use(session({store:new SQLiteStore({db:'sessions.db',dir:'.'}),name:'karyna_v18',secret:process.env.SESSION_SECRET,resave:false,saveUninitialized:false,proxy:true,cookie:{httpOnly:true,maxAge:86400000*7,secure:true,sameSite:'none'}}));

const loginLim=rateLimit({windowMs:15*60*1000,max:5});app.use('/api/auth/login',loginLim);

function encrypt(t){if(!t)return"";let iv=crypto.randomBytes(16),c=crypto.createCipheriv('aes-256-cbc',Buffer.from(crypto.scryptSync(process.env.ENCRYPTION_SECRET,'salt',32)),iv),e=c.update(t);e=Buffer.concat([e,c.final()]);return iv.toString('hex')+':'+e.toString('hex')}
function decrypt(t){if(!t||!t.includes(':'))return t;try{let p=t.split(':'),iv=Buffer.from(p.shift(),'hex'),e=Buffer.from(p.join(':'),'hex'),c=crypto.createDecipheriv('aes-256-cbc',Buffer.from(crypto.scryptSync(process.env.ENCRYPTION_SECRET,'salt',32)),iv),d=c.update(e);d=Buffer.concat([d,c.final()]);return d.toString()}catch(e){return""}}
function hashPass(p){const s=crypto.randomBytes(16).toString('hex'),h=crypto.scryptSync(p,s,64).toString('hex');return{salt:s,hash:h}}

const activeSessions={};
io.on('connection',(s)=>{s.on('join_room',(uid)=>{s.join('user_'+uid)})});
function isAuth(q,s,n){if(q.session.userId)return n();s.status(401).json({error:"Unauthorized"})}

app.get('/',(q,s)=>s.send("KARYNA V18 BACKEND ONLINE"));
app.get('/api/captcha',(q,s)=>{const c=svgCaptcha.create({size:5,noise:3,background:'#111',color:true});q.session.captcha=c.text;q.session.save();s.type('svg').send(c.data)});

app.post('/api/auth/login',(q,s)=>{
    const{username:u,password:p,otp,honeypot:h,captchaInput:c}=q.body,ip=q.ip;
    if(h)return s.json({success:false,error:"Bot Detected"});
    if((q.session.loginAttempts||0)>2){
        if(!c)return s.json({success:false,requireCaptcha:true,msg:"Security Check"});
        if(c.toLowerCase()!==q.session.captcha?.toLowerCase()){delete q.session.captcha;return s.json({success:false,requireCaptcha:true,error:"Wrong Captcha"})}
    }
    db.get("SELECT * FROM users WHERE username=?",[u],(e,r)=>{
        if(r&&crypto.scryptSync(p,r.salt,64).toString('hex')===r.password){
            if(r.secret_2fa){
                if(!otp)return s.json({success:false,require2fa:true});
                if(!authenticator.check(otp,r.secret_2fa)){delete q.session.captcha;return s.json({success:false,error:"Wrong 2FA Code"})}
            }
            q.session.regenerate(()=>{q.session.userId=r.id;q.session.username=u;q.session.loginAttempts=0;delete q.session.captcha;audit(r.id,"LOGIN_SUCCESS",ip);s.json({success:true})});
        }else{q.session.loginAttempts=(q.session.loginAttempts||0)+1;delete q.session.captcha;s.json({success:false,error:"Invalid Credentials"})}
    });
});

app.post('/api/auth/register',(q,s)=>{
    const{username:u,password:p}=q.body;if(!u||p.length<6)return s.json({success:false,error:"Weak Password"});
    const{salt:sa,hash:h}=hashPass(p);
    db.run("INSERT INTO users(username,password,salt) VALUES(?,?,?)",[u,h,sa],function(e){
        if(e)return s.json({success:false,error:"Username Taken"});
        db.run("INSERT INTO configs(user_id) VALUES(?)",[this.lastID]);
        audit(this.lastID,"REGISTER",q.ip);s.json({success:true})
    })
});
app.post('/api/auth/logout',(q,s)=>{audit(q.session.userId,"LOGOUT",q.ip);q.session.destroy(()=>s.json({success:true}))});

app.get('/api/2fa/generate',isAuth,async(q,s)=>{const sec=authenticator.generateSecret(),qr=await QRCode.toDataURL(authenticator.keyuri(q.session.username,'KARYNA',sec));s.json({secret:sec,qr})});
app.post('/api/2fa/enable',isAuth,(q,s)=>{if(authenticator.check(q.body.token,q.body.secret)){db.run("UPDATE users SET secret_2fa=? WHERE id=?",[q.body.secret,q.session.userId],()=>{audit(q.session.userId,"ENABLE_2FA",q.ip);q.session.destroy(()=>s.json({success:true,reLogin:true}))})}else s.json({success:false,error:"Wrong Code"})});
app.post('/api/2fa/disable',isAuth,(q,s)=>{db.run("UPDATE users SET secret_2fa=NULL WHERE id=?",[q.session.userId],()=>{audit(q.session.userId,"DISABLE_2FA",q.ip);q.session.destroy(()=>s.json({success:true,reLogin:true}))})});
app.get('/api/user/info',(q,s)=>{if(q.session.userId)db.get("SELECT secret_2fa FROM users WHERE id=?",[q.session.userId],(e,r)=>s.json({loggedIn:true,username:q.session.username,uid:q.session.userId,is2fa:!!r?.secret_2fa}));else s.json({loggedIn:false})});

app.get('/api/data',isAuth,(q,s)=>{const uid=q.session.userId;db.get("SELECT global_content FROM users WHERE id=?",[uid],(e,u)=>{db.get("SELECT * FROM configs WHERE user_id=?",[uid],(e,c)=>{db.all("SELECT id,name,proxy,channels,private_content,image_url,token FROM accounts WHERE user_id=?",[uid],(e,a)=>{s.json({global_content:u?.global_content||"",config:c||{},accounts:a.map(x=>({...x,channels:JSON.parse(x.channels||"[]"),token:x.token?"••••":""}))})})})})});
app.post('/api/save_global',isAuth,(q,s)=>{db.run("UPDATE users SET global_content=? WHERE id=?",[q.body.global_content,q.session.userId]);db.run("INSERT OR REPLACE INTO configs(user_id,delay_min,delay_max,max_concurrency) VALUES(?,?,?,?)",[q.session.userId,q.body.config.delay_min,q.body.config.delay_max,q.body.config.max_concurrency]);s.json({success:true})});
app.post('/api/account/add_update',isAuth,(q,s)=>{const{id,name,token:t,proxy:p,channels:c,private_content:pc,image_url:img}=q.body,uid=q.session.userId,ch=JSON.stringify(c);if(id&&t.includes("••"))db.run("UPDATE accounts SET name=?,proxy=?,channels=?,private_content=?,image_url=? WHERE id=? AND user_id=?",[name,p,ch,pc,img,id,uid],(e)=>s.json({success:!e}));else{const enc=encrypt(t);if(id)db.run("UPDATE accounts SET name=?,token=?,proxy=?,channels=?,private_content=?,image_url=? WHERE id=? AND user_id=?",[name,enc,p,ch,pc,img,id,uid],(e)=>s.json({success:!e}));else db.run("INSERT INTO accounts(user_id,name,token,proxy,channels,private_content,image_url) VALUES(?,?,?,?,?,?,?)",[uid,name,enc,p,ch,pc,img],(e)=>s.json({success:!e}))}audit(uid,id?"UPDATE":"ADD",q.ip)});
app.post('/api/account/delete',isAuth,(q,s)=>db.run("DELETE FROM accounts WHERE id=? AND user_id=?",[q.body.id,q.session.userId],()=>{audit(q.session.userId,"DEL",q.ip);s.json({success:true})}));

async function fetchD(u,t,p,m='GET',b=null){const o={method:m,headers:{'Authorization':t,'Content-Type':'application/json'}};if(b)o.body=JSON.stringify(b);if(p){try{o.agent=new HttpsProxyAgent(p.includes('http')?p:`http://${p}`)}catch{}}try{const r=await fetch(u,o);if(r.status===429){const j=await r.json().catch(()=>({retry_after:5}));await new Promise(x=>setTimeout(x,(j.retry_after||5)*1000));return fetchD(u,t,p,m,b)}return r}catch(e){throw new Error(e.message)}}
app.post('/api/discord/fetch',isAuth,async(q,s)=>{const{type,accountId,rawToken:rt,rawProxy:rp,guildId:g}=q.body;let t=rt,p=rp;if(accountId&&(!t||t.includes("••"))){const r=await new Promise(ok=>db.get("SELECT token,proxy FROM accounts WHERE id=? AND user_id=?",[accountId,q.session.userId],(e,ro)=>ok(ro)));if(!r)return s.json({error:"Denied"});t=decrypt(r.token);p=r.proxy||p}if(!t||t.includes("••"))return s.json({error:"No Token"});try{const u=type==='guilds'?'https://discord.com/api/v9/users/@me/guilds':`https://discord.com/api/v9/guilds/${g}/channels`;const r=await fetchD(u,t,p);if(!r.ok)return s.json({error:`Discord ${r.status}`});s.json(await r.json())}catch(e){s.json({error:e.message})}});

app.post('/api/start',isAuth,(q,s)=>{const uid=q.session.userId;if(activeSessions[uid]?.isRunning)return s.json({status:'running'});activeSessions[uid]={isRunning:true,controller:new AbortController()};io.to('user_'+uid).emit('status_update','running');audit(uid,"START",q.ip);runWorker(uid);s.json({success:true})});
app.post('/api/stop',isAuth,(q,s)=>{const uid=q.session.userId;if(activeSessions[uid]){activeSessions[uid].isRunning=false;activeSessions[uid].controller.abort()}io.to('user_'+uid).emit('status_update','idle');audit(uid,"STOP",q.ip);s.json({success:true})});

async function runWorker(uid){db.get("SELECT global_content FROM users WHERE id=?",[uid],(e,u)=>{db.get("SELECT * FROM configs WHERE user_id=?",[uid],(e,cfg)=>{db.all("SELECT * FROM accounts WHERE user_id=?",[uid],async(e,accs)=>{if(!accs?.length){activeSessions[uid].isRunning=false;io.to('user_'+uid).emit('status_update','idle');return io.to('user_'+uid).emit('log_update',{type:'fail',msg:'No Accounts'})}io.to('user_'+uid).emit('log_update',{type:'success',msg:`🚀 STARTED ${accs.length} THREADS`});const loop=async(acc)=>{const tok=decrypt(acc.token),chs=JSON.parse(acc.channels||"[]");if(!chs.length)return;while(activeSessions[uid]?.isRunning){try{const src=(acc.private_content&&acc.private_content.trim())?acc.private_content:u.global_content;if(!src)break;const tmpls=src.split('###').map(s=>s.trim()).filter(s=>s),msg=tmpls[Math.floor(Math.random()*tmpls.length)].replace(/\{([^{}]+)\}/g,(m,p1)=>{const o=p1.split('|');return o[Math.floor(Math.random()*o.length)]})+(acc.image_url?`\n${acc.image_url}`:''),cid=chs[Math.floor(Math.random()*chs.length)],r=await fetchD(`https://discord.com/api/v9/channels/${cid}/messages`,tok,acc.proxy,'POST',{content:msg,tts:false});if(r.ok)io.to('user_'+uid).emit('log_update',{type:'success',msg:`✅ ${acc.name} -> OK`});else io.to('user_'+uid).emit('log_update',{type:'fail',msg:`❌ ${acc.name} -> ${r.status}`});const d=Math.floor(Math.random()*(cfg.delay_max-cfg.delay_min+1)+cfg.delay_min);for(let i=0;i<d;i++){if(!activeSessions[uid]?.isRunning)break;await new Promise(x=>setTimeout(x,1000))}}catch(e){if(e.name==='AbortError')break;await new Promise(x=>setTimeout(x,5000))}}};for(const a of accs){if(!activeSessions[uid]?.isRunning)break;loop(a);await new Promise(x=>setTimeout(x,2000))}})})})};
server.listen(PORT,()=>{console.log(`🚀 BACKEND ONLINE PORT ${PORT}`)});