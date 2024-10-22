const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactionsDB', { useNewUrlParser: true, useUnifiedTopology: true });

// Define Mongoose schemas
const transactionSchema = new mongoose.Schema({
  type: String,
  category: String,
  amount: Number,
  date: { type: Date, default: Date.now },
  description: String,
});

const categorySchema = new mongoose.Schema({
  name: String,
  type: String,  // income or expense
});

const Transaction = mongoose.model('Transaction', transactionSchema);
const Category = mongoose.model('Category', categorySchema);

// POST /transactions: Add new transaction
app.post('/transactions', (req, res) => {
  const newTransaction = new Transaction(req.body);
  newTransaction.save((err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(201).send(newTransaction);
  });
});

// GET /transactions: Retrieve all transactions
app.get('/transactions', (req, res) => {
  Transaction.find({}, (err, transactions) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send(transactions);
  });
});

// GET /transactions/:id: Retrieve a transaction by ID
app.get('/transactions/:id', (req, res) => {
  Transaction.findById(req.params.id, (err, transaction) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }
    res.status(200).send(transaction);
  });
});

// PUT /transactions/:id: Update a transaction by ID
app.put('/transactions/:id', (req, res) => {
  Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, transaction) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }
    res.status(200).send(transaction);
  });
});

// DELETE /transactions/:id: Delete a transaction by ID
app.delete('/transactions/:id', (req, res) => {
  Transaction.findByIdAndDelete(req.params.id, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.status(200).send('Transaction deleted');
  });
});

// GET /summary: Get a summary of transactions (total income, total expense, and balance)
app.get('/summary', (req, res) => {
  Transaction.aggregate([
    {
      $group: {
        _id: "$type",
        totalAmount: { $sum: "$amount" }
      }
    }
  ], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    const summary = { income: 0, expense: 0 };
    result.forEach(group => {
      if (group._id === 'income') {
        summary.income = group.totalAmount;
      } else if (group._id === 'expense') {
        summary.expense = group.totalAmount;
      }
    });
    summary.balance = summary.income - summary.expense;
    res.status(200).send(summary);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port ");
});