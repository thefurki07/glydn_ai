/* =============================================
   GLYDN AI — CHAT LOGIC
   ============================================= */

// ==================== STATE ====================
let chats = JSON.parse(localStorage.getItem('glydn_chats') || '[]');
let activeChatId = null;
let pendingDeleteId = null;
let settings = JSON.parse(localStorage.getItem('glydn_settings') || JSON.stringify({
  theme: 'dark', accent: '#00ff88', fontSize: 15, aiName: 'Glydn AI', bubble: 'rounded'
}));

const SUGGESTION_POOL = [
  { icon: '💻', text: 'Kod yazmayı öğren',       prompt: 'Python öğrenmek istiyorum, nereden başlamalıyım?' },
  { icon: '✍️', text: 'Yaratıcı içerik oluştur', prompt: 'Bana yaratıcı bir kısa hikaye yaz.' },
  { icon: '🤖', text: 'Yapay zekayı keşfet',      prompt: 'Yapay zeka nedir ve nasıl çalışır?' },
  { icon: '⚡', text: 'Verimlilik artır',         prompt: 'Verimli çalışmak için ipuçları ver.' },
  { icon: '🧠', text: 'Felsefe konuş',            prompt: 'Özgür irade var mı?' },
  { icon: '🌍', text: 'Dünyayı anla',             prompt: 'Küresel ısınma neden bu kadar önemli?' },
  { icon: '🎮', text: 'Oyun öner',                prompt: 'Hangi video oyunlarını oynamalıyım?' },
  { icon: '📚', text: 'Kitap tavsiyesi al',       prompt: 'Bana iyi bir roman öner.' },
  { icon: '🔧', text: 'Sorun gider',              prompt: 'Kodum neden çalışmıyor, birlikte bakalım mı?' },
  { icon: '🚀', text: 'Proje fikri bul',          prompt: 'Programlama projesi için fikir ver.' },
];

// ==================== DOM ====================
const chatList          = document.getElementById('chatList');
const messagesList      = document.getElementById('messagesList');
const messagesContainer = document.getElementById('messagesContainer');
const welcomeScreen     = document.getElementById('welcomeScreen');
const messageInput      = document.getElementById('messageInput');
const sendBtn           = document.getElementById('sendBtn');
const newChatBtn        = document.getElementById('newChatBtn');
const deleteAllBtn      = document.getElementById('deleteAllBtn');
const settingsBtn       = document.getElementById('settingsBtn');
const chatHeaderTitle   = document.getElementById('chatHeaderTitle');
const deleteCurrent     = document.getElementById('deleteCurrent');
const sidebarToggle     = document.getElementById('sidebarToggle');
const sidebar           = document.getElementById('sidebar');
const sidebarOverlay    = document.getElementById('sidebarOverlay');
const suggestionGrid    = document.getElementById('suggestionGrid');
const settingsModal     = document.getElementById('settingsModal');
const modalClose        = document.getElementById('modalClose');
const confirmModal      = document.getElementById('confirmModal');
const confirmClose      = document.getElementById('confirmClose');
const confirmCancel     = document.getElementById('confirmCancel');
const confirmDeleteAll  = document.getElementById('confirmDeleteAll');
const saveSettings      = document.getElementById('saveSettings');
const deleteSingleModal   = document.getElementById('deleteSingleModal');
const deleteSingleClose   = document.getElementById('deleteSingleClose');
const deleteSingleCancel  = document.getElementById('deleteSingleCancel');
const deleteSingleConfirm = document.getElementById('deleteSingleConfirm');

// ==================== INIT ====================
function init() {
  applySettings();
  renderSuggestions();
  renderChatList();
  chats.length > 0 ? loadChat(chats[0].id) : showWelcome();
}

// ==================== SUGGESTIONS ====================
function renderSuggestions() {
  if (!suggestionGrid) return;
  const picked = [...SUGGESTION_POOL].sort(() => Math.random() - 0.5).slice(0, 4);
  suggestionGrid.innerHTML = picked.map(s => `
    <div class="suggestion-card" data-text="${escapeAttr(s.prompt)}">
      <div class="sug-icon">${s.icon}</div>
      <div class="sug-text">${s.text}</div>
    </div>
  `).join('');
  suggestionGrid.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => { messageInput.value = card.dataset.text; sendMessage(); });
  });
}

