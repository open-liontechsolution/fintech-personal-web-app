import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger';

// Definir interfaz para las opciones de email
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

// Definir tipos de plantillas de correo
enum EmailTemplate {
  VERIFICATION = 'verification',
  PASSWORD_RESET = 'password-reset',
  WELCOME = 'welcome'
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private defaultFromEmail: string;
  private appUrl: string;

  constructor() {
    // Obtener configuración desde variables de entorno
    this.defaultFromEmail = process.env.EMAIL_FROM || 'no-reply@fintechpersonal.com';
    this.appUrl = process.env.APP_URL || 'http://localhost:3000';

    // Crear transportador de Nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: parseInt(process.env.EMAIL_PORT || '2525'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || ''
      }
    });

    // Verificar configuración del transportador
    this.verifyTransporter();
  }

  // Verificar la configuración del transportador de correo
  private async verifyTransporter(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('Email service configured successfully');
    } catch (error) {
      logger.error('Failed to configure email service', { error });
    }
  }

  // Generar token aleatorio para verificación de email o restablecimiento de contraseña
  public generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Enviar un correo electrónico
  public async sendEmail(options: EmailOptions): Promise<boolean> {
    const mailOptions = {
      from: options.from || this.defaultFromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { messageId: info.messageId, to: options.to });
      return true;
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to });
      return false;
    }
  }

  // Renderizar una plantilla de correo electrónico
  private async renderTemplate(template: EmailTemplate, data: any): Promise<string> {
    const templatePath = path.join(__dirname, '..', 'views', 'emails', `${template}.ejs`);
    
    try {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      return ejs.render(templateContent, { ...data, appUrl: this.appUrl });
    } catch (error) {
      logger.error('Failed to render email template', { error, template });
      throw new Error(`Failed to render template: ${template}`);
    }
  }

  // Enviar correo de verificación de email
  public async sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
    const verificationUrl = `${this.appUrl}/verify-email?token=${token}`;
    
    const html = await this.renderTemplate(EmailTemplate.VERIFICATION, {
      name,
      verificationUrl
    });

    return this.sendEmail({
      to: email,
      subject: 'Verifica tu correo electrónico',
      html
    });
  }

  // Enviar correo de restablecimiento de contraseña
  public async sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
    
    const html = await this.renderTemplate(EmailTemplate.PASSWORD_RESET, {
      name,
      resetUrl
    });

    return this.sendEmail({
      to: email,
      subject: 'Restablecimiento de contraseña',
      html
    });
  }

  // Enviar correo de bienvenida (después de verificar)
  public async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = await this.renderTemplate(EmailTemplate.WELCOME, {
      name
    });

    return this.sendEmail({
      to: email,
      subject: '¡Bienvenido a Fintech Personal!',
      html
    });
  }
}

export default new EmailService();
