'use client';
import React from 'react';

export default function GlobalSiteBackground() {
  return (
    <div className="site-bg-wrapper" aria-hidden="true">
      <div className="site-bg-pattern" />
      <div className="site-bg-overlay" />
    </div>
  );
}
