import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import express from 'express';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import mongoose from 'mongoose';
import cors from 'cors';
import pdfParse from 'pdf-parse';
import net from 'net';

const app = express();
const PORT = 3000; // Express HTTP API
const TCP_PORT = 3001; // TCP Chatbot Server

app.use(express.json());
app.use(cors());
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Dummy chatbot response function
async function generateChatbotResponse(text, userId) {
  // Ensure PDF chunks are initialized
  const chunkCount = await DocumentChunk.countDocuments();
  if (chunkCount === 0) {
    await initializeDatabase();
  }

  // Find relevant chunks
  const chunks = await DocumentChunk.find({});
  if (chunks.length === 0) {
    return "No PDF documents found. Please ensure PDFs are in the correct directory.";
  }
  const chunkEmbeddings = chunks.map(c => c.embedding);
  const questionEmbedding = await getEmbedding(text);

  const similarities = chunkEmbeddings.map(e => cosineSimilarity(e, questionEmbedding));
  const topIndices = similarities
    .map((sim, idx) => ({ sim, idx }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3)
    .map(obj => obj.idx);

  const ragContext = topIndices.map(idx =>
    `From ${chunks[idx].filename}:\n${chunks[idx].content}`
  ).join('\n\n---\n\n');

  const context = ragContext ? `Relevant LAUSD documents:\n\n${ragContext}` : '';

  if (!context) {
    return "Sorry, I couldn't find relevant information in the LAUSD documents.";
  }

  // Ask OpenAI
  const response = await makeOpenAIRequest({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant who answers questions using official LAUSD documents and be very specific about the answer, .' },
      { role: 'user', content: `${context}\n\nQuestion: ${text}` }
    ],
    temperature: 0.3
  });

  return response.data.choices?.[0]?.message?.content || 'No answer generated.';
}

// Dummy translation function
async function translateText(text, targetLanguage) {
  // Replace this with your actual translation logic if needed
  if (targetLanguage === 'es') {
    return `Traducción simulada: ${text}`;
  }
  return text;
}

// --- TCP SERVER SETUP ---
const tcpServer = net.createServer((socket) => {
  socket.on('data', async (data) => {
    console.log('Received:', data.toString());
    try {
      const { text, userId, targetLanguage } = JSON.parse(data.toString());
      console.log('Calling getRagAnswer...');
      const { answer, translated } = await getRagAnswer(text, targetLanguage, userId);
      console.log('Got answer:', answer);

      const responseData = JSON.stringify({
        response: answer,
        translated,
        timestamp: new Date().toISOString()
      });
      socket.write(responseData);
      socket.end();
    } catch (error) {
      console.error('Error processing TCP message:', error);
      socket.write(JSON.stringify({ error: 'Invalid request or server error.' }));
      socket.end();
    }
  });

  socket.on('error', (err) => {
    console.error('TCP socket error:', err);
  });
});

const TCP_HOST = '0.0.0.0';
tcpServer.listen(TCP_PORT, TCP_HOST, () => {
  console.log(`TCP Chatbot Server listening on ${TCP_HOST}:${TCP_PORT}`);
});
// --- END TCP SERVER SETUP ---

// Example: Minimal TCP echo server for testing with nc or telnet
const testTcpServer = net.createServer((socket) => {
  socket.on('data', (data) => {
    console.log('Received:', data.toString());
    socket.write('TCP ACK: ' + data);
  });
});

