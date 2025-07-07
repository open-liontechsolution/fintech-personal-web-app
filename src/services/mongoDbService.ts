import { MongoClient, GridFSBucket, Db } from 'mongodb';
import logger from '../config/logger';

class MongoDbService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private gridFSBucket: GridFSBucket | null = null;

  async connect(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fintech_files';
      this.client = new MongoClient(mongoUri);
      
      await this.client.connect();
      this.db = this.client.db();
      this.gridFSBucket = new GridFSBucket(this.db, { bucketName: 'uploads' });
      
      logger.info(`Connected to MongoDB: ${mongoUri}`);
    } catch (error) {
      logger.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.gridFSBucket = null;
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  getGridFSBucket(): GridFSBucket {
    if (!this.gridFSBucket) {
      throw new Error('GridFS not initialized. Call connect() first.');
    }
    return this.gridFSBucket;
  }

  async getProcessedTransactions(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const db = this.getDb();
      const transactions = await db.collection('raw_imports')
        .find({ userId })
        .sort({ importedAt: -1 })
        .limit(limit)
        .toArray();
      
      return transactions;
    } catch (error) {
      logger.error('Error fetching processed transactions:', error);
      throw error;
    }
  }

  async getUploadedFiles(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const db = this.getDb();
      const files = await db.collection('uploads.files')
        .find({ 'metadata.userId': userId })
        .sort({ uploadDate: -1 })
        .limit(limit)
        .toArray();
      
      return files;
    } catch (error) {
      logger.error('Error fetching uploaded files:', error);
      throw error;
    }
  }
}

export default new MongoDbService();
