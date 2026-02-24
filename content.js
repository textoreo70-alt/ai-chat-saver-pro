// content.js - VERSION CORRIGÉE

const t = (key, substitutions) => {
  try {
    const message = chrome.i18n?.getMessage ? chrome.i18n.getMessage(key, substitutions) : '';
    return message || key;
  } catch {
    return key;
  }
};

// Détection de la plateforme
function detectPlatform() {
  const hostname = window.location.hostname;
  if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
    return 'chatgpt';
  } else if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
    return 'grok';
  } else if (hostname.includes('claude.ai')) {
    return 'claude';
  } else if (hostname.includes('gemini.google.com')) {
    return 'gemini';
  }
  return null;
}

// Fonction d'extraction pour Gemini - CORRIGÉE
function extractGeminiConversation() {
  const messages = [];
  
  // APPROCHE CORRIGÉE : Prendre UNIQUEMENT les conversations visibles/complètes
  const conversationContainers = document.querySelectorAll('.conversation-container[id]');
  
  // Filtrer pour éviter les doublons
  const seenContainers = new Set();
  
  conversationContainers.forEach(container => {
    const containerId = container.id;
    if (seenContainers.has(containerId)) return;
    seenContainers.add(containerId);
    
    // Chercher le message utilisateur dans ce conteneur
    const userQuery = container.querySelector('[id^="user-query-content-"] .query-text');
    if (userQuery) {
      const content = userQuery.innerText.trim();
      if (content && content !== '>' && !content.includes('&gt;')) {
        messages.push({ 
          role: 'user', 
          content: content.replace(/&gt;/g, '>').trim()
        });
      }
    }
    
    // Chercher la réponse du modèle dans le même conteneur
    const modelResponse = container.querySelector('.model-response-text .markdown');
    if (modelResponse) {
      const content = modelResponse.innerText.trim();
      if (content) {
        messages.push({ role: 'assistant', content });
      }
    }
  });
  
  // Si on n'a pas trouvé de messages avec l'approche conteneur
  if (messages.length === 0) {
    // Approche alternative : messages utilisateur
    const userElements = document.querySelectorAll('.query-text-line');
    userElements.forEach(el => {
      const content = el.innerText.trim();
      if (content && content !== '>' && !content.includes('&gt;')) {
        messages.push({ 
          role: 'user', 
          content: content.replace(/&gt;/g, '>').trim()
        });
      }
    });
    
    // Messages assistant
    const assistantElements = document.querySelectorAll('.model-response-text .markdown');
    assistantElements.forEach(el => {
      const content = el.innerText.trim();
      if (content) {
        messages.push({ role: 'assistant', content });
      }
    });
  }
  
  // Éliminer les doublons
  const uniqueMessages = [];
  const seenContent = new Set();
  
  messages.forEach(msg => {
    const key = `${msg.role}:${msg.content}`;
    if (!seenContent.has(key)) {
      seenContent.add(key);
      uniqueMessages.push(msg);
    }
  });
  
  return uniqueMessages;
}

// Fonction d'extraction pour ChatGPT - CORRIGÉE
function extractChatGPTConversation() {
  const messages = [];
  
  const elements = document.querySelectorAll('[data-message-author-role]');
  elements.forEach(el => {
    const role = el.getAttribute('data-message-author-role');
    if (role !== 'user' && role !== 'assistant') return;
    
    const contentEl = el.querySelector('.markdown') || el;
    const content = contentEl.innerText.trim();
    
    if (content) {
      messages.push({ role, content });
    }
  });
  
  return messages;
}

