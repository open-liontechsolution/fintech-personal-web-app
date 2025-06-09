import { Request, Response } from 'express';
import { Account } from '../models';
import logger from '../config/logger';

/**
 * Obtener todas las cuentas del usuario
 * @route GET /api/accounts
 * @access Private
 */
export const getUserAccounts = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const accounts = await Account.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ accounts });
  } catch (error) {
    logger.error('Error al obtener las cuentas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener las cuentas' });
  }
};

/**
 * Obtener una cuenta específica
 * @route GET /api/accounts/:id
 * @access Private
 */
export const getAccountById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const account = await Account.findOne({
      where: { id, userId }
    });

    if (!account) {
      res.status(404).json({ error: 'Cuenta no encontrada' });
      return;
    }

    res.json({ account });
  } catch (error) {
    logger.error('Error al obtener los detalles de la cuenta:', error);
    res.status(500).json({ error: 'Error al obtener los detalles de la cuenta' });
  }
};

/**
 * Crear una nueva cuenta
 * @route POST /api/accounts
 * @access Private
 */
export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { 
      name, 
      type, 
      institution, 
      accountNumber, 
      balance, 
      currency, 
      color, 
      icon, 
      notes 
    } = req.body;

    const account = await Account.create({
      userId,
      name,
      type,
      institution,
      accountNumber,
      balance: parseFloat(balance) || 0,
      currency,
      color,
      icon,
      notes
    });

    res.status(201).json({ account });
  } catch (error) {
    logger.error('Error al crear la cuenta:', error);
    res.status(500).json({ error: 'Error al crear la cuenta' });
  }
};

/**
 * Actualizar una cuenta existente
 * @route PUT /api/accounts/:id
 * @access Private
 */
export const updateAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const account = await Account.findOne({
      where: { id, userId }
    });

    if (!account) {
      res.status(404).json({ error: 'Cuenta no encontrada' });
      return;
    }

    const { 
      name, 
      type, 
      institution, 
      accountNumber, 
      balance, 
      currency, 
      isActive,
      color, 
      icon, 
      notes 
    } = req.body;

    await account.update({
      name: name || account.name,
      type: type || account.type,
      institution: institution !== undefined ? institution : account.institution,
      accountNumber: accountNumber !== undefined ? accountNumber : account.accountNumber,
      balance: balance !== undefined ? parseFloat(balance) : account.balance,
      currency: currency || account.currency,
      isActive: isActive !== undefined ? isActive : account.isActive,
      color: color !== undefined ? color : account.color,
      icon: icon !== undefined ? icon : account.icon,
      notes: notes !== undefined ? notes : account.notes
    });

    res.json({ account });
  } catch (error) {
    logger.error('Error al actualizar la cuenta:', error);
    res.status(500).json({ error: 'Error al actualizar la cuenta' });
  }
};

/**
 * Eliminar una cuenta
 * @route DELETE /api/accounts/:id
 * @access Private
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const account = await Account.findOne({
      where: { id, userId }
    });

    if (!account) {
      res.status(404).json({ error: 'Cuenta no encontrada' });
      return;
    }

    await account.destroy();

    res.json({ message: 'Cuenta eliminada correctamente' });
  } catch (error) {
    logger.error('Error al eliminar la cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
};
