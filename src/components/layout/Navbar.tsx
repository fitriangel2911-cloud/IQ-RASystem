import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * Global Application Navigation Layout
 * Incorporating modern aesthetic design cues consistent with requirements.
 */
export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/75 backdrop-blur-md transition-all">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              iQ-RA System
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-emerald-600">
              Dashboard
            </Link>
            <Link href="/cif" className="text-sm font-medium text-gray-700 hover:text-emerald-600">
              Keanggotaan
            </Link>
            <Link href="/financing" className="text-sm font-medium text-gray-700 hover:text-emerald-600">
              Pembiayaan
            </Link>
            <Link href="/accounting" className="text-sm font-medium text-gray-700 hover:text-emerald-600">
              Akuntansi
            </Link>
            <Button variant="primary" size="sm">Login</Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
