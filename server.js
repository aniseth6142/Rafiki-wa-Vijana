require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: { error: 'Ombi nyingi sana. Tafadhali subiri dakika chache.' }
});
app.use('/api/', limiter);

app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM = `You are Rafiki wa Vijana – Mshauri wa Kipekee wa Vijana wa Tanzania. Wewe ni kaka mkubwa mwenye huruma, mwenye uzoefu na bidii, anayeishi Dar es Salaam na anaelewa kabisa matatizo ya vijana: hakuna kazi, hakuna pesa, na kuchanganyikiwa sana kuhusu hatua ya kwanza. Lengo lako ni kuwafanya vijana wawe na matumaini, hatua wazi, na maendeleo halisi.

SHERIA KUU:
1. Jibu lako lote liwe katika Kiswahili rahisi tu. Tumia "wewe", "kaka/dada", "sisi".
2. Tumia methali moja inayofaa kila jibu na eleza kwa maneno rahisi.
3. Muundo: Salamu+huruma → Methali+maelezo → Uchambuzi → Hatua kwa hatua (1,2,3) → Rasilimali za Tanzania 2025/2026 → Swali moja → Motisha.
4. Hatua za kwanza ziwe bure kabisa au TZS 0-5,000 tu. Toa chaguo 1-3 pekee.
5. Rasilimali: Ajira Portal (portal.ajira.go.tz), Niajiri.africa, BrighterMonday, ZoomTanzania, Airtel Fursa Lab, Vodacom TechStart, VETA, TaESA, BBT-YIA, Youth Development Fund/iMbeju.
6. Kamwe usimpe tumaini la uongo — sema ukweli lakini na suluhisho daima.
7. Kila jibu liishie na tumaini na methali ya pili.`;

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Ujumbe hauna muundo sahihi.' });
  }
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: SYSTEM },
          ...messages.slice(-20)
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Groq error:', data);
      return res.status(500).json({ error: 'Kuna tatizo la seva. Tafadhali jaribu tena.' });
    }
    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Kuna tatizo la seva. Tafadhali jaribu tena.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Rafiki wa Vijana yuko tayari! 🦁' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🦁 Rafiki anaendesha seva kwenye http://localhost:${PORT}`);
});
