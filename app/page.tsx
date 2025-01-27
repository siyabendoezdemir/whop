import WalletTracker from './components/WalletTracker';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Solana Wallet Tracker
          </h1>
          <p className="mt-2 text-gray-600">
            Enter a Solana wallet address to view balance and recent trades
          </p>
        </div>
        <WalletTracker />
      </div>
    </div>
  );
}
