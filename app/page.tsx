import Link from 'next/link';
import { MainMenu } from '@/components/MainMenu';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
            Pantheon Pandemonium
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Become a proto-god. Shape the land. Ascend to divinity.
          </p>
        </div>

        <MainMenu />

        <div className="mt-12 text-center text-gray-400">
          <p className="text-sm">
            A turn-based strategy roguelite where gods compete for dominance
          </p>
        </div>
      </div>
    </main>
  );
}