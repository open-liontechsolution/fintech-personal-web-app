import amqp from 'amqplib';
import logger from '../config/logger';

interface FileUploadedEventData {
  fileId: string;
  fileName: string;
  fileType: 'bank' | 'credit_card' | 'investment';
  userId: string;
  accountId?: string;
  fileSize?: number;
  contentType?: string;
}

interface FileUploadedEvent {
  eventType: 'FileUploaded';
  eventId: string;
  timestamp: string;
  data: FileUploadedEventData;
}

class RabbitMqService {
  private connection: any = null;
  private channel: any = null;

  async connect(): Promise<void> {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
      this.connection = await amqp.connect(rabbitUrl);
      
      if (!this.connection) {
        throw new Error('Failed to create RabbitMQ connection');
      }
      this.channel = await this.connection.createChannel();
      
      const exchange = process.env.RABBITMQ_EXCHANGE || 'file-upload-exchange';
      const queue = process.env.RABBITMQ_QUEUE || 'file-import-queue';
      
      // Ensure channel is not null before using it
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }
      
      // Declarar exchange y queue
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, process.env.RABBITMQ_ROUTING_KEY || 'file.uploaded');
      
      logger.info(`Connected to RabbitMQ: ${rabbitUrl}`);
      logger.info(`Exchange: ${exchange}, Queue: ${queue}`);
    } catch (error) {
      logger.error('Error connecting to RabbitMQ:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        // Use type assertion to solve the TypeScript error
        await (this.connection as any).close();
        this.connection = null;
      }
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
      throw error;
    }
  }

  async publishFileUploadedEvent(eventData: {
    fileId: string;
    fileName: string;
    userId: string;
    accountId: string;
    eventId: string;
    uploadedAt: string;
    fileSize: number;
    contentType: string;
  }): Promise<void> {
    try {
      if (!this.channel) {
        throw new Error('RabbitMQ not connected. Call connect() first.');
      }

      const exchange = process.env.RABBITMQ_EXCHANGE || 'file-upload-exchange';
      const routingKey = process.env.RABBITMQ_ROUTING_KEY || 'file.uploaded';
      
      // Construct the event with the correct structure
      const event: FileUploadedEvent = {
        eventType: 'FileUploaded',
        eventId: eventData.eventId,
        timestamp: eventData.uploadedAt,
        data: {
          fileId: eventData.fileId,
          fileName: eventData.fileName,
          fileType: 'bank', // Default to 'bank' - can be made configurable later
          userId: eventData.userId,
          accountId: eventData.accountId,
          fileSize: eventData.fileSize,
          contentType: eventData.contentType
        }
      };
      
      const message = Buffer.from(JSON.stringify(event));
      
      await this.channel.publish(exchange, routingKey, message, {
        persistent: true,
        messageId: event.eventId,
        timestamp: Date.now(),
        headers: {
          eventType: 'FileUploaded',
          version: '1.0'
        }
      });
      
      logger.info(`Published FileUploadedEvent: ${event.eventId} for file ${event.data.fileName}`);
    } catch (error) {
      logger.error('Error publishing FileUploadedEvent:', error);
      throw error;
    }
  }
}

export default new RabbitMqService();
