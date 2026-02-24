// background.js - version corrigée (sans TensorFlow.js)
const t = (key, substitutions) => {
  try {
    const message = chrome.i18n?.getMessage ? chrome.i18n.getMessage(key, substitutions) : '';
    return message || key;
  } catch {
    return key;
  }
};

// Écouteur de messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'save_conversation') {
    const convo = message.convo;
	
	chrome.runtime.sendMessage({ type: 'get_current_folder' }, (folderResponse) => {
      // Utilise le folderId du sidebar, ou 0 par défaut
      const folderId = folderResponse ? (folderResponse.folderId || 0) : 0;
      console.log([folderResponse, folderId])
      const saved = {
        id: Date.now(),
        date: new Date().toISOString(),
        title: generateTitle(convo),
        convo,
        tags: getTags(convo),
        manualTags: [],
        folderId: folderId  // <-- ICI le bon folderId !
      };
      
      saveToStorage(saved).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
		  console.error('Erreur lors de la sauvegarde :', error);
		  sendResponse({ success: false, error: error.message || t('unknownError') });
		});
    });
	

    return true; // Garder le canal ouvert pour la réponse asynchrone
  }

  else if (message.type === 'get_conversations') {
    chrome.storage.local.get('conversations', data => {
      sendResponse({ conversations: data.conversations || [] });
    });
    return true;
  }

  else if (message.type === 'get_folders') {
    chrome.storage.local.get('folders', data => {
      sendResponse(data.folders || []);
    });
    return true;
  }

  else if (message.type === 'update_conversation') {
    updateConversation(message.convo).then(() => sendResponse({ success: true }));
    return true;
  }

  else if (message.type === 'delete_conversation') {
    deleteConversation(message.id).then(() => sendResponse({ success: true }));
    return true;
  }

  else if (message.type === 'create_folder') {
    createFolder(message.name).then(id => sendResponse({ success: true, id }));
    return true;
  }

  else if (message.type === 'update_folder') {
    updateFolder(message).then(() => sendResponse({ success: true }));
    return true;
  }

  else if (message.type === 'delete_folder') {
    deleteFolder(message.id).then(() => sendResponse({ success: true }));
    return true;
  }

  else if (message.type === 'get_options') {
    chrome.storage.local.get('options', data => {
      sendResponse(data.options || { autoSave: false });
    });
    return true;
  }

  else if (message.type === 'set_options') {
    chrome.storage.local.set({ options: message.options }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Tags basés sur mots-clés (remplace l'approche ML)
function getTags(convo) {
  if (!convo || convo.length === 0) return ['untagged'];

  const text = convo.map(m => m.content).join(' ').toLowerCase();
  const tags = new Set();

  // code / programmation
  if (/(code|programming|script|python|js|javascript|typescript|java|c#|cpp|rust|go|function|class|const|let|var|async|await|promise|api|debug|error|stack|trace|bug|fix)/i.test(text)) {
    tags.add('code');
  }

  // recherche / académique
  if (/(research|study|paper|analysis|experiment|data|findings|report|investigate|science|theory|hypothesis|methodology|literature|review)/i.test(text)) {
    tags.add('research');
  }

  // idées / brainstorming
  if (/(idea|brainstorm|creative|thought|innovation|concept|proposal|inspire|mindmap|vision)/i.test(text)) {
    tags.add('idea');
  }

  // business / professionnel
  if (/(business|strategy|marketing|finance|startup|sales|entrepreneur|revenue|profit|market|customer|product|pitch)/i.test(text)) {
    tags.add('business');
  }

  // personnel / vie
  if (/(personal|life|advice|health|fitness|relationship|motivation|habit|goal|mindset|therapy|journal)/i.test(text)) {
    tags.add('personal');
  }

  // éducation / apprentissage
  if (/(education|learning|study|teach|course|lesson|knowledge|exam|homework|tutor|student|university)/i.test(text)) {
    tags.add('education');
  }

  // tech / IA
  if (/(tech|ai|machine learning|llm|gpt|model|neural|transformer|prompt|embedding|rag|vector|api|openai|claude|grok)/i.test(text)) {
    tags.add('tech');
  }

  return tags.size > 0 ? Array.from(tags) : ['untagged'];
}

function generateTitle(convo) {
  const userMsg = convo.find(m => m.role === 'user')?.content || '';
  const assistantMsg = convo.find(m => m.role === 'assistant')?.content || '';
  const combined = (userMsg + ' ' + assistantMsg).substring(0, 80).replace(/\n/g, ' ');
  return combined + (combined.length >= 80 ? '...' : '') || t('untitled');
}

function saveToStorage(saved) {
  return new Promise(resolve => {
    chrome.storage.local.get('conversations', (data) => {
      let convos = data.conversations || [];
      // Anti-doublons : si contenu identique → mise à jour
      const existingIndex = convos.findIndex(c =>
        c.convo.length === saved.convo.length &&
        c.convo.every((m, i) => m.role === saved.convo[i].role && m.content === saved.convo[i].content)
      );
      if (existingIndex !== -1) {
        convos[existingIndex] = saved;
      } else {
        convos.push(saved);
      }
      chrome.storage.local.set({ conversations: convos }, resolve);
    });
  });
}

function updateConversation(updated) {
  return new Promise(resolve => {
    chrome.storage.local.get('conversations', (data) => {
      const convos = data.conversations || [];
      const index = convos.findIndex(c => c.id === updated.id);
      if (index !== -1) {
        convos[index] = updated;
        chrome.storage.local.set({ conversations: convos }, resolve);
      } else {
        resolve();
      }
    });
  });
}

function deleteConversation(id) {
  return new Promise(resolve => {
    chrome.storage.local.get('conversations', (data) => {
      let convos = data.conversations || [];
      convos = convos.filter(c => c.id !== id);
      chrome.storage.local.set({ conversations: convos }, resolve);
    });
  });
}

async function createFolder(name) {
  return new Promise(resolve => {
    chrome.storage.local.get('folders', data => {
      const folders = data.folders || [];
      const newFolder = { id: Date.now(), name };
      folders.push(newFolder);
      chrome.storage.local.set({ folders }, () => resolve(newFolder.id));
    });
  });
}

async function updateFolder({ id, name }) {
  return new Promise(resolve => {
    chrome.storage.local.get('folders', data => {
      const folders = data.folders || [];
      const index = folders.findIndex(f => f.id === id);
      if (index !== -1) folders[index].name = name;
      chrome.storage.local.set({ folders }, resolve);
    });
  });
}

async function deleteFolder(id) {
  return new Promise(resolve => {
    chrome.storage.local.get(['folders', 'conversations'], data => {
      let folders = data.folders || [];
      folders = folders.filter(f => f.id !== id);
      let convos = data.conversations || [];
      convos = convos.filter(c => c.folderId !== id);
      chrome.storage.local.set({ folders, conversations: convos }, resolve);
    });
  });
}

// Ajouter ceci dans background.js

// Gérer la reconnexion des content scripts
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed/updated');
});

chrome.runtime.onConnect.addListener((port) => {
  console.log('Content script connected');
  
  port.onDisconnect.addListener(() => {
    console.log('Content script disconnected');
  });
});

// Envoyer un message de "ping" périodique pour maintenir la connexion
setInterval(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      try {
        chrome.tabs.sendMessage(tab.id, { type: 'ping' }, () => {
          // Ignorer les erreurs silencieusement
          const lastError = chrome.runtime.lastError;
          if (lastError && !lastError.message.includes('Receiving end does not exist')) {
            console.warn('Ping failed:', lastError.message);
          }
        });
      } catch (error) {
        // Ignorer les erreurs
      }
    });
  });
}, 30000); // Toutes les 30 secondes

// Gestion du sidebar
chrome.action.onClicked.addListener(() => {
  chrome.sidePanel.open({ windowId: chrome.windows.WINDOW_ID_CURRENT });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'close_sidebar') {
    chrome.sidePanel.setOptions({
      enabled: false
    });
    setTimeout(() => {
      chrome.sidePanel.setOptions({
        enabled: true
      });
    }, 100);
  }
  
  if (message.type === 'clear_all_data') {
    chrome.storage.local.clear(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// background.js
chrome.action.onClicked.addListener(async (tab) => {
  // Ouvrir le sidePanel
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// Optionnel : permettre au sidePanel sur tous les sites
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
