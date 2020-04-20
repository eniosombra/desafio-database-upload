import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_name: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category_name,
  }: Request): Promise<Transaction> {
    const categoryRepository = await getRepository(Category);
    let categoryExists = await categoryRepository.findOne({
      where: { title: category_name },
    });

    if (!categoryExists) {
      const category = await categoryRepository.create({
        title: category_name,
      });

      categoryExists = await categoryRepository.save(category);
    }

    const transactionRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Insufficient balance!');
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category: categoryExists,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
