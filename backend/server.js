require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const pdfParse = require('pdf-parse');
const { OpenAI } = require('openai');
const mongoose = require('mongoose');
const cors = require('cors');
const MongoDB = require('mongodb');


const app = express();
const PORT = 3001;

app.use(express.json()); // Add this line near the top, after express()
app.use(cors());
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Store your key in .env

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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

const Conversation = mongoose.model('Conversation', conversationSchema);

// Scrape LAUSD directory for high schools
async function scrapeHighSchools() {
  const url = 'https://achieve.lausd.net/Page/1085';
  const result = [];
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Select the table rows that contain high school data
    $('table tr').each((i, el) => {
      const tds = $(el).find('td');
      if (tds.length >= 3) {
        const name = $(tds[0]).text().trim().replace(/\s+/g, ' ');
        const address = $(tds[1]).text().trim().replace(/\s+/g, ' ');
        const phone = $(tds[2]).text().trim();
        const website = $(tds[0]).find('a').attr('href');
        if (name && address && phone) {
          result.push({ name, address, phone, website });
        }
      }
    });

    return result;
  } catch (err) {
    console.error('Error scraping LAUSD high schools:', err.message);
    return [];
  }
}

// Try to automatically get rules/policy/handbook links for each school
async function enrichSchoolWithRules(school) {
  if (!school.website || !school.website.startsWith('http')) {
    return { ...school, rulesLinks: [] };
  }
  try {
    const { data } = await axios.get(school.website, { timeout: 9000 });
    const $ = cheerio.load(data);

    // Look for links that likely lead to handbook/policies/rules
    const links = [];
    $('a').each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr('href');
      if (
        href &&
        (text.includes('handbook') ||
          text.includes('policy') ||
          text.includes('rules') ||
          text.includes('conduct') ||
          text.includes('student guide') ||
          text.includes('student-parent') ||
          text.includes('expectations'))
      ) {
        // Fix relative links
        let fullUrl = href.startsWith('http')
          ? href
          : school.website.replace(/\/$/, '') +
            (href.startsWith('/') ? '' : '/') +
            href.replace(/^\//, '');
        links.push({ text: $(el).text().trim(), url: fullUrl });
      }
    });

    // Optionally, fetch and include the first paragraph of the first found handbook/rules page
    let ruleSnippet = '';
    if (links.length > 0) {
      try {
        const handbookData = await axios.get(links[0].url, { timeout: 9000 });
        const $handbook = cheerio.load(handbookData.data);
        ruleSnippet = $handbook('p').first().text().trim().slice(0, 500);
      } catch (e) {
        ruleSnippet = '';
      }
    }

    return {
      ...school,
      rulesLinks: links,
      ruleSnippet,
    };
  } catch (err) {
    return { ...school, rulesLinks: [], ruleSnippet: '' };
  }
}

// Get LA High Schools data from CSV file
async function getLAHighSchoolsFromCSV(csvPath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (
          row['STATE'] === 'CA' &&
          row['COUNTY'] === 'Los Angeles' &&
          row['LEVEL'] && row['LEVEL'].toLowerCase().includes('high')
        ) {
          results.push({
            name: row['SCH_NAME'],
            address: `${row['LSTREET1']}, ${row['LCITY']}, CA ${row['LZIP']}`,
            phone: row['LPHONE'],
            website: row['WEBSITE'],
          });
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

// Scrape LAUSD bulletins for rules and regulations documents
async function scrapeLAUSDBulletins() {
  const url = 'https://my.lausd.net/webcenter/portal/LAUSD/pages_type/bulletins';
  const result = [];
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Find all links to PDF bulletins
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && href.toLowerCase().endsWith('.pdf')) {
        // Make sure the link is absolute
        const fullUrl = href.startsWith('http') ? href : `https://my.lausd.net${href}`;
        result.push({ title: text, url: fullUrl });
      }
    });

    return result;
  } catch (err) {
    console.error('Error scraping LAUSD bulletins:', err.message);
    return [];
  }
}