// Fonction d'extraction pour Grok - CORRIGÉE
function extractGrokConversation() {
  const messages = [];
  
  const responseElements = document.querySelectorAll('[id^="response-"]');
  responseElements.forEach(el => {
    const contentEl = el.querySelector('.response-content-markdown') || el.querySelector('.markdown') || el;
    const content = contentEl.innerText.trim();
    
    if (content) {
      messages.push({ role: 'assistant', content });
    }
  });
  
  const messageBubbles = document.querySelectorAll('.message-bubble');
  messageBubbles.forEach(el => {
    const isUserMessage = el.classList.contains('rounded-br-lg') || el.style.textAlign === 'end';
    const role = isUserMessage ? 'user' : 'assistant';
    
    const contentEl = el.querySelector('p[dir="auto"]') || el;
    const content = contentEl.innerText.trim();
    
    if (content) {
      messages.push({ role, content });
    }
  });
  
  return messages;
}

// Fonction d'extraction pour Claude - CORRIGÉE
function extractClaudeConversation() {
  const messages = [];
  
  const userElements = document.querySelectorAll('[data-testid="user-message"]');
  userElements.forEach(el => {
    const contentEl = el.querySelector('p') || el;
    const content = contentEl.innerText.trim();
    
    if (content) {
      messages.push({ role: 'user', content });
    }
  });
  
  const assistantElements = document.querySelectorAll('.font-claude-response-body');
  assistantElements.forEach(el => {
    const content = el.innerText.trim();
    
    if (content && !content.includes('The user is asking') && 
        !content.includes('I don\'t need to use any tools')) {
      messages.push({ role: 'assistant', content });
    }
  });
  
  return messages;
}

// Gestion des messages de l'extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'extract_conversation') {
    try {
      const platform = detectPlatform();
      let convo;
      
      if (platform === 'chatgpt') {
        convo = extractChatGPTConversation();
      } else if (platform === 'grok') {
        convo = extractGrokConversation();
      } else if (platform === 'claude') {
        convo = extractClaudeConversation();
      } else if (platform === 'gemini') {
        convo = extractGeminiConversation();
      } else {
        throw new Error(t('platformNotSupported'));
      }
      
      sendResponse({ convo });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
  return true;
});

// Bouton de sauvegarde - CORRIGÉ
function injectSaveButton() {
  const platform = detectPlatform();
  if (!platform) return;
  
  const buttonId = 'chat-saver-button';
  
  // Éviter les boutons dupliqués
  if (document.getElementById(buttonId)) return;
  
  const oldButton = document.getElementById(buttonId);
  if (oldButton) oldButton.remove();
  
  const button = document.createElement('button');
  button.id = buttonId;
  
  const buttonTexts = {
    'chatgpt': t('saveChatChatGPT'),
    'grok': t('saveChatGrok'),
    'claude': t('saveChatClaude'),
    'gemini': t('saveChatGemini')
  };
  
  button.textContent = buttonTexts[platform] || t('saveChatGeneric');
  
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '100px',
    right: '20px',
    zIndex: '10000',
    padding: '12px 20px',
    background: '#10a37f',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    fontFamily: 'sans-serif'
  });
  
  button.addEventListener('click', async () => {
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = t('saving');
    
    try {
      const platform = detectPlatform();
      let convo;
      
      if (platform === 'chatgpt') {
        convo = extractChatGPTConversation();
      } else if (platform === 'grok') {
        convo = extractGrokConversation();
      } else if (platform === 'claude') {
        convo = extractClaudeConversation();
      } else if (platform === 'gemini') {
        convo = extractGeminiConversation();
      }
      
      chrome.runtime.sendMessage({
        type: 'save_conversation',
        convo,
        source: platform
      }, (response) => {
        if (response && response.success) {
          button.textContent = t('saved');
          setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
          }, 2000);
        } else {
          throw new Error(response?.error || t('saveFailed'));
        }
      });
      
    } catch (error) {
      console.error('Save error:', error);
      button.textContent = t('errorShort');
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
    }
  });
  
  document.body.appendChild(button);
}

// Initialisation
function initialize() {
  if (!detectPlatform()) return;
  
  // Éviter les initialisations multiples
  if (window.chatSaverInitialized) return;
  window.chatSaverInitialized = true;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(injectSaveButton, 1000);
    });
  } else {
    setTimeout(injectSaveButton, 1000);
  }
}

initialize();