// ==================== SETTINGS ====================
function applySettings() {
  document.body.setAttribute('data-theme', settings.theme);
  document.body.setAttribute('data-bubble', settings.bubble);
  document.documentElement.style.setProperty('--primary', settings.accent);
  document.documentElement.style.setProperty('--primary-dim', hexToRgba(settings.accent, 0.15));
  document.documentElement.style.setProperty('--primary-glow', hexToRgba(settings.accent, 0.4));
  document.documentElement.style.setProperty('--neon-shadow', `0 0 20px ${hexToRgba(settings.accent, 0.35)}, 0 0 40px ${hexToRgba(settings.accent, 0.1)}`);
  document.documentElement.style.setProperty('--neon-shadow-sm', `0 0 10px ${hexToRgba(settings.accent, 0.3)}`);
  document.documentElement.style.setProperty('--border-strong', hexToRgba(settings.accent, 0.25));
  document.documentElement.style.setProperty('--border', hexToRgba(settings.accent, 0.12));
  document.documentElement.style.setProperty('--font-size', settings.fontSize + 'px');
  document.documentElement.style.fontSize = settings.fontSize + 'px';
}
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}
function saveSettingsToStorage() { localStorage.setItem('glydn_settings', JSON.stringify(settings)); }

// ==================== CHAT MANAGEMENT ====================
function createChat() {
  const id = 'chat_' + Date.now();
  chats.unshift({ id, name: 'Yeni Sohbet', messages: [], createdAt: Date.now() });
  saveChats(); renderChatList(); loadChat(id); return id;
}

function loadChat(id) {
  const chat = chats.find(c => c.id === id);
  if (!chat) return;
  activeChatId = id;
  chatHeaderTitle.textContent = chat.name;
  renderMessages(chat.messages);
  renderChatList();
  chat.messages.length === 0 ? showWelcome() : (hideWelcome(), scrollToBottom());
}

function confirmDeleteSingle(id) {
  pendingDeleteId = id;
  deleteSingleModal.classList.add('open');
}

function deleteChat(id) {
  chats = chats.filter(c => c.id !== id);
  saveChats(); renderChatList();
  if (activeChatId === id) {
    chats.length > 0 ? loadChat(chats[0].id) : (activeChatId = null, chatHeaderTitle.textContent = 'Yeni Sohbet', messagesList.innerHTML = '', showWelcome());
  }
}

function renameChat(id, newName) {
  const chat = chats.find(c => c.id === id);
  if (chat) { chat.name = newName.trim() || 'Yeni Sohbet'; saveChats(); if (activeChatId === id) chatHeaderTitle.textContent = chat.name; renderChatList(); }
}

function autoNameChat(id, firstMessage) {
  const chat = chats.find(c => c.id === id);
  if (!chat || chat.name !== 'Yeni Sohbet') return;
  const msg = firstMessage.trim().toLowerCase();
  const greetings = ['selam','merhaba','hey','hi','hello','naber','nasılsın','günaydın','iyi günler','iyi akşamlar'];
  if (greetings.some(g => msg.startsWith(g) || msg === g)) {
    const opts = ['Selamlama','Karşılama','Yeni Tanışma','Sohbet Başlangıcı'];
    chat.name = opts[Math.floor(Math.random() * opts.length)];
  } else {
    const stop = ['bir','ve','ile','için','ama','da','de','ki','bu','şu','o','ben','sen','biz','siz','ne','nasıl','neden','nedir','var','yok','mı','mi','mu','mü','gibi','kadar','ya','veya'];
    const words = firstMessage.trim().split(/\s+/).filter(w => !stop.includes(w.toLowerCase()) && w.length > 2);
    const key = words.slice(0, 4).join(' ');
    const isQ = ['nedir','nasıl','neden','ne ','nerede','kim'].some(q => msg.includes(q)) || msg.endsWith('?');
    const name = (key.length > 2 ? key : firstMessage.trim().slice(0, 28)) + (isQ ? '?' : '');
    chat.name = name.length > 32 ? name.slice(0,32) + '…' : name;
  }
  saveChats();
  if (activeChatId === id) chatHeaderTitle.textContent = chat.name;
  renderChatList();
}

