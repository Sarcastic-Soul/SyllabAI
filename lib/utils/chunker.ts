export function chunkText(text: string, maxChunkSize: number = 4000, overlap: number = 200): string[] {
  if (!text) return [];

  // Try to split by double newline (paragraphs)
  let chunks = text.split('\n\n');
  let result: string[] = [];
  let currentChunk = '';

  for (const chunk of chunks) {
    if (currentChunk.length + chunk.length > maxChunkSize && currentChunk.length > 0) {
      result.push(currentChunk.trim());
      // Keep overlap from the end of the previous chunk
      currentChunk = currentChunk.slice(-overlap) + '\n\n' + chunk;
    } else {
      if (currentChunk.length > 0) {
        currentChunk += '\n\n';
      }
      currentChunk += chunk;
    }

    // If a single paragraph is still too large, we must split it further
    while (currentChunk.length > maxChunkSize) {
      // Find a space to split at
      let splitIndex = currentChunk.lastIndexOf(' ', maxChunkSize);
      if (splitIndex === -1 || splitIndex < maxChunkSize / 2) {
        // Fallback to strict character split if no good space found
        splitIndex = maxChunkSize;
      }
      result.push(currentChunk.slice(0, splitIndex).trim());
      currentChunk = currentChunk.slice(splitIndex - overlap);
    }
  }

  if (currentChunk.trim().length > 0) {
    result.push(currentChunk.trim());
  }

  return result;
}
