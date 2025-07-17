# DocuMancer - AI-Powered Academic Paper Reading Assistant

A sophisticated paper reading assistant built with Next.js, LangChain, DeepSeek AI, and Ant Design X. DocuMancer helps researchers and academics efficiently read, analyze, and understand academic papers through AI-powered features.

## 🚀 Features

### Core Functionality
- **PDF Upload & Processing**: Drag-and-drop PDF upload with automatic text extraction and metadata parsing
- **AI-Powered Analysis**: Comprehensive paper analysis using DeepSeek AI through LangChain
- **Interactive Chat**: Ask questions about papers and get intelligent responses
- **Smart Annotations**: Highlight, annotate, and bookmark important sections
- **Paper Library**: Organize and manage your research papers with advanced search

### Advanced AI Features
- **Paper Summarization**: Generate comprehensive summaries of research papers
- **Key Findings Extraction**: Automatically identify main discoveries and contributions
- **Methodology Analysis**: Detailed explanation of research methods and approaches
- **Concept Extraction**: Identify and define key terms and technical vocabulary
- **Citation Analysis**: Analyze references and academic context
- **Paper Comparison**: Compare multiple papers side-by-side with AI insights

### User Experience
- **Modern UI**: Clean, professional interface built with Ant Design X
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Collaboration**: Share insights and annotations
- **Reading Progress**: Track your reading progress across papers
- **Search & Filter**: Advanced search with author, tag, and content filters

## 🛠 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Framework**: Ant Design X, Tailwind CSS
- **AI Integration**: LangChain, DeepSeek API
- **PDF Processing**: pdf-parse, react-pdf
- **State Management**: Zustand
- **File Handling**: React Dropzone
- **Styling**: Custom CSS with professional academic theme

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd documancer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Add your DeepSeek API key:
   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   DEEPSEEK_BASE_URL=https://api.deepseek.com
   ```

4. **Create required directories**
   ```bash
   mkdir -p uploads data
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

### Getting Started
1. **Upload a Paper**: Use the drag-and-drop interface or click "Add Paper" to upload a PDF
2. **View Paper**: Click on any paper in your library to open the reader
3. **Ask Questions**: Use the AI chat interface to ask questions about the paper
4. **Annotate**: Highlight important sections and add notes
5. **Analyze**: Use quick analysis tools for summaries, key findings, and more

### Key Workflows

#### Paper Analysis
1. Upload your PDF document
2. Wait for automatic processing and text extraction
3. Use the "Quick Analysis" panel for instant insights:
   - **Summarize**: Get a comprehensive overview
   - **Key Findings**: Extract main discoveries
   - **Methodology**: Understand research methods
   - **Concepts**: Learn key terminology
   - **Citations**: Analyze references

#### Interactive Reading
1. Open a paper in the reader view
2. Use the PDF viewer to navigate through pages
3. Highlight important text and add annotations
4. Ask specific questions in the chat interface
5. Get contextual AI responses based on the paper content

#### Paper Comparison
1. Go to the Comparison view
2. Select two or more papers to compare
3. Get AI-powered analysis of similarities and differences
4. Understand how papers relate to each other

## 🏗 Project Structure

```
documancer/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── analysis/          # Analysis components
│   │   ├── chat/              # Chat interface
│   │   ├── common/            # Shared components
│   │   ├── layout/            # Layout components
│   │   ├── library/           # Library components
│   │   ├── pdf/               # PDF viewer components
│   │   ├── upload/            # File upload components
│   │   └── views/             # Main view components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   ├── store/                 # Zustand store
│   └── types/                 # TypeScript types
├── uploads/                   # Uploaded files
├── data/                      # Application data
└── public/                    # Static assets
```

## 🔧 Configuration

### Environment Variables
- `DEEPSEEK_API_KEY`: Your DeepSeek API key
- `DEEPSEEK_BASE_URL`: DeepSeek API base URL
- `NEXT_PUBLIC_MAX_FILE_SIZE`: Maximum file upload size
- `NEXT_PUBLIC_ALLOWED_FILE_TYPES`: Allowed file types

### Customization
- **Theme**: Modify colors in `src/lib/constants.ts`
- **AI Prompts**: Update prompts in `src/lib/langchain.ts`
- **UI Components**: Customize Ant Design theme in `src/app/layout.tsx`

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Docker
```bash
# Build the image
docker build -t documancer .

# Run the container
docker run -p 3000:3000 documancer
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **DeepSeek AI** for providing the language model
- **LangChain** for the AI framework
- **Ant Design** for the UI components
- **Next.js** for the React framework

## 🗺 Roadmap

- [ ] Multi-language support
- [ ] Collaborative annotations
- [ ] Advanced citation management
- [ ] Integration with reference managers
- [ ] Mobile app
- [ ] Offline mode

---

Built with ❤️ for the academic community