// Endpoint to trigger scraping and get all LAUSD high schools with rules links
app.get('/api/highschools', async (req, res) => {
  try {
    const schools = await scrapeHighSchools();
    // For demo, limit to 10 schools to avoid rate-limiting and slowness
    // Remove .slice(0, 10) to process all schools (may take several minutes)
    const enriched = await Promise.all(
      schools.slice(0, 10).map(enrichSchoolWithRules)
    );
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to scrape high schools', details: err.message });
  }
});

// Endpoint to get LA High Schools data from CSV
app.get('/api/highschools/csv', async (req, res) => {
  const csvPath = 'path_to_your_csv_file.csv'; // TODO: Set the correct path to your CSV file
  try {
    const schools = await getLAHighSchoolsFromCSV(csvPath);
    res.json(schools);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read high schools from CSV', details: err.message });
  }
});

// API endpoint to get all bulletin PDFs
app.get('/api/bulletins', async (req, res) => {
  try {
    const bulletins = await scrapeLAUSDBulletins();
    res.json(bulletins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to scrape bulletins', details: err.message });
  }
});

// Endpoint to accept user questions

app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required.' });
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // or 'gpt-4o-mini' if available
        messages: [
          { role: 'system', content: 'You are a helpful assistant for LAUSD school rules.' },
          { role: 'user', content: question }
        ],
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const answer = response.data.choices[0].message.content;
    res.json({ question, answer });
  } catch (err) {
    console.error('OpenAI API error:', err.message);
    res.status(500).json({ error: 'Failed to get answer from GPT-4o-mini', details: err.message });
  }
});

// Extract text from all PDF files in a directory
async function extractAllPdfs(pdfDir) {
  const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));
  const results = [];
  for (const file of files) {
    const filePath = path.join(pdfDir, file);
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    results.push({
      filename: file,
      text: data.text
    });
  }
  return results;
}

// 1. Chunk text
function chunkText(text, size = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

// 2. Embed text
async function embedTexts(texts) {
  const response = await openai.createEmbedding({
    model: 'text-embedding-3-small',
    input: texts,
  });
  return response.data.data.map(obj => obj.embedding);
}

// 3. Find most similar chunk (cosine similarity)
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 4. Main RAG function
async function answerWithRAG(question) {
  const pdfs = await extractAllPdfs('./pdfs');
  const allChunks = [];
  pdfs.forEach(pdf => {
    chunkText(pdf.text).forEach(chunk => allChunks.push({ chunk, filename: pdf.filename }));
  });

  const chunkTexts = allChunks.map(obj => obj.chunk);
  const chunkEmbeddings = await embedTexts(chunkTexts);
  const questionEmbedding = (await embedTexts([question]))[0];

  // Find top 3 most similar chunks
  const similarities = chunkEmbeddings.map(e => cosineSimilarity(e, questionEmbedding));
  const topIndices = similarities
    .map((sim, idx) => ({ sim, idx }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, 3)
    .map(obj => obj.idx);

  const context = topIndices.map(idx => chunkTexts[idx]).join('\n---\n');

  // Call GPT-4o-mini with context
  const completion = await openai.createChatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant for LAUSD school rules.' },
      { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` }
    ],
    max_tokens: 300
  });

  return completion.data.choices[0].message.content;
}

// Example usage:
// answerWithRAG('How many times can my son be late without getting in trouble?').then(console.log);

app.get('/', (req, res) => {
  res.send(`
    <h2>LAUSD High Schools Scraper API</h2>
    <p>GET <a href="/api/highschools">/api/highschools</a> to fetch scraped data (demo: first 10 schools)</p>
    <p>GET <a href="/api/highschools/csv">/api/highschools/csv</a> to fetch high schools data from CSV</p>
    <p>GET <a href="/api/bulletins">/api/bulletins</a> to fetch LAUSD bulletins (PDFs)</p>
    <p>Remove .slice(0, 10) in server.js to scrape all schools, but expect long wait times!</p>
  `);
});
// CREATE a new conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const conversation = new Conversation({ title: req.body.title || 'Untitled', messages: [] });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// READ all conversations
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ createdAt: -1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ a single conversation
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (add a message to) a conversation
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

// DELETE a conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GET http://localhost:${PORT}/api/highschools`);
  console.log(`GET http://localhost:${PORT}/api/highschools/csv`);
  console.log(`GET http://localhost:${PORT}/api/bulletins`);
});