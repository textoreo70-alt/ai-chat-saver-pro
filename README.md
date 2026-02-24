# 🤖 AI Chat Saver Pro

<div align="center">

![Chrome Web Store](https://img.shields.io/chrome-web-store/v/latest?color=4285F4&label=Version)
![Chrome Web Store](https://img.shields.io/chrome-web-store/users?color=4285F4)
![License](https://img.shields.io/badge/License-MIT-green)
![Platforms](https://img.shields.io/badge/Platforms-Chromium%20|%20Firefox%20|%20Edge-blue)

**Save, organize and export your AI conversations from ChatGPT, Claude, Grok, Gemini, Perplexity and more!**

[Features](#-features) • [Installation](#-installation) • [Supported Platforms](#-supported-platforms) • [Usage](#-usage) • [Contributing](#-contributing)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📥 **One-Click Save** | Save any AI conversation with a single click |
| 📁 **Folder Organization** | Create custom folders to categorize your conversations |
| 🏷️ **Tag System** | Add tags for easy searching and filtering |
| 🔍 **Search** | Quickly find conversations by title, content, or tags |
| 📤 **Export** | Export conversations as TXT or Markdown files |
| 📦 **Bulk Export** | Export entire folders as ZIP archives |
| 💾 **Storage Management** | Monitor storage usage with helpful recommendations |
| 🌐 **Multi-Language** | Available in English and French |

---

## 📥 Installation

### From Chrome Web Store
[Here](https://chromewebstore.google.com/detail/ai-chat-saver-pro/poelngfgjdkkpkbkphjpkbnejhodnhnm)

### Manual Installation (Developer Mode)

1. Download the latest release or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the extension folder

---

## 🌍 Supported Platforms

| Platform | Status | Domain |
|----------|--------|--------|
| **ChatGPT** | ✅ Supported | `chat.openai.com`, `chatgpt.com` |
| **Claude** | ✅ Supported | `claude.ai` |
| **Grok** | ✅ Supported | `grok.com`, `grok.x.ai` |
| **Gemini** | ✅ Supported | `gemini.google.com` |
| **Perplexity** | Not Supported Yet| `perplexity.ai` |

---

## 📸 Screenshots

### Sidebar Interface
The extension adds a convenient sidebar to your browser for quick access to all saved conversations.

### Save Button
Appears on supported AI platforms to save conversations instantly.

---

## 🔧 Usage

### Saving a Conversation
1. Open any supported AI chat platform
2. Click the extension icon in your browser toolbar
3. Click **"Save Current Conversation"**
4. Optionally add tags and select a folder

### Managing Folders
1. Open the extension sidebar
2. Click the **"+"** button to create a new folder
3. Use **"Manage"** to rename or delete folders

### Exporting Conversations
- **Single conversation**: Click on a conversation → **Export TXT** or **Export MD**
- **Entire folder**: Select folder → **Export as ZIP**

---

## 🛠️ Technology Stack

- **Manifest V3** - Modern Chrome extension architecture
- **Vanilla JavaScript** - No heavy dependencies
- **Chrome Storage API** - Local data persistence
- **i18n** - Internationalization support (EN/FR)

---

## 📂 Project Structure

```
ai-chat-saver-pro/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js            # Content script
├── sidebar.js            # Sidebar logic
├── sidebar.html          # Sidebar UI
├── sidebar.css           # Sidebar styles
├── options.js            # Options page
├── options.html          # Options page UI
├── _locales/
│   ├── en/messages.json  # English translations
│   └── fr/messages.json  # French translations
└── icons/                # Extension icons
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the need to preserve valuable AI conversations
- Thanks to all contributors and users!

---

<div align="center">

**Made with ❤️ for AI enthusiasts**

[⬆ Back to top](#-ai-chat-saver-pro)

</div>
