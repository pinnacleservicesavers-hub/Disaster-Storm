// Just the essential imports and setup to get the server running
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import crypto from 'crypto';
import { storage } from './storage.js';
import { attachAssistantWSS, tools } from '../apps/server/src/ws/assistant.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const httpServer = http.createServer(app);

// Basic API routes
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Tool registry endpoint for LLM provider flexibility
app.get('/api/ai/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'annotate.addCircle',
        description: 'Add circle annotation to media',
        parameters: {
          type: 'object',
          properties: {
            mediaId: { type: 'string' },
            x: { type: 'number' },
            y: { type: 'number' },
            r: { type: 'number' },
            label: { type: 'string' }
          },
          required: ['mediaId', 'x', 'y', 'r', 'label']
        }
      },
      {
        name: 'measure.diameter',
        description: 'Measure diameter using frame coordinates',
        parameters: {
          type: 'object',
          properties: {
            mediaId: { type: 'string' },
            x1: { type: 'number' },
            y1: { type: 'number' },
            x2: { type: 'number' },
            y2: { type: 'number' },
            scalePxPerInch: { type: 'number' }
          },
          required: ['mediaId', 'x1', 'y1', 'x2', 'y2', 'scalePxPerInch']
        }
      },
      {
        name: 'tree.estimate_weight',
        description: 'Estimate tree weight using allometric equations',
        parameters: {
          type: 'object',
          properties: {
            species: { type: 'string' },
            dbhIn: { type: 'number' },
            lengthFt: { type: 'number' },
            method: { type: 'string' }
          },
          required: ['species', 'dbhIn', 'lengthFt', 'method']
        }
      }
    ],
    meta: {
      total_tools: 3,
      categories: {
        annotation: 1,
        measurement: 1,
        tree_analysis: 1
      },
      server_authority: true,
      explicit_tool_calls: true
    }
  });
});

// Setup WebSocket for real-time communications
const wss = new WebSocketServer({ server: httpServer, path: '/realtime' });
const wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection established');
  wsClients.add(ws);

  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to DisasterDirect Storm Intelligence',
    timestamp: new Date().toISOString(),
    services: {
      ai_assistant: 'active',
      clean_tools: 'active'
    }
  }));

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// Setup AI Assistant WebSocket Server using clean pattern
attachAssistantWSS(httpServer, storage);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log('🌟 DisasterDirect running on port', PORT);
  console.log('🌐 Frontend available at http://localhost:' + PORT);
  console.log('🔧 API endpoints available at http://localhost:' + PORT + '/api/*');
  console.log('⚡ WebSocket available at ws://localhost:' + PORT + '/realtime');
  console.log('🤖 AI Assistant available at ws://localhost:' + PORT + '/ws/assistant');
  console.log('✅ Clean tools pattern integrated:', Object.keys(tools));
});