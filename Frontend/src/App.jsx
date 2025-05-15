import { useState, useEffect } from 'react';
import { MoreVertical, Trash2, Edit, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function TransactionDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('http://localhost:3000/db/transaction-recent', {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching transactions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Toggle dropdown menu
  const toggleMenu = (id) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  // Delete transaction
  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(transaction => transaction.id !== id));
    setOpenMenuId(null);
  };

  // Update transaction (placeholder for actual implementation)
  const updateTransaction = (id) => {
    alert(`Update transaction with ID: ${id}`);
    setOpenMenuId(null);
  };

  // Generate monthly report (placeholder for actual implementation)
  const generateMonthlyReport = async () => {
    const date = new Date();
    const month = date.getMonth()+1;
    const year = date.getFullYear();
    const sendData = {
      'month': month,
      'year': year
    }
    console.log(month, year);
    try {
        const response = await fetch('http://localhost:3000/db/transaction-total', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sendData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        //  const groupedTransactions = data.reduce((acc, curr) => {
        //   const remark = curr.remark.toLowerCase(); // normalize remarks to lowercase
        //   if (!acc[remark]) {
        //     acc[remark] = {
        //       remark: curr.remark,
        //       transaction: 0,
        //       count: 0
        //     };
        //   }
        //   acc[remark].transaction += curr.transaction;
        //   acc[remark].count += 1;
        //   return acc;
        // }, {});

        // // Convert grouped object back to array and sort by amount
        // const summarizedTransactions = Object.values(groupedTransactions)
        //   .map(item => ({
        //     id: item.remark, // using remark as id since we grouped by it
        //     transaction: item.transaction,
        //     remark: `${item.remark}`,
        //     transactMonth: month,
        //     transactYear: year,
        //     transactDay: ""
        //   }))
        //   .sort((a, b) => b.transaction - a.transaction);
        
        setTransactions(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching transactions:', err);
      } finally {
        setIsLoading(false);
      }
    
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-800">Transaction Dashboard</h1>
          <p className="text-green-600 mt-2">Manage your financial transactions</p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-green-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-green-800">Recent Transactions</h2>
            <button 
              onClick={generateMonthlyReport}
              className="bg-green-700 hover:bg-green-800 text-white py-2 px-4 rounded-md flex items-center"
            >
              <FileText size={16} className="mr-2" />
              Get This Month's Report
            </button>
          </div>
          {isLoading ? (
            <div className="text-center p-4 text-green-600">Loading transactions...</div>
          ) : error ? (
            <div className="text-center p-4 text-red-600">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-green-50">
                  <tr>
                    <th className="text-left p-3 border-b border-green-200 text-green-800">Transaction Amount</th>
                    <th className="text-left p-3 border-b border-green-200 text-green-800">Remark</th>
                    <th className="text-left p-3 border-b border-green-200 text-green-800">Date</th>
                    <th className="text-right p-3 border-b border-green-200 text-green-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-green-50">
                      <td className="p-3 border-b border-green-100">
                        Rs.{transaction.transaction}
                      </td>
                      <td className="p-3 border-b border-green-100">{transaction.remark}</td>
                      <td className="p-3 border-b border-green-100">{transaction.transactDay}/{transaction.transactMonth}/{transaction.transactYear}</td>
                      <td className="p-3 border-b border-green-100 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => toggleMenu(transaction.id)}
                            className="p-1 rounded-full hover:bg-green-100 text-green-700"
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenuId === transaction.id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-green-100 rounded-md shadow-lg z-10 py-1">
                              <button
                                onClick={() => updateTransaction(transaction.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-green-700 hover:bg-green-50"
                              >
                                <Edit size={16} className="mr-2" />
                                Update
                              </button>
                              <button
                                onClick={() => deleteTransaction(transaction.id)}
                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-green-50"
                              >
                                <Trash2 size={16} className="mr-2" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center p-4 text-green-600">
                        No transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}