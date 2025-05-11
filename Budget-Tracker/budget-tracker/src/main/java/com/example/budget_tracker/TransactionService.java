package com.example.budget_tracker;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;

    @Autowired
    public TransactionService(TransactionRepository transactionRepository)
    {
        this.transactionRepository = transactionRepository;
    }

    public List<Transaction> getAllTransactions()
    {
        return transactionRepository.findAll();
    }

    public Transaction addTransaction (Transaction transaction)
    {
        return transactionRepository.save(transaction);
    }

    public void deleteTransaction (Long id)
    {
        transactionRepository.deleteById(id);
    }

}
