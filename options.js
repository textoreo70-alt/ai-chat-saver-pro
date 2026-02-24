const t = (key, substitutions) => {
  try {
    const message = chrome.i18n?.getMessage ? chrome.i18n.getMessage(key, substitutions) : '';
    return message || key;
  } catch {
    return key;
  }
};

function localizeOptions() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
}

function bindEvents() {
  const clearBtn = document.getElementById('clear');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    if (confirm(t('optionsClearConfirm'))) {
      chrome.storage.local.set({ conversations: [] }, () => {
        alert(t('optionsCleared'));
      });
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    localizeOptions();
    bindEvents();
  });
} else {
  localizeOptions();
  bindEvents();
}
