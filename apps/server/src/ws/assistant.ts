import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';


export function attachAssistantWSS(server: any){
const wss = new WebSocketServer({ noServer: true });


server.on('upgrade', (req: IncomingMessage, socket, head) => {
if (req.url?.startsWith('/ws/assistant')) {
wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
}
});


wss.on('connection', (ws) => {
ws.on('message', async (raw) => {
let msg: any; try { msg = JSON.parse(raw.toString()); } catch { return; }
if (msg.type === 'start') ws.send(JSON.stringify({ type: 'assistant_text', text: 'Assistant ready.' }));
if (msg.type === 'user_text'){
ws.send(JSON.stringify({ type: 'assistant_text', text: 'Highlighting suspected damage area.' }));
ws.send(JSON.stringify({ type: 'tool_call', name: 'annotate.addCircle', args: { mediaId: 'demo-media', x: 420, y: 260, r: 58, label: 'Possible water line damage' } }));
}
});
});
}