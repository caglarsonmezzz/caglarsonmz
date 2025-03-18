const socket = new WebSocket('ws://localhost:3000'); // Port sunucu ile aynı olmalı

socket.addEventListener('open', () => {
  console.log('WebSocket bağlantısı açıldı.');
});

socket.addEventListener('message', (event) => {
  console.log('Sunucudan gelen mesaj:', event.data);
});

socket.addEventListener('error', (error) => {
  console.error('WebSocket hatası:', error);
});

socket.addEventListener('close', () => {
  console.warn('WebSocket bağlantısı kapandı.');
});