testTcpServer.listen(4000, () => {
  console.log('Raw TCP test server on port 4000');
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// MongoDB models
const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const conversationSchema = new mongoose.Schema({
  title: String,
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});
const documentChunkSchema = new mongoose.Schema({
  content: String,
  filename: String,
  embedding: [Number],
  metadata: {
    chunkIndex: Number,
    totalChunks: Number
  }
});
const Conversation = mongoose.model('Conversation', conversationSchema);
const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema, 'pdfs');

// Utility: Chunk text
function chunkText(text, size = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// Utility: Cosine similarity
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Utility: Extract all PDFs from a directory
async function extractAllPdfs(pdfDir) {
  const absolutePdfDir = path.isAbsolute(pdfDir) ? pdfDir : path.join(process.cwd(), pdfDir);
  let results = [];
  try {
    const files = fs.readdirSync(absolutePdfDir).filter(f => f.endsWith('.pdf'));
    for (const file of files) {
      try {
        const dataBuffer = fs.readFileSync(path.join(absolutePdfDir, file));
        const pdfData = await pdfParse(dataBuffer);
        results.push({
          filename: file,
          text: pdfData.text
        });
        console.log(`Successfully extracted text from ${file}`);
      } catch (e) {
        console.error(`Error processing ${file}:`, e.message);
      }
    }
    return results;
  } catch (e) {
    console.error('Error in extractAllPdfs:', e.message);
    return [];
  }
}

// Embedding function (singleton)
let embedder = null;
async function getEmbedding(data) {
  if (!embedder) {
    embedder = await pipeline(
      'feature-extraction',
      'Xenova/nomic-embed-text-v1',
      {
        use_auth_token: process.env.HUGGINGFACE_API_KEY,
        execution_provider: 'cpu'
      }
    );
  }
  const results = await embedder(data, { pooling: 'mean', normalize: true });
  return Array.from(results.data);
}

// OpenAI request with retry
async function makeOpenAIRequest(data) {
  const maxRetries = 3;
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        data,
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      return response;
    } catch (error) {
      console.error(`Request failed (attempt ${retryCount + 1}):`, error.message);
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error(`Failed to get response after ${maxRetries} retries.`);
}

// Initialize database with PDF chunks (no duplicates)
async function initializeDatabase() {
  try {
    const pdfs = await extractAllPdfs('./pdfs');
    const allChunks = [];
    pdfs.forEach(pdf => {
      const chunks = chunkText(pdf.text);
      chunks.forEach((chunk, idx) => allChunks.push({
        content: chunk,
        filename: pdf.filename,
        chunkIndex: idx,
        totalChunks: chunks.length
      }));
    });

    let storedCount = 0;
    for (const chunk of allChunks) {
      const existingChunk = await DocumentChunk.findOne({
        content: chunk.content,
        filename: chunk.filename,
        'metadata.chunkIndex': chunk.chunkIndex
      });
      if (!existingChunk) {
        try {
          const embedding = await getEmbedding(chunk.content);
          const chunkDoc = new DocumentChunk({
            content: chunk.content,
            filename: chunk.filename,
            embedding: embedding,
            metadata: {
              chunkIndex: chunk.chunkIndex,
              totalChunks: chunk.totalChunks
            }
          });
          await chunkDoc.save();
          storedCount++;
        } catch (embeddingError) {
          console.error('Error generating embedding or saving chunk:', chunk.filename, chunk.chunkIndex, embeddingError);
        }
      } else {
        console.log('Skipping duplicate chunk:', chunk.filename, chunk.content.slice(0, 20) + '...');
      }
    }
    console.log(`Database initialized. Stored ${storedCount} new PDF chunks.`);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Remove or comment out this block so DB initialization doesn't run on server start
// mongoose.connection.on('connected', async () => {
//   await initializeDatabase();
// });

// Conversation endpoints
app.post('/api/conversations', async (req, res) => {
  try {
    const conversation = new Conversation({ title: req.body.title || 'Untitled', messages: [] });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { role, content } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    conversation.messages.push({ role, content });
    await conversation.save();
    res.json(conversation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Main RAG endpoint
app.post('/api/ask', async (req, res) => {
  const { question, language } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }
  try {
    const { answer, translated } = await getRagAnswer(question, language);
    return res.json({ question, answer, translated });
  } catch (err) {
    console.error('Error in /api/ask:', err);
    return res.status(500).json({ error: 'Failed to process question.', details: err.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.send(`<h2>LAUSD High Schools Scraper API</h2>`);
});

app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

tcpServer.listen(TCP_PORT, TCP_HOST, () => {
  console.log(`TCP Chatbot Server listening on ${TCP_HOST}:${TCP_PORT}`);
});

// New RAG answer function
async function getRagAnswer(question, language = 'en', userId = null) {
  console.log('getRagAnswer called with:', question, language, userId);

  // 1. Try Botpress first
  const botpressAnswer = await askBotpress(question, userId || 'default');
  if (botpressAnswer) {
    let translated = botpressAnswer;
    if (language && language !== 'en') {
      translated = await translateText(botpressAnswer, language);
    }
    return { answer: botpressAnswer, translated };
  }

  const chunkCount = await DocumentChunk.countDocuments();
  console.log('Chunk count:', chunkCount);

  if (chunkCount === 0) {
    await initializeDatabase();
    console.log('Database initialized');
  }

  const chunks = await DocumentChunk.find({});
  console.log('Chunks found:', chunks.length);

  if (chunks.length === 0) {
    let answer = "No PDF documents found. Please ensure PDFs are in the correct directory.";
    let translated = answer;
    if (language && language !== 'en') {
      translated = await translateText(answer, language);
    }
    return { answer, translated };
  }

  const chunkEmbeddings = chunks.map(c => c.embedding);
  const questionEmbedding = await getEmbedding(question);
  console.log('Got question embedding');

  const similarities = chunkEmbeddings.map(e => cosineSimilarity(e, questionEmbedding));
  const topIndices = similarities
    .map((sim, idx) => ({ sim, idx }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3)
    .map(obj => obj.idx);

  const ragContext = topIndices.map(idx =>
    `From ${chunks[idx].filename}:\n${chunks[idx].content}`
  ).join('\n\n---\n\n');

  const context = ragContext ? `Relevant LAUSD documents:\n\n${ragContext}` : '';
  console.log('Context built');

  if (!context) {
    let answer = "Sorry, I couldn't find relevant information in the LAUSD documents.";
    let translated = answer;
    if (language && language !== 'en') {
      translated = await translateText(answer, language);
    }
    return { answer, translated };
  }

  // Ask OpenAI with context
  console.log('Calling OpenAI...');
  const response = await makeOpenAIRequest({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant who answers questions using official LAUSD documents.' },
      { role: 'user', content: `${context}\n\nQuestion: ${question}` }
    ],
    temperature: 0.3
  });
  console.log('OpenAI response received');

  let answer = response.data.choices?.[0]?.message?.content || 'No answer generated.';
  let translated = answer;
  if (language && language !== 'en') {
    translated = await translateText(answer, language);
  }
  return { answer, translated };
}

// Add this function near the top
async function askBotpress(question, userId = 'default') {
  try {
    // Replace with your Botpress server and bot ID
    const botpressUrl = 'http://localhost:3001/api/v1/bots/<your-bot-id>/converse/<user-id>';
    const response = await axios.post(botpressUrl, {
      type: 'text',
      text: question
    });
    // Botpress returns an array of responses, get the first text
    const answer = response.data.responses?.[0]?.payload?.text || null;
    return answer;
  } catch (err) {
    console.error('Botpress error:', err.message);
    return null;
  }
}