function saveChats() { localStorage.setItem('glydn_chats', JSON.stringify(chats)); }

// ==================== RENDER ====================
function renderChatList() {
  chatList.innerHTML = '';
  if (chats.length === 0) { chatList.innerHTML = '<div class="chat-list-empty">Henüz sohbet yok.<br/>Yeni bir sohbet başlatın.</div>'; return; }
  chats.forEach(chat => {
    const item = document.createElement('div');
    item.className = 'chat-item' + (chat.id === activeChatId ? ' active' : '');
    item.dataset.id = chat.id;
    item.innerHTML = `
      <div class="chat-item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
      <span class="chat-item-name">${escapeHtml(chat.name)}</span>
      <div class="chat-item-actions">
        <button class="item-action-btn edit-btn" title="Yeniden adlandır"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="item-action-btn del-btn del" title="Sil"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg></button>
      </div>
    `;
    item.addEventListener('click', (e) => { if (e.target.closest('.chat-item-actions')) return; loadChat(chat.id); if (window.innerWidth < 768) closeSidebar(); });
    item.querySelector('.edit-btn').addEventListener('click', (e) => { e.stopPropagation(); startInlineRename(item, chat.id, chat.name); });
    item.querySelector('.del-btn').addEventListener('click', (e) => { e.stopPropagation(); confirmDeleteSingle(chat.id); });
    chatList.appendChild(item);
  });
}

function startInlineRename(item, id, currentName) {
  const nameEl = item.querySelector('.chat-item-name');
  const actionsEl = item.querySelector('.chat-item-actions');
  const input = document.createElement('input');
  input.type = 'text'; input.className = 'chat-item-edit-input'; input.value = currentName;
  nameEl.replaceWith(input); actionsEl.style.opacity = '0'; input.focus(); input.select();
  const finish = () => renameChat(id, input.value.trim() || currentName);
  input.addEventListener('blur', finish);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } if (e.key === 'Escape') { input.value = currentName; input.blur(); } });
}

function renderMessages(messages) { messagesList.innerHTML = ''; messages.forEach(msg => appendMessageToDOM(msg)); }

