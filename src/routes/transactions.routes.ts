import { Router } from 'express';
import { getCustomRepository } from 'typeorm';
import multer from 'multer';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';
import uploadConfig from '../config/upload';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {
  const transactionsRepository = getCustomRepository(TransactionsRepository);

  /**
   * No método FIND abaixo selecionei somente os campos que estou interessado,
   * mas o relacionamento da entidade Category estava fazendo com que os campos
   * 'created_at' e 'updated_at' fosse exibindo, então para que essas informações
   * não fossem exibidas adicionei a propriedade@CreateDateColumn({select: false})
   * em Category. No entanto, nem sempre poderei colocar essa propriedades em
   * alguns relacionamento. Por isso desenvolvi outra estratégia usando o
   * createQueryBuilder de forma que possa escolher quais campos pretendo exibir
   * de forma mais detalhada.
   */

  const transactions = await transactionsRepository.find({
    // select: ['id', 'title', 'value', 'type'],
    relations: ['category'],
  });

  /*
  const transactions = await transactionsRepository
    .createQueryBuilder('trs')
    .select([
      'trs.id',
      'trs.title',
      'trs.type',
      'trs.value',
      'ctg.id',
      'ctg.title',
    ])
    .innerJoin('trs.category', 'ctg')
    .getMany();
    */

  const balance = await transactionsRepository.getBalance();

  return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transactions = await createTransaction.execute({
    title,
    value,
    type,
    category_name: category,
  });

  return response.json(transactions);
});

transactionsRouter.delete('/:id', async (request, response) => {
  const { id } = request.params;
  const deleteTransactionService = new DeleteTransactionService();
  deleteTransactionService.execute(id);
  return response.status(204).send();
});
transactionsRouter.post(
  '/import',
  upload.single('file'),
  async (request, response) => {
    const importTransactions = new ImportTransactionsService();
    const transactions = await importTransactions.execute(request.file.path);
    response.json(transactions);
  },
);

export default transactionsRouter;
