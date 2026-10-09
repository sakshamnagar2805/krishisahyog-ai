import React from 'react';

export const Footer: React.FC = () => (
  <footer className="mt-12 bg-navy text-white/75">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid gap-6 md:grid-cols-[1.4fr_1fr] text-sm">
      <div>
        <div className="font-display text-lg font-semibold text-white">KrishiSahyog</div>
        <p className="mt-2 leading-relaxed max-w-xl">
          A guidance assistant for farmers. It explains services and helps you prepare, but it is not a government
          portal: claims, grievances and applications must be filed through the official channels.
        </p>
      </div>
      <div className="space-y-2">
        <div className="font-semibold text-white">Official portals</div>
        <ul className="space-y-1.5">
          <li>
            <a href="https://pmfby.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white underline-offset-4 hover:underline">
              Crop insurance — pmfby.gov.in
            </a>
          </li>
          <li>
            <a href="https://pgportal.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-white underline-offset-4 hover:underline">
              Grievances — pgportal.gov.in
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-[13px] text-white/60">
        Independent agriculture information platform. Not an official Government of India portal. Only verified published government records are displayed.
      </div>
    </div>
  </footer>
);