function appendMessageToDOM(msg) {
  const div = document.createElement('div');
  div.className = `message ${msg.role}`;
  const avatarLabel = msg.role === 'ai' ? (settings.aiName.charAt(0) || 'G') : 'S';
  const isUser = msg.role === 'user';

  div.innerHTML = `
    <div class="msg-avatar">${avatarLabel}</div>
    <div class="msg-content">
      <div class="msg-sender">${msg.role === 'ai' ? settings.aiName : 'Siz'}</div>
      <div class="msg-bubble">${formatMessage(msg.content)}</div>
      <div class="msg-actions">
        <button class="msg-action-btn copy-btn" title="Kopyala">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        ${isUser ? `<button class="msg-action-btn edit-msg-btn" title="Düzenle">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>` : ''}
      </div>
    </div>
  `;

  div.querySelector('.copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      const btn = div.querySelector('.copy-btn');
      btn.classList.add('copied');
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
      setTimeout(() => { btn.classList.remove('copied'); btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`; }, 2000);
    });
  });

  if (isUser) {
    div.querySelector('.edit-msg-btn').addEventListener('click', () => startMessageEdit(div, msg));
  }

  messagesList.appendChild(div);
}

function startMessageEdit(div, msg) {
  const bubble = div.querySelector('.msg-bubble');
  const actions = div.querySelector('.msg-actions');
  const originalContent = msg.content;
  bubble.style.display = 'none'; actions.style.display = 'none';

  const textarea = document.createElement('textarea');
  textarea.className = 'msg-edit-area';
  textarea.value = originalContent;
  textarea.rows = Math.min(originalContent.split('\n').length + 1, 6);

  const editActions = document.createElement('div');
  editActions.className = 'msg-edit-actions';
  editActions.innerHTML = `<button class="msg-edit-cancel">İptal</button><button class="msg-edit-save">Gönder</button>`;

  const content = div.querySelector('.msg-content');
  content.appendChild(textarea); content.appendChild(editActions); textarea.focus();

  editActions.querySelector('.msg-edit-cancel').addEventListener('click', () => {
    textarea.remove(); editActions.remove(); bubble.style.display = ''; actions.style.display = '';
  });

  editActions.querySelector('.msg-edit-save').addEventListener('click', async () => {
    const newContent = textarea.value.trim();
    if (!newContent || newContent === originalContent) {
      textarea.remove(); editActions.remove(); bubble.style.display = ''; actions.style.display = ''; return;
    }
    const chat = chats.find(c => c.id === activeChatId);
    if (!chat) return;
    const msgIndex = chat.messages.findIndex(m => m.content === originalContent && m.role === 'user');
    if (msgIndex === -1) return;
    chat.messages = chat.messages.slice(0, msgIndex);
    saveChats();

    // DOM temizle
    const allMsgs = [...messagesList.querySelectorAll('.message')];
    const divIdx = allMsgs.indexOf(div);
    allMsgs.slice(divIdx + 1).forEach(el => el.remove());

    textarea.remove(); editActions.remove(); bubble.style.display = ''; actions.style.display = '';
    msg.content = newContent; bubble.innerHTML = formatMessage(newContent);
    await sendMessageContent(newContent);
  });
}

function formatMessage(text) {
  return escapeHtml(text)
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}
function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }
function escapeAttr(text) { return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function showWelcome() { welcomeScreen.style.display = 'flex'; messagesList.style.display = 'none'; }
function hideWelcome() { welcomeScreen.style.display = 'none'; messagesList.style.display = 'flex'; }
function scrollToBottom() { setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 50); }

// ==================== MESSAGING ====================
async function sendMessage() {
  const content = messageInput.value.trim();
  if (!content) return;
  messageInput.value = ''; autoResizeTextarea();
  await sendMessageContent(content);
}

async function sendMessageContent(content) {
  if (!activeChatId) createChat();
  const chat = chats.find(c => c.id === activeChatId);
  if (!chat) return;

  const userMsg = { role: 'user', content };
  chat.messages.push(userMsg); saveChats();
  if (chat.messages.filter(m => m.role === 'user').length === 1) autoNameChat(activeChatId, content);

  hideWelcome(); appendMessageToDOM(userMsg); scrollToBottom();
  sendBtn.disabled = true; messageInput.disabled = true;

  const typingDiv = document.createElement('div');
  typingDiv.className = 'message ai';
  typingDiv.innerHTML = `<div class="msg-avatar">${settings.aiName.charAt(0)||'G'}</div><div class="msg-content"><div class="msg-sender">${settings.aiName}</div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>`;
  messagesList.appendChild(typingDiv); scrollToBottom();

  try {
    const apiMessages = chat.messages.slice(0,-1).map(m => ({ role: m.role==='ai'?'assistant':'user', content: m.content }));
    apiMessages.push({ role: 'user', content });
    const response = await fetch('/ask', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ message: content, history: apiMessages }) });
    const data = await response.json();
    const aiContent = data.response || data.message || data.content || 'Bir hata oluştu.';
    typingDiv.remove();
    const aiMsg = { role: 'ai', content: aiContent };
    chat.messages.push(aiMsg); saveChats(); appendMessageToDOM(aiMsg); scrollToBottom();
  } catch(err) {
    typingDiv.remove();
    const errMsg = { role: 'ai', content: 'Bağlantı hatası oluştu. Lütfen tekrar deneyin.' };
    chat.messages.push(errMsg); saveChats(); appendMessageToDOM(errMsg); scrollToBottom();
  }
  sendBtn.disabled = false; messageInput.disabled = false; messageInput.focus();
}

function autoResizeTextarea() { messageInput.style.height = 'auto'; messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px'; }

// ==================== SIDEBAR ====================
function openSidebar() { sidebar.classList.add('open'); sidebarOverlay.classList.add('visible'); document.body.style.overflow = 'hidden'; }
function closeSidebar() { sidebar.classList.remove('open'); sidebarOverlay.classList.remove('visible'); document.body.style.overflow = ''; }

// ==================== EVENTS ====================
messageInput.addEventListener('keydown', (e) => { if (e.key==='Enter'&&!e.shiftKey) { e.preventDefault(); sendMessage(); } });
messageInput.addEventListener('input', autoResizeTextarea);
sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', () => { createChat(); messageInput.focus(); });
deleteCurrent.addEventListener('click', () => { if (activeChatId) confirmDeleteSingle(activeChatId); });

deleteSingleClose.addEventListener('click', () => { deleteSingleModal.classList.remove('open'); pendingDeleteId = null; });
deleteSingleCancel.addEventListener('click', () => { deleteSingleModal.classList.remove('open'); pendingDeleteId = null; });
deleteSingleConfirm.addEventListener('click', () => { if (pendingDeleteId) { deleteChat(pendingDeleteId); pendingDeleteId = null; } deleteSingleModal.classList.remove('open'); });
deleteSingleModal.addEventListener('click', (e) => { if (e.target===deleteSingleModal) { deleteSingleModal.classList.remove('open'); pendingDeleteId = null; } });

sidebarToggle.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
sidebarOverlay.addEventListener('click', closeSidebar);
document.addEventListener('click', (e) => { if (window.innerWidth<768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target) && !sidebarOverlay.contains(e.target)) closeSidebar(); });

deleteAllBtn.addEventListener('click', () => confirmModal.classList.add('open'));
confirmClose.addEventListener('click', () => confirmModal.classList.remove('open'));
confirmCancel.addEventListener('click', () => confirmModal.classList.remove('open'));
confirmDeleteAll.addEventListener('click', () => { chats=[]; saveChats(); activeChatId=null; chatHeaderTitle.textContent='Yeni Sohbet'; messagesList.innerHTML=''; showWelcome(); renderChatList(); confirmModal.classList.remove('open'); });
confirmModal.addEventListener('click', (e) => { if (e.target===confirmModal) confirmModal.classList.remove('open'); });

settingsBtn.addEventListener('click', () => {
  document.getElementById('fontSizeRange').value = settings.fontSize;
  document.getElementById('fontSizeVal').textContent = settings.fontSize + 'px';
  document.getElementById('aiNameInput').value = settings.aiName;
  document.querySelectorAll('.theme-opt').forEach(el => el.classList.toggle('active', el.dataset.theme===settings.theme));
  document.querySelectorAll('.accent-opt').forEach(el => el.classList.toggle('active', el.dataset.color===settings.accent));
  document.querySelectorAll('.bubble-opt').forEach(el => el.classList.toggle('active', el.dataset.bubble===settings.bubble));
  settingsModal.classList.add('open');
});
modalClose.addEventListener('click', () => settingsModal.classList.remove('open'));
settingsModal.addEventListener('click', (e) => { if (e.target===settingsModal) settingsModal.classList.remove('open'); });
document.querySelectorAll('.theme-opt').forEach(el => el.addEventListener('click', () => { document.querySelectorAll('.theme-opt').forEach(x=>x.classList.remove('active')); el.classList.add('active'); settings.theme=el.dataset.theme; }));
document.querySelectorAll('.accent-opt').forEach(el => el.addEventListener('click', () => { document.querySelectorAll('.accent-opt').forEach(x=>x.classList.remove('active')); el.classList.add('active'); settings.accent=el.dataset.color; }));
document.querySelectorAll('.bubble-opt').forEach(el => el.addEventListener('click', () => { document.querySelectorAll('.bubble-opt').forEach(x=>x.classList.remove('active')); el.classList.add('active'); settings.bubble=el.dataset.bubble; }));
document.getElementById('fontSizeRange').addEventListener('input', (e) => { document.getElementById('fontSizeVal').textContent=e.target.value+'px'; settings.fontSize=parseInt(e.target.value); document.documentElement.style.fontSize=settings.fontSize+'px'; });
saveSettings.addEventListener('click', () => { settings.aiName=document.getElementById('aiNameInput').value.trim()||'Glydn AI'; saveSettingsToStorage(); applySettings(); settingsModal.classList.remove('open'); document.querySelectorAll('.message.ai .msg-avatar').forEach(el=>el.textContent=settings.aiName.charAt(0)||'G'); document.querySelectorAll('.message.ai .msg-sender').forEach(el=>el.textContent=settings.aiName); });

// ==================== START ====================
init();
