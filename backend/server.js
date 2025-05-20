require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// OpenAI Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// LAUSD Knowledge Base
const lausdKnowledge = `
LAUSD Non-Traditional Schools Information:
1. Continuation Schools:
   - For students 16+ who need flexible schedules
   - Max 5 unexcused absences per semester
   - Can make up credits through independent study

2. Adult Education:
   - For students 18+
   - Evening classes available
   - No attendance limit but must complete coursework

3. Alternative Schools:
   - For students needing specialized programs
   - Typically allow 3 late arrivals before consequences
   - Focus on project-based learning

Common Policies:
- All schools require enrollment paperwork
- Immunization records mandatory
- Spanish-speaking staff available at most locations
`;

// Chat Endpoint - Specialized for LAUSD
app.post('/api/chat', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Se requiere una pregunta' });
    }

    // Get English response
    const englishResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an LAUSD enrollment specialist. Use this knowledge: ${lausdKnowledge} 
          Provide concise, accurate answers in English. If unsure, say "Contact the school directly".`
        },
        { role: "user", content: question }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    const englishAnswer = englishResponse.choices[0].message.content;

    // Get Spanish translation
    const spanishResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Traduce esto al español manteniendo terminología educativa. 
          Usa un lenguaje claro para padres latinos.`
        },
        { role: "user", content: englishAnswer }
      ],
      temperature: 0.3,
      max_tokens: 200
    });

    const spanishTranslation = spanishResponse.choices[0].message.content;

    res.json({
      question,
      englishAnswer,
      spanishTranslation,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Error del servidor',
      spanishTranslation: 'Lo sentimos, hubo un error. Por favor intente nuevamente más tarde.',
      details: error.message
    });
  }
});

// School Information Endpoint (static data)
app.get('/api/schools', (req, res) => {
  const schools = [
    {
      id: 1,
      name: "Avance Continuation High School",
      type: "continuation",
      address: "1234 Main St, Los Angeles, CA 90015",
      phone: "(213) 555-1001",
      programs: ["Independent Study", "Credit Recovery"],
      latePolicy: "Max 5 unexcused late arrivals per semester"
    },
    {
      id: 2,
      name: "Centro de Educación para Adultos",
      type: "adult",
      address: "5678 Broadway, Los Angeles, CA 90012",
      phone: "(213) 555-2002",
      programs: ["GED Preparation", "ESL Classes", "Career Technical Education"],
      schedule: "Morning/Evening classes available"
    }
  ];

  res.json(schools);
});

// Start server
app.listen(PORT, () => {
  console.log(`LAUSD Assistant API running on port ${PORT}`);
  console.log(`Endpoints:
  - POST /api/chat (with JSON body)
  - GET  /api/schools`);
});