# Chat with a Website — RAG Application

A full-stack Retrieval-Augmented Generation (RAG) application that crawls a target website, parses and cleans its content, indexes vector embeddings in a local ChromaDB instance, and allows users to ask questions strictly based on the site's content.

## Tech Stack

* **Frontend**: React 18 + Vite + TypeScript + TailwindCSS (Glassmorphism / dark mode UI)
* **Backend**: Express.js (Node.js) + TypeScript (`tsx` watch runner)
* **Vector Database**: ChromaDB (connected via standard npm client)
* **LLM**: Google Gemini 2.5 Flash (via `@google/generative-ai` SDK)
* **Embeddings**: Gemini `gemini-embedding-2` model (20-item batches, 200ms rate delay)
* **Crawler**: Crawlee + Cheerio (respects `robots.txt`, domain-scoped)
* **HTML Parser**: `@mozilla/readability` + `jsdom` (boilerplate stripping)

---

## Getting Started

### Prerequisites

1. **Node.js**: Version 18 or higher is required.
2. **Python 3.8+**: Required for starting a local ChromaDB instance.
3. **ChromaDB Server**: Install ChromaDB on your system:
   ```bash
   pip install chromadb
   ```

### Configuration

Create a `.env` file in the `server/` directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key
CHROMA_HOST=127.0.0.1
CHROMA_PORT=8000
PORT=3001
```

### Running the Application

You will need three terminal tabs/sessions:

#### Terminal 1 — ChromaDB Server

Start your local vector database server:

```bash
C:\Users\<User-name>\AppData\Roaming\Python\Python313\Scripts\chroma.exe run --host localhost --port 8000
```
Although it is connected to chromadb cloud, so you can continue as it is too.

#### Terminal 2 — Backend Express Server

Start the development server for the Express API:

```bash
cd server
npm install
npm run dev
```

#### Terminal 3 — Frontend Client

Start the Vite development web server:

```bash
cd client
npm install
npm run dev
```

Open your browser and navigate to the displayed localhost port (default: `http://localhost:5173`).

---

## System Architecture & Pipeline Details

### 1. Crawling Strategy

* **Domain-Scoped**: The crawler restricts traversal to the same origin (protocol, hostname, and port) to ensure it stays within the requested website.
* **Polite & Robots.txt Compliant**: Before crawling, the server fetches `/robots.txt` from the origin domain and parses it using `robots-parser`. If path traversal is disallowed, the crawler skips those pages.
* **Safety Limits**: Caps execution at a hard limit of **50 pages** and a maximum crawl depth of **3 levels** deep from the homepage.
* **Rate Limiting**: Configured with a concurrency limit of `1` and a `1000ms` delay between requests to guarantee a polite crawl rate of 1 request per second.

### 2. Chunking & Cleaning

* **Boilerplate Stripping**: Loads raw HTML in a virtual `jsdom` sandbox, and cleans headers, navigation bars, footer menus, and cookie notices using `@mozilla/readability`. Falls back to parsing the full text if Readability determines the page is not an article.
* **Overlapping Chunks**: Splits text into chunks of maximum **2000 characters** with an overlap of **200 characters** to maintain contextual continuity across borders.
* **Metadata**: Attaches `{ url, title, chunkIndex }` to each chunk.

### 3. Embeddings & Vector Storage

* **Gemini Embeddings**: Generates vector representations using Gemini `gemini-embedding-2`.
* **Rate-Limit Batches**: Sends texts to the Gemini API in batches of **20**, introducing a **200ms delay** between batch iterations to stay under API quotas.
* **Similarity Metric**: Integrates ChromaDB using **cosine similarity** distance (`hnsw:space: cosine`). Collections are dynamically named using the format `sanitized_domain_timestamp`.

### 4. RAG & Groundedness

* **Similarity Search**: Generates an embedding for the user's question, querying ChromaDB to fetch the **top-5** most similar chunks.
* **Strict System Prompt**: Prompts Gemini 2.5 Flash using a strict system instruction:
  ```text
  You are a helpful assistant that answers questions strictly based 
  on the provided website content.

  Rules:
  - Only use information from the CONTEXT below.
  - If the context doesn't contain enough information, respond with:
    "I couldn't find information about that on this website."
  - Do not use external knowledge or make up facts.
  - Be concise and direct.
  ```
* **Citations**: Extracts unique `url` and `title` keys from the chunk metadatas and lists them directly underneath assistant answers in the chat bubble.

---

## Known Limitations & Future Improvements

1. **JavaScript-Heavy Websites**: Websites rendering pages client-side (SPAs, React apps, etc.) may return blank pages because the `CheerioCrawler` does not execute JavaScript. *Improvement*: Allow toggling between `CheerioCrawler` and `PlaywrightCrawler` (headless Chrome) for heavy JS/React sites.
2. **Concurrency during Crawling**: A single-threaded backend handles crawling requests. Multiple crawls will lock the sqlite storage under Crawlee's storage directory. *Improvement*: Configure cloud-based bucket storage or execute crawls inside isolated worker threads or serverless routines.
3. **Authentication/Paywalls**: Currently unable to crawl sites requiring logins, cookie sessions, or captcha resolution.
4. **ChromaDB Scalability**: Running ChromaDB locally is great for small websites, but production RAG systems require hosted indices (e.g., Chroma Cloud, Pinecone, Qdrant) with persistent backups.
