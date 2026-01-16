# MemoryNote 📝

An easy-to-use note-taking application with AI assistance - a simpler alternative to NotebookLM and Obsidian.

## Features

- **Easy Note-Taking**: Create and organize notes in notebooks
- **Markdown Support**: Full markdown editing with live preview
- **AI Assistant**: Integrated AI (GLM-4.7) for:
  - Chat about your notes
  - Summarize notes
  - Improve writing
  - Generate ideas
- **100% Local**: All data stored in browser's IndexedDB
- **PWA Ready**: Install as a Progressive Web App for offline use
- **Clean UI**: Simple, intuitive interface

## Tech Stack

- **Vue.js 3** - Progressive JavaScript framework
- **Vite** - Fast build tool
- **IndexedDB** - Local browser storage
- **Marked** - Markdown parser
- **Highlight.js** - Code syntax highlighting
- **Z.AI API** - AI powered by GLM-4.7

## Getting Started

### Installation

```bash
cd memory-note-pwa
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Create a Notebook**: Click "📓 New Notebook" in the sidebar
2. **Create Notes**: Click "➕ New Note" to create a note
3. **Edit Notes**: Click on any note to open the editor
4. **Use AI**: Click the 🤖 button in the editor to open the AI assistant
5. **Organize**: Use the sidebar to navigate between notebooks

## AI Features

The AI assistant can help you with:

- **Chat**: Ask questions about your notes
- **Summarize**: Get quick summaries of your notes
- **Improve**: Get suggestions to improve your writing
- **Ideas**: Brainstorm ideas based on your content

## Project Structure

```
memory-note-pwa/
├── src/
│   ├── components/
│   │   ├── views/
│   │   │   ├── NoteEditor.vue    # Note editing interface
│   │   │   └── NotebookList.vue  # Notebook and note list
│   │   ├── Sidebar.vue           # Navigation sidebar
│   │   ├── MarkdownEditor.vue    # Markdown editor with preview
│   │   └── AIChat.vue            # AI chat interface
│   ├── services/
│   │   ├── storage.js            # IndexedDB storage layer
│   │   └── ai.js                 # Z.AI API integration
│   ├── stores/
│   │   └── useStore.js           # Vue state management
│   ├── App.vue                   # Main app component
│   └── main.js                   # App entry point
├── public/
│   └── favicon.svg               # App icon
├── index.html                    # HTML template
├── vite.config.js                # Vite configuration
└── package.json                  # Dependencies
```

## Configuration

### AI API Key

The Z.AI API key is configured in `src/services/ai.js`. To use your own key:

1. Open `src/services/ai.js`
2. Replace the `API_KEY` constant with your key
3. Adjust the `API_BASE` if needed

```javascript
const API_KEY = 'your-api-key-here';
```

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## PWA Installation

1. Open the app in a supported browser
2. Click the install icon in the address bar
3. Follow the prompts to install

The app will work offline after installation.

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
