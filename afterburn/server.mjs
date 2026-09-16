import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');const target=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}const ext=path.extname(target);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.wasm':'application/wasm','.mp3':'audio/mpeg'};if(!types[ext]||target.includes('node_modules')){res.writeHead(404);res.end();return;}const file=await readFile(target);res.writeHead(200,{'Content-Type':types[ext],'Cache-Control':'no-store'});res.end(file);}catch(_){res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Afterburn: http://127.0.0.1:4173'));
