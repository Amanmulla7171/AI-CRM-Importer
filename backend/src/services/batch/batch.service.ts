/**
 * Service to manage batch chunking of import records.
 */
export class BatchService {
  /**
   * Split an array of records into chunks of a given size.
   */
  public chunkRecords<T>(records: T[], batchSize: number = 20): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < records.length; i += batchSize) {
      chunks.push(records.slice(i, i + batchSize));
    }
    return chunks;
  }
}

export const batchService = new BatchService();
