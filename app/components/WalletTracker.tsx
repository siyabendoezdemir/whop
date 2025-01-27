'use client';

import { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Using Solana devnet endpoint with higher rate limits
const connection = new Connection(clusterApiUrl('devnet'), {
  commitment: 'confirmed',
  wsEndpoint: 'wss://api.devnet.solana.com/',
  confirmTransactionInitialTimeout: 60000
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
      setTrades([]);
      
      // Validate address
      const pubKey = new PublicKey(addressInput);
      
      // Get account info including balance
      const accountInfo = await connection.getAccountInfo(pubKey);
      if (accountInfo) {
        setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
      } else {
        setBalance(0);
      }

      // Get all signatures using getConfirmedSignaturesForAddress2
      const allSignatures = await connection.getConfirmedSignaturesForAddress2(
        pubKey,
        { limit: 1000 } // Get up to 1000 signatures
      );

      if (allSignatures.length === 0) return;

      // Get transaction details in larger batches
      const batchSize = 25; // Increased batch size
      const allTransactions = [];

      for (let i = 0; i < allSignatures.length; i += batchSize) {
        const batch = allSignatures.slice(i, i + batchSize);
        const batchTransactions = await Promise.all(
          batch.map(async (sig) => {
            try {
              const tx = await connection.getParsedTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
                commitment: 'confirmed'
              });
              
              if (!tx) return null;

              return {
                signature: sig.signature,
                timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Unknown time',
                blockTime: sig.blockTime || 0,
                successful: !sig.err,
                type: parseTransactionType(tx)
              };
            } catch (err) {
              console.error('Error fetching transaction:', err);
              return null;
            }
          })
        );

        allTransactions.push(...batchTransactions.filter(Boolean));

        // Add a small delay between batches
        if (i + batchSize < allSignatures.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Sort by blockTime (newest first)
      setTrades(allTransactions
        .filter(tx => tx !== null)
        .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0))
      );
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Solana Wallet Explorer
          </h1>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse mr-2"></span>
              Devnet
            </span>
          </div>
          <p className="text-lg text-gray-600">
            Track transactions and balance for any Solana wallet on devnet
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-700">
                  Wallet Address
                </label>
                <span className="text-xs text-yellow-600 font-medium">
                  Devnet Only
                </span>
              </div>
              <input
                id="wallet-address"
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter Solana wallet address..."
                className="block w-full rounded-lg border border-gray-300 bg-white text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-base p-4 font-mono"
              />
            </div>
            <div className="flex sm:items-end">
              <button
                onClick={fetchWalletData}
                disabled={loading || !addressInput}
                className="w-full sm:w-auto h-[52px] px-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                    <span className="font-medium">Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {balance !== null && (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 sm:p-8 mb-8 text-white">
            <h2 className="text-xl font-medium text-white/90 mb-2">Wallet Balance</h2>
            <div className="flex items-baseline flex-wrap gap-2">
              <p className="text-4xl sm:text-5xl font-bold">{balance.toFixed(4)}</p>
              <p className="text-lg sm:text-xl text-white/90">SOL</p>
            </div>
          </div>
        )}

        {trades.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Transaction History
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({trades.length} transactions)
                </span>
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {trades.map((trade, index) => (
                <li key={index} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150">
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-sm font-mono text-gray-900 break-all">
                          {trade.signature}
                        </p>
                        <p className="text-sm text-gray-500">{trade.timestamp}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <a
                            href={`https://explorer.solana.com/tx/${trade.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-150"
                          >
                            <span className="mr-1">🔍</span> Solana Explorer
                          </a>
                          <a
                            href={`https://solscan.io/tx/${trade.signature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 transition-colors duration-150"
                          >
                            <span className="mr-1">📊</span> Solscan
                          </a>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                            trade.successful
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.successful ? '✓ Success' : '✕ Failed'}
                        </span>
                      </div>
                    </div>

                    {trade.type.balanceChanges?.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">Balance Changes</p>
                        <div className="space-y-1">
                          {trade.type.balanceChanges.map((change: any, i: number) => (
                            <p key={i} className="text-sm flex flex-wrap items-center gap-2">
                              <span className={change.change > 0 ? 'text-green-600' : 'text-red-600'}>
                                {change.change > 0 ? '+' : ''}{change.change} SOL
                              </span>
                              <span className="text-gray-400 text-xs break-all">
                                ({change.account})
                              </span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {trade.type.logs?.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                        <p className="text-xs font-medium text-gray-500 mb-2">Transaction Logs</p>
                        <div className="space-y-1">
                          {trade.type.logs.map((log: string, i: number) => (
                            <p key={i} className="text-xs text-gray-600 font-mono whitespace-pre-wrap">{log}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 