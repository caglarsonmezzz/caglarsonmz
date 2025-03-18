import express from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

// Sunucu başlatma ve kapatma işlemleri
const PORT = 8080;
const serverInstance = server.listen(PORT, () => console.log(`🚀 Sunucu http://localhost:${PORT} üzerinde çalışıyor.`));

// Sunucuyu düzgün şekilde kapatmak için Ctrl + C veya özel bir istek kullanabilirsiniz
process.on('SIGINT', () => {
  console.log('\n🛑 Sunucu kapatılıyor...');
  wss.close(() => {
    serverInstance.close(() => {
      console.log('✅ Sunucu başarıyla kapatıldı.');
      process.exit(0);
    });
  });
});

// Hava durumu verisini çeken fonksiyon
const getWeather = async (city) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return `🌤️ ${city} için hava durumu: ${data.weather[0].description}, sıcaklık: ${data.main.temp}°C.`;
  } catch (error) {
    console.error('🌧️ Hava durumu alınırken hata:', error);
    return null;
  }
};

// Gelen mesajı işleyen fonksiyon
const handleMessage = async (message) => {
  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('hava durumu')) {
    const city = lowerMsg.replace('hava durumu', '').trim();

    if (city) {
      const weatherInfo = await getWeather(city);
      return weatherInfo || '❌ Şehir bulunamadı.';
    } else {
      return '🌍 Lütfen şehir adı girin. Örnek: "Ankara hava durumu"';
    }
  }

  // ChatGPT yanıtı
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error('⚠️ OpenAI API Hatası:', err);
    return 'Bir hata oluştu.';
  }
};

app.use(express.static(path.join(path.resolve(), 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(path.resolve(), 'public', 'index.html'));
});

// WebSocket bağlantısı
wss.on('connection', (ws) => {
  ws.on('message', async (message) => {
    const reply = await handleMessage(message.toString());
    ws.send(reply);
  });
});
