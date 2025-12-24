'use client';

import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <>
      <Sidebar />
      <main className="pt-14 md:pl-64 min-h-screen">
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </>
  );
}
