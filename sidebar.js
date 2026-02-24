// sidebar.js - VERSION CORRIGÉE ET COMPLÈTE
const t = (key, substitutions) => {
  try {
    const message = chrome.i18n?.getMessage ? chrome.i18n.getMessage(key, substitutions) : '';
    return message || key;
  } catch {
    return key;
  }
};

function localizeSidebar() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.setAttribute('title', t(el.dataset.i18nTitle));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
  });
}
class ChatSaverPopup {
  constructor() {
    this.currentConvo = null;
    this.folders = [];
    this.storageLimit = 5 * 1024 * 1024; // 5 MB en bytes
    this.selectedFolderId = 0;
    
    console.log('ChatSaverPopup constructor called');
    console.log('Initial selectedFolderId:', this.selectedFolderId);
    
    this.init();
  }

  async init() {
    console.log('init() started');
    await this.loadFolders();
    console.log('Folders loaded:', this.folders.length);
    await this.loadConversations();
    this.setupEventListeners();
    this.updateStorageInfo();
    this.updateFolderQuickList();
    console.log('init() completed');
  }

  setupEventListeners() {
	  
	// Écoute les requêtes pour le dossier courant
	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	  if (message.type === 'get_current_folder') {
		// DEBUG
		console.log('📁 Background demande le folderId:', this.selectedFolderId);
		
		// Renvoie le folderId actuellement sélectionné
		sendResponse({ 
		  folderId: this.selectedFolderId,
		  timestamp: Date.now()
		});
		return true;
	  }
	  return false;
	});
    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveCurrentConversation();
      });
    }

    // Create folder
    const createFolderBtn = document.getElementById('createFolderBtn');
    if (createFolderBtn) {
      createFolderBtn.addEventListener('click', () => {
        this.createFolder();
      });
    }

    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchConversations(e.target.value);
      });
    }

    // Sélection de dossier
    const folderSelect = document.getElementById('folderSelect');
    if (folderSelect) {
      folderSelect.addEventListener('change', (e) => {
        this.selectedFolderId = parseInt(e.target.value);
        this.loadConversations();
      });
    }

    // Gestionnaire de dossiers
    const manageFoldersBtn = document.getElementById('manageFoldersBtn');
    if (manageFoldersBtn) {
      manageFoldersBtn.addEventListener('click', () => {
        this.showFolderManager();
      });
    }

    // Exporter le dossier sélectionné
    const exportFolderBtn = document.getElementById('exportFolderBtn');
    if (exportFolderBtn) {
      exportFolderBtn.addEventListener('click', () => {
        this.exportSelectedFolder();
      });
    }

    // Detail view buttons
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    if (closeDetailBtn) {
      closeDetailBtn.addEventListener('click', () => {
        this.closeDetailView();
      });
    }

    const exportTxtBtn = document.getElementById('exportTxtBtn');
    if (exportTxtBtn) {
      exportTxtBtn.addEventListener('click', () => {
        this.exportCurrentTxt();
      });
    }

    const exportMdBtn = document.getElementById('exportMdBtn');
    if (exportMdBtn) {
      exportMdBtn.addEventListener('click', () => {
        this.exportCurrentMd();
      });
    }

    const saveTagsBtn = document.getElementById('saveTagsBtn');
    if (saveTagsBtn) {
      saveTagsBtn.addEventListener('click', () => {
        this.saveTags();
      });
    }

    const deleteConvoBtn = document.getElementById('deleteConvoBtn');
    if (deleteConvoBtn) {
      deleteConvoBtn.addEventListener('click', () => {
        this.deleteCurrentConversation();
      });
    }

    // Tags input enter key
    const tagsInput = document.getElementById('tagsInput');
    if (tagsInput) {
      tagsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.saveTags();
        }
      });
    }

    // Clique sur l'indicateur de stockage
    const storageIndicator = document.getElementById('storageIndicator');
    if (storageIndicator) {
      storageIndicator.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showStorageDetails();
      });
    }
	
	    // Bouton refresh
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadConversations();
        this.updateStorageInfo();
        this.updateFolderQuickList();
        console.log('List refreshed');
      });
    }
  }

  // Mettre à jour l'information de stockage
  async updateStorageInfo() {
    try {
      const usage = await this.getStorageUsage();
      const percent = usage.percent;
      const usedMB = usage.mb;
      
      const storagePercent = document.getElementById('storagePercent');
      if (storagePercent) {
        storagePercent.textContent = `${percent}%`;
      }
      
      const storageBar = document.getElementById('storageBar');
      if (storageBar) {
        storageBar.style.width = `${percent}%`;
        
        let color;
        if (percent < 60) {
          color = 'var(--storage-low)';
        } else if (percent < 85) {
          color = 'var(--storage-medium)';
        } else {
          color = 'var(--storage-high)';
        }
        storageBar.style.backgroundColor = color;
      }
      
      const storageDot = document.getElementById('storageDot');
      if (storageDot) {
        let color;
        if (percent < 60) {
          color = 'var(--storage-low)';
        } else if (percent < 85) {
          color = 'var(--storage-medium)';
        } else {
          color = 'var(--storage-high)';
        }
        storageDot.style.backgroundColor = color;
      }
      
      const storageUsed = document.getElementById('storageUsed');
      const storageTotal = document.getElementById('storageTotal');
      const storageLimitMb = (this.storageLimit / 1024 / 1024).toFixed(0);
      if (storageUsed) storageUsed.textContent = t('storageUsed', [usedMB]);
      if (storageTotal) storageTotal.textContent = t('storageLimit', [storageLimitMb]);
      
      this.showStorageWarning(percent, usedMB);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stockage:', error);
    }
  }

  // Obtenir l'utilisation du stockage
  async getStorageUsage() {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytes) => {
        const mb = (bytes / 1024 / 1024).toFixed(2);
        const percent = Math.min(100, ((bytes / this.storageLimit) * 100).toFixed(1));
        resolve({ bytes, mb, percent });
      });
    });
  }

  // Obtenir le nombre de conversations
  async getConversationCount() {
    const storage = await chrome.storage.local.get(['conversations']);
    return (storage.conversations || []).length;
  }

  // Obtenir le nom d'un dossier
  getFolderName(folderId) {
    if (folderId === 0 || folderId === -1) return t('noFolder');
    const folder = this.folders.find(f => f.id === folderId);
    return folder ? folder.name : t('unknownFolder');
  }

  // Afficher un avertissement si mémoire faible
  showStorageWarning(percent, usedMB) {
    const warning = document.getElementById('storageWarning');
    const warningText = document.getElementById('warningText');
    
    if (!warning || !warningText) return;
    
    if (percent >= 90) {
      warning.classList.add('show', 'critical');
      warningText.innerHTML = t('storageWarningCriticalHtml', [usedMB]);
    } else if (percent >= 75) {
      warning.classList.add('show');
      warningText.innerHTML = t('storageWarningAttentionHtml', [percent]);
    } else {
      warning.classList.remove('show', 'critical');
    }
  }

  // Nettoyer les anciennes conversations
  async cleanupOldConversations() {
    if (!confirm(t('cleanupConfirm'))) {
      return;
    }
    
    try {
      const storage = await chrome.storage.local.get(['conversations']);
      let conversations = storage.conversations || [];
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      
      const oldCount = conversations.length;
      conversations = conversations.filter(convo => {
        const convoDate = new Date(convo.date || convo.id);
        return convoDate > cutoffDate;
      });
      
      const removed = oldCount - conversations.length;
      
      await chrome.storage.local.set({ conversations });
      
      await this.loadConversations();
      await this.updateStorageInfo();
      
      alert(t('cleanupRemoved', [removed]));
      
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      alert(t('cleanupError'));
    }
  }

  // Sauvegarder une conversation
  async saveCurrentConversation() {
    const saveBtn = document.getElementById('saveBtn');
    const folderSelect = document.getElementById('folderSelect');
    
    if (!saveBtn || !folderSelect) {
      alert(t('uiNotLoaded'));
      return;
    }
	
	console.log("folderselect" + folderSelect.toString())
    
	let folderId = -1; // "No folder" par défaut
	const selectedValue = folderSelect.value;

	if (selectedValue === "-1") {
	  folderId = -1; // "No folder"
	} else if (selectedValue !== "0") { // Pas "All conversations"
	  folderId = parseInt(selectedValue);
	}
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span>⏳</span> ${t('saving')}`;
    
    try {
      const usage = await this.getStorageUsage();
      if (usage.percent >= 95) {
        throw new Error(t('storageAlmostFullError'));
      }
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error(t('noActiveTab'));
      }
      
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'extract_conversation' });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (!response.convo || response.convo.length === 0) {
        throw new Error(t('noConversationFound'));
      }
      
      const storage = await chrome.storage.local.get(['conversations']);
      const conversations = storage.conversations || [];
      
      const newConvo = {
        id: Date.now(),
        title: this.generateTitle(response.convo),
        date: new Date().toISOString(),
        folderId: folderId,
        convo: response.convo,
        tags: this.extractTags(response.convo),
        manualTags: []
      };
      
      conversations.unshift(newConvo);
      
      await chrome.storage.local.set({ conversations });
      
      saveBtn.innerHTML = `<span>✅</span> ${t('saved')}`;
      await this.loadConversations();
      await this.updateStorageInfo();
      this.updateFolderQuickList();
      
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Save error:', error);
      
      if (error.message.includes('Receiving end does not exist')) {
        alert(t('refreshPageRetry'));
      } else {
        alert(t('errorWithDetails', [error.message]));
      }
      
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  }

  // Afficher les statistiques détaillées
  async showStorageDetails() {
    const usage = await this.getStorageUsage();
    const conversationCount = await this.getConversationCount();
    
    const stats = await this.getDetailedStats();
    
    const recommendation = usage.percent >= 90
      ? t('storageRecommendationCritical')
      : usage.percent >= 75
        ? t('storageRecommendationWarning')
        : t('storageRecommendationOk');

    const message = t('storageDetailsMessage', [
      usage.mb,
      (this.storageLimit / 1024 / 1024).toFixed(0),
      usage.percent,
      conversationCount,
      this.folders.length,
      stats.messageCount,
      stats.tagCount,
      stats.metadataSize,
      recommendation
    ]);
    
    alert(message);
  }

  // Obtenir des statistiques détaillées
  async getDetailedStats() {
    const storage = await chrome.storage.local.get(['conversations', 'folders']);
    const conversations = storage.conversations || [];
    
    let messageCount = 0;
    let tagCount = 0;
    let totalContentLength = 0;
    
    conversations.forEach(convo => {
      messageCount += convo.convo?.length || 0;
      tagCount += (convo.tags?.length || 0) + (convo.manualTags?.length || 0);
      convo.convo?.forEach(msg => {
        totalContentLength += msg.content?.length || 0;
      });
    });
    
    return {
      messageCount,
      tagCount,
      totalContentLength,
      metadataSize: (totalContentLength / 1024).toFixed(1)
    };
  }

  async loadFolders() {
    try {
      const response = await chrome.storage.local.get(['folders']);
      this.folders = response.folders || [];
      this.updateFolderSelect();
      this.updateFolderQuickList();
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  }

  updateFolderSelect() {
    const select = document.getElementById('folderSelect');
    if (!select) return;

    const currentValue = this.selectedFolderId;
    
    select.innerHTML = `
      <option value="0">${t('allConversations')}</option>
      <option value="-1">${t('noFolder')}</option>
      ${this.folders.map(folder => `
        <option value="${folder.id}">${folder.name}</option>
      `).join('')}
    `;
    
    // Restaurer la sélection
    select.value = currentValue;
  }

  // Mettre à jour la liste rapide des dossiers
  async updateFolderQuickList() {
    const quickList = document.getElementById('folderQuickList');
    if (!quickList) return;
    
    const storage = await chrome.storage.local.get(['conversations']);
    const conversations = storage.conversations || [];
    
    // Compter les conversations par dossier
    const folderCounts = {};
    conversations.forEach(convo => {
      const folderId = convo.folderId || 0;
      folderCounts[folderId] = (folderCounts[folderId] || 0) + 1;
    });
    
    quickList.innerHTML = `
      <div class="folder-badge ${this.selectedFolderId === 0 ? 'active' : ''}" 
           data-folder-id="0">
        ${t('allLabel')} <span class="folder-badge-count">${conversations.length}</span>
      </div>
      <div class="folder-badge ${this.selectedFolderId === -1 ? 'active' : ''}" 
           data-folder-id="-1">
        ${t('noFolder')} <span class="folder-badge-count">${folderCounts[0] || 0}</span>
      </div>
      ${this.folders.map(folder => `
        <div class="folder-badge ${this.selectedFolderId === folder.id ? 'active' : ''}" 
             data-folder-id="${folder.id}">
          ${folder.name} <span class="folder-badge-count">${folderCounts[folder.id] || 0}</span>
        </div>
      `).join('')}
    `;
    
    // Ajouter écouteurs
    quickList.querySelectorAll('.folder-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        const folderId = parseInt(badge.dataset.folderId);
        this.selectedFolderId = folderId;
        document.getElementById('folderSelect').value = folderId;
        this.loadConversations();
        this.updateFolderQuickList();
      });
    });
  }

  async loadConversations(searchQuery = '') {
    try {
      console.log('=== loadConversations ===');
      console.log('Search query:', searchQuery);
      console.log('Selected folder ID:', this.selectedFolderId);
      
      const response = await chrome.storage.local.get(['conversations']);
      let conversations = response.conversations || [];
      
      console.log('Total conversations:', conversations.length);
      
      // FILTRER PAR DOSSIER
      if (this.selectedFolderId !== 0) {
        console.log('Filtering by folder:', this.selectedFolderId);
        if (this.selectedFolderId === -1) {
          conversations = conversations.filter(convo => !convo.folderId || convo.folderId === 0);
          console.log('After filtering "No folder":', conversations.length);
        } else {
          conversations = conversations.filter(convo => convo.folderId === this.selectedFolderId);
          console.log('After filtering folder', this.selectedFolderId, ':', conversations.length);
        }
      } else {
        console.log('Showing all conversations (no filter)');
      }
      
      // Filter by search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        conversations = conversations.filter(convo => {
          const searchText = `${convo.title || ''} ${convo.tags?.join(' ') || ''} ${convo.manualTags?.join(' ') || ''} ${convo.convo?.map(m => m.content).join(' ') || ''}`.toLowerCase();
          return searchText.includes(query);
        });
        console.log('After search filter:', conversations.length);
      }
      
      // Sort by date (newest first)
      conversations.sort((a, b) => {
        return new Date(b.date || b.id) - new Date(a.date || a.id);
      });
      
      console.log('Final conversations to display:', conversations.length);
      this.displayConversations(conversations);
      this.updateFolderQuickList();
      
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  displayConversations(conversations) {
    const list = document.getElementById('conversationsList');
    if (!list) return;
    
    if (conversations.length === 0) {
      const folderName = this.selectedFolderId === 0
        ? t('allFoldersLower')
        : this.selectedFolderId === -1
          ? t('noFolderLower')
          : this.getFolderName(this.selectedFolderId);
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <h3>${t('noConversationsTitle')}</h3>
          <p>${t('noConversationsInFolder', [folderName])}</p>
        </div>
      `;
      return;
    }
    
    list.innerHTML = conversations.map(convo => `
      <li class="conversation-item" data-convo-id="${convo.id}">
        <div class="conversation-title">${this.escapeHtml(convo.title || t('untitledConversation'))}</div>
        <div class="conversation-meta">
          <span>${this.formatDate(convo.date || convo.id)}</span>
          <span>${convo.convo?.length || 0} ${t('messagesLabel')}</span>
          ${convo.folderId && convo.folderId !== 0 ? 
            `<span style="font-size: 10px; color: var(--primary); background: var(--primary-light); padding: 1px 6px; border-radius: 8px;">
              📁 ${this.getFolderName(convo.folderId)}
            </span>` : ''}
        </div>
        <div class="conversation-tags">
          ${[...(convo.tags || []), ...(convo.manualTags || [])].slice(0, 3).map(tag => 
            `<span class="tag">${this.escapeHtml(tag)}</span>`
          ).join('')}
        </div>
        <div class="conversation-actions">
          <button class="view-btn" data-convo-id="${convo.id}">${t('view')}</button>
          <button class="delete-btn" data-convo-id="${convo.id}">${t('delete')}</button>
          <button class="folder-btn" data-convo-id="${convo.id}" style="
            background: var(--primary-light);
            color: var(--primary);
            border: 1px solid var(--border);
          ">📁</button>
        </div>
      </li>
    `).join('');
    
    // Add event listeners
    list.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const convoId = parseInt(btn.dataset.convoId);
        this.showConversationDetail(convoId);
      });
    });
    
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const convoId = parseInt(btn.dataset.convoId);
        this.deleteConversation(convoId);
      });
    });
    
    // Bouton pour changer le dossier
    list.querySelectorAll('.folder-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const convoId = parseInt(btn.dataset.convoId);
        this.changeConversationFolder(convoId);
      });
    });
    
    // Click on conversation item
    list.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          const convoId = parseInt(item.dataset.convoId);
          this.showConversationDetail(convoId);
        }
      });
    });
	
	
  }

  async showConversationDetail(convoId) {
    console.log('=== showConversationDetail appelé ===');
    console.log('convoId:', convoId);
    
    try {
      const storage = await chrome.storage.local.get(['conversations']);
      const conversations = storage.conversations || [];
      this.currentConvo = conversations.find(c => c.id === convoId);
      
      if (!this.currentConvo) {
        console.error('Conversation not found with ID:', convoId);
        throw new Error('Conversation not found');
      }
      
      console.log('Found conversation:', this.currentConvo.title);
      
      // Afficher la vue détail et cacher la liste
      const detailView = document.getElementById('detailView');
      const conversationsList = document.getElementById('conversationsList');
      const searchInput = document.getElementById('searchInput');
      const saveSection = document.querySelector('.save-section');
      const sidebarContainer = document.querySelector('.sidebar-container');
      
      if (detailView) {
        detailView.classList.remove('hidden');
        detailView.style.display = 'flex';
      } else {
        console.error('detailView NOT FOUND!');
      }
      
      if (conversationsList) conversationsList.style.display = 'none';
      if (searchInput) searchInput.style.display = 'none';
      if (saveSection) saveSection.style.display = 'none';
      if (sidebarContainer) sidebarContainer.style.display = 'none';
      
      // Set title
      const detailTitle = document.getElementById('detailTitle');
      if (detailTitle) {
        console.log('Setting title:', this.currentConvo.title);
        detailTitle.textContent = this.currentConvo.title || t('untitledConversation');
      }
      
      // Set content
      const contentDiv = document.getElementById('detailContent');
      if (!contentDiv) {
        console.error('detailContent element not found!');
        alert(t('detailContentNotFound'));
        return;
      }
      
      console.log('Setting content for', this.currentConvo.convo.length, 'messages');
      contentDiv.innerHTML = this.currentConvo.convo.map(msg => `
        <div class="message ${msg.role}">
          <div class="message-role">${msg.role.toUpperCase()}</div>
          <div class="message-content">${this.escapeHtml(msg.content).replace(/\n/g, '<br>')}</div>
        </div>
      `).join('');
      
      // Set tags
      const tagsInput = document.getElementById('tagsInput');
      if (tagsInput) {
        const tags = [...(this.currentConvo.tags || []), ...(this.currentConvo.manualTags || [])].join(', ');
        console.log('Setting tags:', tags);
        tagsInput.value = tags;
      }
      
      console.log('=== showConversationDetail terminé ===');
      
    } catch (error) {
      console.error('Error showing conversation:', error);
      alert(t('failedToLoadConversation', [error.message]));
    }
  }

  closeDetailView() {
    console.log('Closing detail view');
    
    const detailView = document.getElementById('detailView');
    const conversationsList = document.getElementById('conversationsList');
    const searchInput = document.getElementById('searchInput');
    const saveSection = document.querySelector('.save-section');
    const sidebarContainer = document.querySelector('.sidebar-container');
    
    if (detailView) {
      detailView.style.display = 'none';
      detailView.classList.add('hidden');
    }
    
    if (conversationsList) conversationsList.style.display = 'block';
    if (searchInput) searchInput.style.display = 'block';
    if (saveSection) saveSection.style.display = 'block';
    if (sidebarContainer) sidebarContainer.style.display = 'flex';
    
    this.currentConvo = null;
    this.loadConversations();
  }

  async saveTags() {
    if (!this.currentConvo) {
      console.log('No current conversation to save tags for');
      return;
    }
    
    const tagsInput = document.getElementById('tagsInput');
    if (!tagsInput) {
      console.error('tagsInput element not found');
      return;
    }
    
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag);
    
    console.log('Saving tags:', tags);
    
    try {
      const storage = await chrome.storage.local.get(['conversations']);
      const conversations = storage.conversations || [];
      
      const index = conversations.findIndex(c => c.id === this.currentConvo.id);
      if (index !== -1) {
        conversations[index].manualTags = tags;
        await chrome.storage.local.set({ conversations });
        
        this.currentConvo.manualTags = tags;
        alert(t('tagsSaved'));
      } else {
        console.error('Conversation not found in storage');
      }
    } catch (error) {
      console.error('Error saving tags:', error);
      alert(t('tagsSaveFailed'));
    }
  }

  async deleteCurrentConversation() {
    if (!this.currentConvo) {
      console.log('No current conversation to delete');
      return;
    }
    
    if (!confirm(t('deleteConversationConfirm'))) {
      return;
    }
    
    console.log('Deleting conversation:', this.currentConvo.id);
    
    await this.deleteConversation(this.currentConvo.id);
    this.closeDetailView();
  }

  async deleteConversation(convoId) {
    try {
      const storage = await chrome.storage.local.get(['conversations']);
      let conversations = storage.conversations || [];
      
      conversations = conversations.filter(c => c.id !== convoId);
      
      await chrome.storage.local.set({ conversations });
      
      console.log('Conversation deleted:', convoId);
      
      await this.loadConversations();
      this.updateFolderQuickList();
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert(t('deleteConversationFailed'));
    }
  }

  // Changer le dossier d'une conversation
  async changeConversationFolder(convoId) {
    const storage = await chrome.storage.local.get(['conversations', 'folders']);
    const conversations = storage.conversations || [];
    const folders = storage.folders || [];
    
    if (folders.length === 0) {
      alert(t('noFoldersCreated'));
      return;
    }
    
    // Menu simple
    let folderOptions = t('selectFolderPromptIntro');
    folderOptions += t('selectFolderNoFolderOption');
    folders.forEach((folder, index) => {
      folderOptions += `${index + 1}. ${folder.name}\n`;
    });
    
    const choice = prompt(folderOptions + t('selectFolderEnterNumber'));
    if (choice === null) return;
    
    const choiceNum = parseInt(choice);
    let folderId = 0;
    
    if (choiceNum === 0) {
      folderId = 0;
    } else if (choiceNum > 0 && choiceNum <= folders.length) {
      folderId = folders[choiceNum - 1].id;
    } else {
      alert(t('invalidChoice'));
      return;
    }
    
    // Mettre à jour
    const index = conversations.findIndex(c => c.id === convoId);
    if (index !== -1) {
      conversations[index].folderId = folderId;
      await chrome.storage.local.set({ conversations });
      
      if (this.currentConvo && this.currentConvo.id === convoId) {
        this.currentConvo.folderId = folderId;
      }
      
      alert(t('conversationMovedTo', [this.getFolderName(folderId)]));
      
      if (this.selectedFolderId !== 0) {
        await this.loadConversations();
      }
      this.updateFolderQuickList();
    }
  }

  // Assigner la conversation courante à un dossier
  async assignCurrentToFolder() {
    if (!this.currentConvo) {
      alert(t('viewConversationFirst'));
      return;
    }
    
    await this.changeConversationFolder(this.currentConvo.id);
  }
  
    // NOUVEAU : Gestionnaire de dossiers avec suppression
  async showFolderManager() {
    if (this.folders.length === 0) {
      alert(t('noFoldersYetUsePlus'));
      return;
    }
    
    // Créer une liste simple
    let folderList = t('deleteFoldersHeader');
    folderList += t('deleteFoldersSelect');
    
    this.folders.forEach((folder, index) => {
      folderList += `${index + 1}. ${folder.name}\n`;
    });
    
    folderList += t('deleteFoldersEnterNumber');
    folderList += t('deleteFoldersWarning');
    
    const input = prompt(folderList);
    if (input === null || input.trim() === '') return;
    
    const folderIndex = parseInt(input) - 1;
    if (folderIndex >= 0 && folderIndex < this.folders.length) {
      const folderId = this.folders[folderIndex].id;
      await this.deleteFolder(folderId);
    } else {
      alert(t('invalidFolderNumber'));
    }
  }

  // Gestionnaire de dossiers avec suppression
  async showFolderManager() {
    if (this.folders.length === 0) {
      alert(t('noFoldersYetUsePlus'));
      return;
    }
    
    let folderList = t('manageFoldersHeader');
    this.folders.forEach((folder, index) => {
      folderList += `${index + 1}. ${folder.name}\n`;
    });
    
    folderList += t('manageFoldersEnterNumber');
    
    const input = prompt(folderList);
    if (input === null || input.trim() === '') return;
    
    const folderIndex = parseInt(input) - 1;
    if (folderIndex >= 0 && folderIndex < this.folders.length) {
      const folderId = this.folders[folderIndex].id;
      await this.deleteFolder(folderId);
    } else {
      alert(t('invalidFolderNumber'));
    }
  }
  
    // NOUVEAU : Supprimer un dossier
  async deleteFolder(folderId) {
    if (!confirm(t('deleteFolderConfirm'))) {
      return;
    }
    
    try {
      const storage = await chrome.storage.local.get(['conversations', 'folders']);
      let conversations = storage.conversations || [];
      let folders = storage.folders || [];
      
      // Déplacer les conversations vers "No folder"
      conversations = conversations.map(convo => {
        if (convo.folderId === folderId) {
          return { ...convo, folderId: 0 };
        }
        return convo;
      });
      
      // Supprimer le dossier
      const folderName = this.getFolderName(folderId);
      folders = folders.filter(f => f.id !== folderId);
      
      await chrome.storage.local.set({ conversations, folders });
      this.folders = folders;
      
      // Si on était en train de filtrer par ce dossier, revenir à "All"
      if (this.selectedFolderId === folderId) {
        this.selectedFolderId = 0;
        document.getElementById('folderSelect').value = 0;
      }
      
      alert(t('folderDeleted', [folderName]));
      
      this.updateFolderSelect();
      this.updateFolderQuickList();
      await this.loadConversations();
      
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert(t('deleteFolderFailed'));
    }
  }

  // Supprimer un dossier
  async deleteFolder(folderId) {
    if (!confirm(t('deleteFolderConfirm'))) {
      return;
    }
    
    try {
      const storage = await chrome.storage.local.get(['conversations', 'folders']);
      let conversations = storage.conversations || [];
      let folders = storage.folders || [];
      
      // Déplacer les conversations vers "No folder"
      conversations = conversations.map(convo => {
        if (convo.folderId === folderId) {
          return { ...convo, folderId: 0 };
        }
        return convo;
      });
      
      // Supprimer le dossier
      const folderName = this.getFolderName(folderId);
      folders = folders.filter(f => f.id !== folderId);
      
      await chrome.storage.local.set({ conversations, folders });
      this.folders = folders;
      
      // Si on était en train de filtrer par ce dossier, revenir à "All"
      if (this.selectedFolderId === folderId) {
        this.selectedFolderId = 0;
        document.getElementById('folderSelect').value = 0;
      }
      
      alert(t('folderDeleted', [folderName]));
      
      this.updateFolderSelect();
      this.updateFolderQuickList();
      await this.loadConversations();
      
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert(t('deleteFolderFailed'));
    }
  }

  async exportCurrentTxt() {
    if (!this.currentConvo) {
      console.log('No current conversation to export');
      return;
    }
    this.exportConversation(this.currentConvo.id, 'txt');
  }

  async exportCurrentMd() {
    if (!this.currentConvo) {
      console.log('No current conversation to export');
      return;
    }
    this.exportConversation(this.currentConvo.id, 'md');
  }

  async exportConversation(convoId, format = 'txt') {
    console.log('Exporting conversation:', convoId, format);
    
    try {
      const storage = await chrome.storage.local.get(['conversations']);
      const conversations = storage.conversations || [];
      const convo = conversations.find(c => c.id === convoId);
      
      if (!convo) {
        throw new Error('Conversation not found');
      }
      
      let content = '';
      let filename = `chat_${convoId}`;
      
      if (format === 'txt') {
        content = convo.convo.map(msg => 
          `${msg.role.toUpperCase()}:\n${msg.content}\n\n`
        ).join('─'.repeat(50) + '\n\n');
        filename += '.txt';
      } else if (format === 'md') {
        content = convo.convo.map(msg => 
          `### ${msg.role.toUpperCase()}\n\n${msg.content}\n\n`
        ).join('---\n\n');
        filename += '.md';
      }
      
      this.downloadFile(filename, content);
      console.log('File exported:', filename);
      
    } catch (error) {
      console.error('Export error:', error);
      alert(t('exportConversationFailed'));
    }
  }

  async exportSelectedFolder() {
    try {
      const storage = await chrome.storage.local.get(['conversations']);
      let conversations = storage.conversations || [];

      let folderLabel;
      if (this.selectedFolderId === 0) {
        folderLabel = t('allConversations');
      } else if (this.selectedFolderId === -1) {
        folderLabel = t('noFolder');
        conversations = conversations.filter(convo => !convo.folderId || convo.folderId === 0);
      } else {
        folderLabel = this.getFolderName(this.selectedFolderId);
        conversations = conversations.filter(convo => convo.folderId === this.selectedFolderId);
      }

      conversations.sort((a, b) => new Date(b.date || b.id) - new Date(a.date || a.id));

      if (conversations.length === 0) {
        alert(t('exportFolderEmpty', [folderLabel]));
        return;
      }

      const promptText = t('exportFolderPromptIntro', [folderLabel]) + t('exportFolderPromptOptions');
      const choice = prompt(promptText + t('exportFolderPromptEnterNumber'));
      if (choice === null) return;

      let format = 'txt';
      if (choice === '1') {
        format = 'txt';
      } else if (choice === '2') {
        format = 'md';
      } else {
        alert(t('invalidChoice'));
        return;
      }

      const files = conversations.map((convo, index) => {
        const rawTitle = convo.title || t('untitledConversation');
        const safeTitle = this.sanitizeFileName(rawTitle);
        const baseName = safeTitle || `${t('exportConversationFilePrefix')}_${index + 1}`;
        return {
          name: `${baseName}_${convo.id}.${format}`,
          content: this.buildConversationContent(convo, format),
          date: convo.date || convo.id
        };
      });

      const zipBlob = this.createZipBlob(files);
      const safeFolderLabel = this.sanitizeFileName(folderLabel) || t('exportFolderFilePrefix');
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `${t('exportFolderFilePrefix')}_${safeFolderLabel}_${stamp}.zip`;
      this.downloadBlob(filename, zipBlob);
    } catch (error) {
      console.error('Export folder error:', error);
      alert(t('exportConversationFailed'));
    }
  }

  buildConversationContent(convo, format) {
    const dateLabel = t('exportConversationDateLabel');
    const tagsLabel = t('exportConversationTagsLabel');
    const title = convo.title || t('untitledConversation');
    const date = this.formatDate(convo.date || convo.id);
    const tags = [...(convo.tags || []), ...(convo.manualTags || [])].join(', ');

    if (format === 'md') {
      const meta = `${dateLabel} ${date}` + (tags ? `\n\n${tagsLabel} ${tags}` : '');
      const messages = (convo.convo || []).map(msg =>
        `### ${msg.role.toUpperCase()}\n\n${msg.content}\n\n`
      ).join('---\n\n');
      return `## ${title}\n\n*${meta}*\n\n${messages}`;
    }

    const header = `${title}\n${dateLabel} ${date}` + (tags ? `\n${tagsLabel} ${tags}` : '');
    const body = (convo.convo || []).map(msg =>
      `${msg.role.toUpperCase()}:\n${msg.content}\n\n`
    ).join('─'.repeat(50) + '\n\n');
    return `${header}\n\n${body}`;
  }

  buildFolderExportContent(conversations, format) {
    const dateLabel = t('exportConversationDateLabel');
    const tagsLabel = t('exportConversationTagsLabel');

    if (format === 'md') {
      return conversations.map(convo => {
        const title = convo.title || t('untitledConversation');
        const date = this.formatDate(convo.date || convo.id);
        const tags = [...(convo.tags || []), ...(convo.manualTags || [])].join(', ');
        const messages = (convo.convo || []).map(msg =>
          `### ${msg.role.toUpperCase()}\n\n${msg.content}\n\n`
        ).join('---\n\n');

        const meta = `${dateLabel} ${date}` + (tags ? `\n\n${tagsLabel} ${tags}` : '');
        return `## ${title}\n\n*${meta}*\n\n${messages}`;
      }).join('\n\n---\n\n');
    }

    return conversations.map(convo => {
      const title = convo.title || t('untitledConversation');
      const date = this.formatDate(convo.date || convo.id);
      const tags = [...(convo.tags || []), ...(convo.manualTags || [])].join(', ');
      const header = `${title}\n${dateLabel} ${date}` + (tags ? `\n${tagsLabel} ${tags}` : '');
      const body = (convo.convo || []).map(msg =>
        `${msg.role.toUpperCase()}:\n${msg.content}\n\n`
      ).join('─'.repeat(50) + '\n\n');
      return `${header}\n\n${body}`;
    }).join('\n\n' + '='.repeat(70) + '\n\n');
  }

  sanitizeFileName(name) {
    return String(name || '')
      .replace(/[\\/:*?"<>|]+/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  createZipBlob(files) {
    const encoder = new TextEncoder();
    const parts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach(file => {
      const nameBytes = encoder.encode(file.name);
      const dataBytes = encoder.encode(file.content);
      const crc = this.crc32(dataBytes);
      const { dosTime, dosDate } = this.toDosDate(file.date ? new Date(file.date) : new Date());

      const localHeader = new Uint8Array(30 + nameBytes.length);
      this.writeUint32LE(localHeader, 0, 0x04034b50);
      this.writeUint16LE(localHeader, 4, 20);
      this.writeUint16LE(localHeader, 6, 0x0800);
      this.writeUint16LE(localHeader, 8, 0);
      this.writeUint16LE(localHeader, 10, dosTime);
      this.writeUint16LE(localHeader, 12, dosDate);
      this.writeUint32LE(localHeader, 14, crc);
      this.writeUint32LE(localHeader, 18, dataBytes.length);
      this.writeUint32LE(localHeader, 22, dataBytes.length);
      this.writeUint16LE(localHeader, 26, nameBytes.length);
      this.writeUint16LE(localHeader, 28, 0);
      localHeader.set(nameBytes, 30);

      parts.push(localHeader, dataBytes);

      const centralHeader = new Uint8Array(46 + nameBytes.length);
      this.writeUint32LE(centralHeader, 0, 0x02014b50);
      this.writeUint16LE(centralHeader, 4, 20);
      this.writeUint16LE(centralHeader, 6, 20);
      this.writeUint16LE(centralHeader, 8, 0x0800);
      this.writeUint16LE(centralHeader, 10, 0);
      this.writeUint16LE(centralHeader, 12, dosTime);
      this.writeUint16LE(centralHeader, 14, dosDate);
      this.writeUint32LE(centralHeader, 16, crc);
      this.writeUint32LE(centralHeader, 20, dataBytes.length);
      this.writeUint32LE(centralHeader, 24, dataBytes.length);
      this.writeUint16LE(centralHeader, 28, nameBytes.length);
      this.writeUint16LE(centralHeader, 30, 0);
      this.writeUint16LE(centralHeader, 32, 0);
      this.writeUint16LE(centralHeader, 34, 0);
      this.writeUint16LE(centralHeader, 36, 0);
      this.writeUint32LE(centralHeader, 38, 0);
      this.writeUint32LE(centralHeader, 42, offset);
      centralHeader.set(nameBytes, 46);

      centralParts.push(centralHeader);
      offset += localHeader.length + dataBytes.length;
    });

    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endRecord = new Uint8Array(22);
    this.writeUint32LE(endRecord, 0, 0x06054b50);
    this.writeUint16LE(endRecord, 4, 0);
    this.writeUint16LE(endRecord, 6, 0);
    this.writeUint16LE(endRecord, 8, files.length);
    this.writeUint16LE(endRecord, 10, files.length);
    this.writeUint32LE(endRecord, 12, centralSize);
    this.writeUint32LE(endRecord, 16, offset);
    this.writeUint16LE(endRecord, 20, 0);

    const allParts = parts.concat(centralParts, [endRecord]);
    const totalSize = allParts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(totalSize);
    let cursor = 0;
    allParts.forEach(part => {
      output.set(part, cursor);
      cursor += part.length;
    });

    return new Blob([output], { type: 'application/zip' });
  }

  writeUint16LE(buffer, offset, value) {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >>> 8) & 0xff;
  }

  writeUint32LE(buffer, offset, value) {
    buffer[offset] = value & 0xff;
    buffer[offset + 1] = (value >>> 8) & 0xff;
    buffer[offset + 2] = (value >>> 16) & 0xff;
    buffer[offset + 3] = (value >>> 24) & 0xff;
  }

  toDosDate(date) {
    const safeDate = isNaN(date.getTime()) ? new Date() : date;
    let year = safeDate.getFullYear();
    if (year < 1980) year = 1980;
    const month = safeDate.getMonth() + 1;
    const day = safeDate.getDate();
    const hours = safeDate.getHours();
    const minutes = safeDate.getMinutes();
    const seconds = Math.floor(safeDate.getSeconds() / 2);

    const dosTime = (hours << 11) | (minutes << 5) | seconds;
    const dosDate = ((year - 1980) << 9) | (month << 5) | day;
    return { dosTime, dosDate };
  }

  crc32(bytes) {
    let crc = 0xffffffff;
    if (!this.crcTable) {
      this.crcTable = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let k = 0; k < 8; k++) {
          c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        this.crcTable[i] = c >>> 0;
      }
    }
    for (let i = 0; i < bytes.length; i++) {
      crc = this.crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async createFolder() {
    const name = prompt(t('enterFolderName'));
    if (!name || !name.trim()) {
      console.log('No folder name provided');
      return;
    }
    
    const folderName = name.trim();
    
    // Vérifier les doublons
    if (this.folders.some(f => f.name.toLowerCase() === folderName.toLowerCase())) {
      alert(t('folderNameExists'));
      return;
    }
    
    console.log('Creating folder:', folderName);
    
    try {
      const storage = await chrome.storage.local.get(['folders']);
      const folders = storage.folders || [];
      
      const newFolder = {
        id: Date.now(),
        name: folderName,
        created: new Date().toISOString()
      };
      
      folders.push(newFolder);
      await chrome.storage.local.set({ folders });
      
      this.folders = folders;
      this.updateFolderSelect();
      this.updateFolderQuickList();
      
      alert(t('folderCreated'));
      
    } catch (error) {
      console.error('Error creating folder:', error);
      alert(t('folderCreateFailed'));
    }
  }

  searchConversations(query) {
    console.log('Searching for:', query);
    this.loadConversations(query);
  }

  // Helper methods
  generateTitle(convo) {
    if (convo.length === 0) return t('emptyConversationTitle');
    
    const firstMessage = convo[0].content;
    let title = firstMessage.substring(0, 50);
    if (firstMessage.length > 50) title += '...';
    
    return title || t('untitledConversation');
  }

  extractTags(convo) {
    const tags = new Set();
    const text = convo.map(m => m.content).join(' ').toLowerCase();
    
    if (text.includes('```') || text.includes('function') || text.includes('def ') || text.includes('class ')) {
      tags.add('code');
    }
    
    if (text.includes('?') || text.includes('how to') || text.includes('why ')) {
      tags.add('question');
    }
    
    if (text.includes('explain') || text.includes('means') || text.includes('definition')) {
      tags.add('explanation');
    }
    
    return Array.from(tags);
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return t('unknownDate');
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  downloadFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    this.downloadBlob(filename, blob);
  }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  console.log('Chat Saver Sidebar initialized');
  localizeSidebar();
  window.chatSaver = new ChatSaverPopup();
});


