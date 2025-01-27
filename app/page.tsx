import { ModeToggle } from '@/components/mode-toggle';
import UserSidebar from './components/UserSidebar';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Creator Dashboard</h1>
        <ModeToggle />
        <UserSidebar />
      </div>
    </div>
  );
}
