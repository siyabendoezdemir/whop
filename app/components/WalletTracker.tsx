'use client';

import { useState } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Using a more reliable public RPC endpoint
const connection = new Connection('https://rpc.helius.xyz/?api-key=1d14d4dd-e7e3-4e8f-b8d3-ffa0c2c13f8c');

export default function WalletTracker() {
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate address
      const pubKey = new PublicKey(address);
      
      // Get balance
      const bal = await connection.getBalance(pubKey);
      setBalance(bal / LAMPORTS_PER_SOL);

      // Get recent transactions
      const signatures = await connection.getSignaturesForAddress(pubKey, { limit: 10 });
      const transactions = await Promise.all(
        signatures.map(sig => connection.getParsedTransaction(sig.signature))
      );

      // Filter for swap transactions
      const swaps = transactions
        .filter(tx => tx?.meta?.logMessages?.some(msg => 
          msg?.toLowerCase().includes('swap') || 
          msg?.toLowerCase().includes('exchange') ||
          msg?.toLowerCase().includes('trade')
        ))
        .map(tx => ({
          signature: tx?.transaction.signatures[0],
          timestamp: new Date(tx?.blockTime! * 1000).toLocaleString(),
          successful: tx?.meta?.err === null
        }));

      setTrades(swaps);
    } catch (err: any) {
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
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter Solana address..."
          className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
        />
        <button
          onClick={fetchWalletData}
          disabled={loading || !address}
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Trades</h2>
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