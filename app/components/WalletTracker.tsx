'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Using Solana devnet endpoint for better rate limits and reliability
const connection = new Connection(clusterApiUrl('devnet'), {
  commitment: 'confirmed',
  wsEndpoint: 'wss://api.devnet.solana.com/'
});

const DEFAULT_WALLET = '7C4jsPZpht42Tw6MjXWF56Q5RQUocjBBmciEjDa8HRtp';

function parseTransactionType(tx: any): string {
  if (!tx.meta?.logMessages) return 'Unknown Transaction';

  // Join all log messages to search through them
  const logs = tx.meta.logMessages.join(' ');
  
  // Look for common DEX and swap patterns
  if (logs.includes('Swap')) {
    // Try to find amounts and tokens
    const amountPattern = /(\d+\.?\d*)\s*(SOL|USDC|USDT|RAY|SRM|[\w]+)/gi;
    const matches = [...logs.matchAll(amountPattern)];
    
    if (matches.length >= 2) {
      const [from, to] = matches;
      return `Swapped ${from[1]} ${from[2]} for ${to[1]} ${to[2]}`;
    }
    return 'Token Swap';
  }
  
  if (logs.includes('Transfer')) {
    const amountPattern = /(\d+\.?\d*)\s*(SOL|USDC|USDT|RAY|SRM|[\w]+)/gi;
    const matches = [...logs.matchAll(amountPattern)];
    if (matches.length > 0) {
      const [amount] = matches;
      return `Transferred ${amount[1]} ${amount[2]}`;
    }
    return 'Token Transfer';
  }

  if (logs.includes('Deposit')) return 'Deposit';
  if (logs.includes('Withdraw')) return 'Withdrawal';
  if (logs.includes('Stake')) return 'Staking';
  if (logs.includes('Create')) return 'Account Creation';
  if (logs.includes('Close')) return 'Account Closure';

  return 'Transaction';
}

export default function WalletTracker() {
  const [addressInput, setAddressInput] = useState(DEFAULT_WALLET);
  const [balance, setBalance] = useState<number | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchWalletData();
  }, []); // Empty dependency array means this runs once on mount

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate address
      const pubKey = new PublicKey(addressInput);
      
      // Get account info including balance
      const accountInfo = await connection.getAccountInfo(pubKey);
      if (accountInfo) {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      } else {
        setBalance(0);
      }

      // Get recent transactions
      const signatures = await connection.getSignaturesForAddress(pubKey, { 
        limit: 10
      });
      
      // Get full transaction details
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            });
            
            if (!tx) return null;

            return {
              signature: sig.signature,
              timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Unknown time',
              successful: tx.meta?.err === null,
              type: parseTransactionType(tx)
            };
          } catch (err) {
            console.error('Error fetching transaction:', err);
            return null;
          }
        })
      );

      setTrades(transactions.filter(Boolean));
    } catch (err: any) {
      console.error('Wallet Data Error:', err);
      setError(err.message);
      setBalance(null);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex gap-4">
        <input
          type="text"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="Enter Solana address..."
          className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
        />
        <button
          onClick={fetchWalletData}
          disabled={loading || !addressInput}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <MagnifyingGlassIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {balance !== null && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900">Wallet Balance</h2>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {balance.toFixed(4)} SOL
          </p>
        </div>
      )}

      {trades.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <ul className="divide-y divide-gray-200">
              {trades.map((trade, index) => (
                <li key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {trade.signature}
                      </p>
                      <p className="text-sm text-gray-500">{trade.timestamp}</p>
                      <p className="text-xs text-gray-400 mt-1 truncate">{trade.type}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        trade.successful
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {trade.successful ? 'Success' : 'Failed'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 