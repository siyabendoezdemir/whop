'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Using Solana devnet endpoint for better rate limits and reliability
const connection = new Connection(clusterApiUrl('devnet'), {
  commitment: 'confirmed',
  wsEndpoint: 'wss://api.devnet.solana.com/'
});

const DEFAULT_WALLET = '6FwX3We7adVpGTGACrfbkcSqPfWvF64px2a6yf7JbCTg';

function parseTransactionType(tx: any): any {
  if (!tx.meta || !tx.transaction?.message) return { description: 'Unknown Transaction' };

  const instructions = tx.transaction.message.instructions;
  const parsedInstructions = tx.meta.innerInstructions?.[0]?.instructions || instructions;
  const logs = tx.meta.logMessages || [];
  const accounts = tx.transaction.message.accountKeys.map((key: any) => key.pubkey.toString());
  
  // Get pre and post token balances
  const preBalances = tx.meta.preBalances || [];
  const postBalances = tx.meta.postBalances || [];
  const balanceChanges = accounts.map((account: string, index: number) => {
    const pre = preBalances[index] / LAMPORTS_PER_SOL;
    const post = postBalances[index] / LAMPORTS_PER_SOL;
    const change = post - pre;
    if (change !== 0) {
      return {
        account,
        change: change.toFixed(4)
      };
    }
    return null;
  }).filter(Boolean);

  return {
    description: 'Transaction Details',
    accounts,
    balanceChanges,
    logs: logs.filter((log: string) => !log.includes('Program log:')), // Filter out program logs
    instructions: parsedInstructions
  };
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="truncate">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {trade.signature}
                        </p>
                        <p className="text-sm text-gray-500">{trade.timestamp}</p>
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

                    {/* Balance Changes */}
                    {trade.type.balanceChanges?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500">Balance Changes:</p>
                        {trade.type.balanceChanges.map((change: any, i: number) => (
                          <p key={i} className="text-xs text-gray-600">
                            {change.change > 0 ? '+' : ''}{change.change} SOL
                            <span className="text-gray-400 ml-1">({change.account})</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Transaction Logs */}
                    {trade.type.logs?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500">Logs:</p>
                        {trade.type.logs.map((log: string, i: number) => (
                          <p key={i} className="text-xs text-gray-600">{log}</p>
                        ))}
                      </div>
                    )}
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