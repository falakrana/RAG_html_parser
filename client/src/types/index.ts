export interface Source {
  url: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
}

export interface CrawlResponse {
  collectionName: string;
  pagesCrawled: number;
  chunksIndexed: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}
