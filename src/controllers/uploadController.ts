import { Request, Response, NextFunction } from 'express';
import { GridFSBucket, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { GridFSBucketWriteStream } from 'mongodb';
import mongoDbService from '../services/mongoDbService';
import rabbitMqService from '../services/rabbitMqService';
import accountService from '../services/accountService';
import logger from '../config/logger';
import fileUpload from 'express-fileupload';

class UploadController {
  // No middleware needed since express-fileupload is used globally

  // Helper function para transformar datos raw a formato de interfaz
  private transformRawTransactions(rawTransactions: any[]): any[] {
    return rawTransactions
      .filter(tx => {
        // Filtrar solo filas con datos de transacciones (que tengan column_1 como número)
        return tx.rawData && typeof tx.rawData.column_1 === 'number' && tx.rawData.column_7 !== undefined;
      })
      .map(tx => {
        // Convertir fecha de Excel (días desde 1900) a fecha JavaScript
        const excelDate = tx.rawData.column_1;
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000); // Conversión Excel a JS
        
        return {
          id: tx._id,
          date: jsDate.toISOString().split('T')[0], // YYYY-MM-DD
          description: tx.rawData.column_4 || 'Sin descripción',
          amount: parseFloat(tx.rawData.column_7) || 0,
          balance: parseFloat(tx.rawData.column_8) || 0,
          category: tx.rawData.column_2 || '',
          type: tx.rawData.column_3 || '',
          accountId: tx.bankName || 'N/A',
          bankName: tx.bankName,
          fileName: tx.fileName,
          importedAt: tx.importedAt
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Ordenar por fecha desc
  }

  public uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !req.files.file) {
        return res.status(400).json({
          success: false,
          error: 'No se ha proporcionado ningún archivo'
        });
      }

      const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
      
      // Validar tipo de archivo
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.mimetype) && !file.name.endsWith('.csv')) {
        return res.status(400).json({
          success: false,
          error: 'Solo se permiten archivos CSV y Excel'
        });
      }

      if (!req.body.accountId) {
        return res.status(400).json({
          success: false,
          error: 'Debe seleccionar una cuenta'
        });
      }

      // Usar userId del token JWT (no id)
      const userId = req.user.userId || req.user.id;
      const accountId = req.body.accountId;

      // Verificar que la cuenta pertenezca al usuario
      const account = await accountService.getAccountById(accountId, userId);
      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Cuenta no encontrada'
        });
      }

      // Debug: verificar archivo antes de subir
      logger.info(`File received - name: ${file.name}, size: ${file.size}, mimetype: ${file.mimetype}`);
      logger.info(`File data type: ${typeof file.data}, data length: ${file.data?.length || 'undefined'}`);
      logger.info(`File buffer exists: ${Buffer.isBuffer(file.data)}, data is array: ${Array.isArray(file.data)}`);
      
      // Subir archivo a GridFS
      const fileId = await this.uploadToGridFS(file, userId, accountId);

      // Publicar evento a RabbitMQ
      const eventId = uuidv4();
      await rabbitMqService.publishFileUploadedEvent({
        fileId,
        fileName: file.name,
        userId,
        accountId,
        eventId,
        uploadedAt: new Date().toISOString(),
        fileSize: file.size,
        contentType: file.mimetype
      });

      res.json({
        success: true,
        message: 'Archivo subido correctamente',
        data: {
          fileId,
          fileName: file.name,
          fileSize: file.size,
          accountId,
          accountName: account.name
        }
      });

    } catch (error) {
      logger.error('Error uploading file:', error);
      next(error);
    }
  }

  public getUploadPage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('[Upload Controller] getUploadPage - req.user:', req.user);
      console.log('[Upload Controller] getUploadPage - req.cookies:', req.cookies);
      
      if (!req.user) {
        throw new Error('User not authenticated - req.user is undefined');
      }
      
      // Usar userId del token JWT (no id)
      const userId = req.user.userId || req.user.id;

      // Obtener cuentas del usuario
      const accounts = await accountService.getAccountsByUserId(userId);

      // Obtener archivos subidos
      const uploadedFiles = await mongoDbService.getUploadedFiles(userId, 20);

      // Obtener transacciones procesadas y transformarlas
      const rawTransactions = await mongoDbService.getProcessedTransactions(userId, 50);
      const processedTransactions = this.transformRawTransactions(rawTransactions);
      logger.info(`Transformed ${processedTransactions.length} transactions for page load`);

      res.render('upload', {
        title: 'Subir Archivos',
        accounts,
        uploadedFiles,
        processedTransactions,
        user: req.user
      });

    } catch (error) {
      logger.error('Error loading upload page:', error);
      next(error);
    }
  }

  public async getProcessedTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      logger.info(`Fetching processed transactions for userId: ${userId}`);
      const rawTransactions = await mongoDbService.getProcessedTransactions(userId, 100);
      logger.info(`Found ${rawTransactions.length} raw transactions for user ${userId}`);
      
      // Usar función helper para transformar datos
      const transformedTransactions = this.transformRawTransactions(rawTransactions);
      
      logger.info(`Transformed ${transformedTransactions.length} transactions for API`);
      res.json({ success: true, data: transformedTransactions });
    } catch (error) {
      logger.error('Error fetching processed transactions:', error);
      res.status(500).json({ error: 'Failed to fetch processed transactions' });
    }
  }

  public getUploadedFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Usar userId del token JWT (no id)
      const userId = req.user.userId || req.user.id;
      const limit = parseInt(req.query.limit as string) || 20;

      const files = await mongoDbService.getUploadedFiles(userId, limit);

      res.json({
        success: true,
        data: files
      });

    } catch (error) {
      logger.error('Error fetching uploaded files:', error);
      next(error);
    }
  }

  private async uploadToGridFS(file: fileUpload.UploadedFile, userId: string, accountId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const bucket = mongoDbService.getGridFSBucket();
      const fileId = new ObjectId();
      const eventId = uuidv4();
      
      const uploadStream: GridFSBucketWriteStream = bucket.openUploadStream(file.name, {
        id: fileId,
        metadata: {
          userId,
          accountId,
          originalName: file.name,
          contentType: file.mimetype,
          uploadedAt: new Date(),
          size: file.size
        }
      });

      uploadStream.on('error', (error) => {
        logger.error('GridFS upload error:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        logger.info(`File uploaded to GridFS: ${fileId}`);
        resolve(fileId.toString());
      });

      // Debug: verificar tamaño del buffer
      logger.info(`File data buffer size: ${file.data?.length || 'undefined'} bytes`);
      logger.info(`File size property: ${file.size} bytes`);
      
      // Escribir el buffer del archivo al stream
      if (file.data && file.data.length > 0) {
        uploadStream.write(file.data);
        uploadStream.end();
      } else {
        logger.error('File data is empty or undefined!');
        uploadStream.end();
      }
    });
  }
}

export default new UploadController();
