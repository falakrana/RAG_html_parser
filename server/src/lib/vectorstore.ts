import { ChromaClient, CloudClient, Collection, IEmbeddingFunction } from 'chromadb';
import { embedTexts } from './embedder';
import 'dotenv/config';

const client = process.env.CHROMA_API_KEY
  ? new CloudClient({
      apiKey: process.env.CHROMA_API_KEY,
      tenant: process.env.CHROMA_TENANT || '',
      database: process.env.CHROMA_DATABASE || '',
    })
  : new ChromaClient({
      path: `http://${process.env.CHROMA_HOST || 'localhost'}:${process.env.CHROMA_PORT || '8000'}`
    });

/**
 * Custom embedding function wrapper implementing ChromaDB's IEmbeddingFunction.
 */
const customEmbeddingFunction: IEmbeddingFunction = {
  generate: embedTexts
};

/**
 * Creates a new ChromaDB collection with the given name.
 * Configured to use cosine similarity as the distance metric.
 * 
 * @param name - The name of the collection to create.
 * @returns A Promise resolving to the created ChromaDB Collection.
 */
export async function createCollection(name: string): Promise<Collection> {
  return await client.createCollection({
    name,
    embeddingFunction: customEmbeddingFunction,
    metadata: { 'hnsw:space': 'cosine' }
  });
}

/**
 * Retrieves an existing ChromaDB collection by name.
 * 
 * @param name - The name of the collection to get.
 * @returns A Promise resolving to the ChromaDB Collection.
 */
export async function getCollection(name: string): Promise<Collection> {
  return await client.getCollection({
    name,
    embeddingFunction: customEmbeddingFunction
  });
}

/**
 * Adds document chunks and their corresponding embeddings to a ChromaDB collection.
 * 
 * @param collection - The ChromaDB Collection instance to add documents to.
 * @param chunks - An array of document chunks with text and metadata.
 * @param embeddings - A 2D array of vector embeddings corresponding to the chunks.
 * @returns A Promise that resolves when all documents are successfully added.
 */
export async function addDocuments(
  collection: Collection,
  chunks: Array<{ text: string; metadata: { url: string; title: string; chunkIndex: number } }>,
  embeddings: number[][]
): Promise<void> {
  const ids = chunks.map((_, idx) => `chunk_${idx}`);
  const documents = chunks.map((c) => c.text);
  const metadatas = chunks.map((c) => ({
    url: c.metadata.url,
    title: c.metadata.title,
    chunkIndex: c.metadata.chunkIndex,
  }));

  await collection.add({
    ids,
    embeddings,
    metadatas,
    documents
  });
}

/**
 * Queries a ChromaDB collection with a search vector embedding.
 * 
 * @param collection - The ChromaDB Collection instance to query.
 * @param queryEmbedding - The vector embedding of the query string.
 * @param nResults - The number of nearest neighbor matches to return (default: 5).
 * @returns A Promise resolving to the query results containing matching documents and metadata.
 */
export async function queryCollection(
  collection: Collection,
  queryEmbedding: number[],
  nResults: number = 5
) {
  return await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults
  });
}
