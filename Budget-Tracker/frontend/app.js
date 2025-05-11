document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('transactionForm');
    const transactionsTable = document.getElementById('transactionsTable').getElementsByTagName('tbody')[0];
    const filterIncome = document.getElementById('showIncome');
    const filterExpenses = document.getElementById('showExpenses');
    const filterStartDate = document.getElementById('startDate');
    const filterEndDate = document.getElementById('endDate');
    
    let currentSort = {
        field: null,
        direction: 'none'
    };

    // Initialize sorting
    initSorting();
    
    // Load initial transactions
    loadTransactions();
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        addTransaction(getFormData());
    });
    
    // Filter changes
    [filterIncome, filterExpenses, filterStartDate, filterEndDate].forEach(filter => {
        filter.addEventListener('change', loadTransactions);
    });
    
    function initSorting() {
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const sortField = header.getAttribute('data-sort');
                
                // Reset icons
                document.querySelectorAll('.sort-icon').forEach(icon => {
                    icon.innerHTML = '';
                });
                
                // Update current sort
                if (currentSort.field === sortField) {
                    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = sortField;
                    currentSort.direction = 'asc';
                }
                
                // Set icon
                const iconId = `${sortField}-sort-icon`;
                const icon = document.getElementById(iconId);
                icon.innerHTML = currentSort.direction === 'asc' ? '↑' : '↓';
                
                // Update classes
                document.querySelectorAll('.sortable').forEach(el => {
                    el.classList.remove('sorted-asc', 'sorted-desc');
                });
                header.classList.add(`sorted-${currentSort.direction}`);
                
                // Reload transactions
                loadTransactions();
            });
        });
    }
    
    function getFormData() {
        return {
            title: document.getElementById('title').value,
            amount: parseFloat(document.getElementById('amount').value),
            date: document.getElementById('date').value,
            type: document.getElementById('type').value
        };
    }
    
    function loadTransactions() {
        fetch('http://localhost:8080/api/transactions')
            .then(response => response.json())
            .then(transactions => {
                transactions = filterTransactions(transactions);
                transactions = sortTransactions(transactions);
                updateTransactionsTable(transactions);
                updateBalance(transactions);
            })
            .catch(error => showError('Error loading transactions: ' + error));
    }
    
    function sortTransactions(transactions) {
        if (!currentSort.field) return transactions;
        
        return [...transactions].sort((a, b) => {
            let valueA, valueB;
            
            if (currentSort.field === 'amount') {
                valueA = a.amount;
                valueB = b.amount;
            } else {
                valueA = new Date(a.date);
                valueB = new Date(b.date);
            }
            
            if (currentSort.direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
    }
    
    function filterTransactions(transactions) {
        const showIncome = filterIncome.checked;
        const showExpenses = filterExpenses.checked;
        const startDate = filterStartDate.value;
        const endDate = filterEndDate.value;
        
        return transactions.filter(transaction => {
            const typeMatch = (showIncome && transaction.type === 'INCOME') || 
                             (showExpenses && transaction.type === 'EXPENSE');
            
            let dateMatch = true;
            if (startDate) dateMatch = dateMatch && transaction.date >= startDate;
            if (endDate) dateMatch = dateMatch && transaction.date <= endDate;
            
            return typeMatch && dateMatch;
        });
    }
    
    function updateTransactionsTable(transactions) {
        transactionsTable.innerHTML = '';
        transactions.forEach(transaction => {
            const row = transactionsTable.insertRow();
            row.innerHTML = `
                <td>${transaction.title}</td>
                <td class="${transaction.type.toLowerCase()}">${transaction.amount.toFixed(2)}</td>
                <td>${formatDate(transaction.date)}</td>
                <td>${transaction.type}</td>
                <td><button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete</button></td>
            `;
        });
    }
    
    function updateBalance(transactions) {
        let totalIncome = 0;
        let totalExpenses = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'INCOME') {
                totalIncome += transaction.amount;
            } else {
                totalExpenses += transaction.amount;
            }
        });
        
        document.getElementById('totalIncome').textContent = totalIncome.toFixed(2);
        document.getElementById('totalExpenses').textContent = totalExpenses.toFixed(2);
        document.getElementById('balance').textContent = (totalIncome - totalExpenses).toFixed(2);
    }
    
    function addTransaction(transaction) {
        fetch('http://localhost:8080/api/transactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transaction)
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(() => {
            form.reset();
            loadTransactions();
            showMessage('Transaction added successfully!', 'success');
        })
        .catch(error => showError('Error adding transaction: ' + error));
    }
    
    function deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        
        fetch(`http://localhost:8080/api/transactions/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            loadTransactions();
            showMessage('Transaction deleted successfully!', 'success');
        })
        .catch(error => showError('Error deleting transaction: ' + error));
    }
    
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
    
    function showMessage(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
    
    function showError(message) {
        console.error(message);
        showMessage(message, 'error');
    }
    
    window.deleteTransaction = deleteTransaction;
});