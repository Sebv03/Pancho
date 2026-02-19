// Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  console.log('LicitIA Extension instalada');
  
  // Configurar valores por defecto
  chrome.storage.sync.get(['apiUrl'], (result) => {
    if (!result.apiUrl) {
      chrome.storage.sync.set({
        apiUrl: 'http://localhost:3000',
        apiKey: '',
      });
    }
  });
});

// Escuchar mensajes desde content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'productCaptured') {
    console.log('Producto capturado:', request.data);
    
    // Mostrar notificación
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon48.png',
      title: 'Producto Capturado',
      message: `${request.data.nombre} agregado a Albaterra`,
    });
  }
  
  return true;
});
