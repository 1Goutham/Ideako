'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';
import './../../app/globals.css';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

export default function ResultPage() {
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ideako_result');
    setOutput(stored ?? 'No output found. Please try again.');
  }, []);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('Copied!');
  };

  return (
    <div className="min-h-screen w-full bg-center bg-no-repeat text-black font-montserrat tracking-wider" style={{ backgroundImage: 'url(/Altered-bg.png)' }}>
      <Head>
        <title>Ideako - AI Creative Partner</title>
      </Head>

      <header className="flex justify-between items-center p-6 bg-white/30 backdrop-blur-3xl">
        <Link href="/">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Ideko Logo" width={30} height={30} />
            <span className="font-semibold text-lg">Ideko</span>
          </div>
        </Link>
        <a
          href="https://www.linkedin.com/in/goutham-g-98a0ba253/"
          className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
        >
          Contact ↗
        </a>
      </header>

      <div className="flex flex-col justify-center items-center">
        <Image src="/bot-result.png" alt="Bot" width={250} height={250} className="mt-20" />

        <div
          className="rounded-2xl shadow-inner backdrop-blur p-6 md:p-8 w-[370px] md:w-[900px]"
          style={{
            border: '2px solid rgba(255, 255, 255, 1)',
            backgroundColor: 'rgba(217, 217, 217, 0.1)',
            boxShadow: 'inset 30px 30px 15px rgba(255, 255, 255, 0.25)',
          }}
        >
          <p className="text-gray-600 text-sm mb-2 text-center md:text-left">Here’s the Juice :</p>

          <h2 className="text-sm md:text-lg font-medium text-black mb-4 leading-relaxed text-justify">
            {output ? <ReactMarkdown>{`"${output}"`}</ReactMarkdown> : 'No output found. Please try generating again.'}
          </h2>

          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <button onClick={handleCopy} className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300">
              {copied ? '✅ Copied' : '📋 Copy'}
            </button>
            <Link href="/" className="bg-black text-white px-4 py-2 rounded-md hover:opacity-90">
              ↻ Regenerate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
