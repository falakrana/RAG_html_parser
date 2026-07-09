export interface CrawledPage {
  url: string;
  title: string;
  rawHtml: string;
}

export interface ChunkMetadata {
  url: string;
  title: string;
  chunkIndex: number;
}

export interface DocumentChunk {
  text: string;
  metadata: ChunkMetadata;
}

export interface Source {
  url: string;
  title: string;
}

export interface CrawlRequest {
  url: string;
}

export interface CrawlResponse {
  collectionName: string;
  pagesCrawled: number;
  chunksIndexed: number;
}

export interface ChatRequest {
  question: string;
  collectionName: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}
