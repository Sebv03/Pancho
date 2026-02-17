// Popup Script - Configuración de la extensión

document.addEventListener('DOMContentLoaded', async () => {
  // Cargar configuración guardada
  const settings = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
  
  if (settings.apiUrl) {
    document.getElementById('apiUrl').value = settings.apiUrl;
  }
  
  if (settings.apiKey) {
    document.getElementById('apiKey').value = settings.apiKey;
  }
});

// Guardar configuración
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const apiUrl = document.getElementById('apiUrl').value.trim();
  const apiKey = document.getElementById('apiKey').value.trim();
  
  // Validar URL
  try {
    new URL(apiUrl);
  } catch {
    showStatus('❌ URL inválida', 'error');
    return;
  }
  
  // Guardar en storage
  await chrome.storage.sync.set({ apiUrl, apiKey });
  
  showStatus('✅ Configuración guardada', 'success');
});

function showStatus(message, type) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
