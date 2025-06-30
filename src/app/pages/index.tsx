'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Head from 'next/head';
import './../../app/globals.css';

const contentTypes = ['Caption', 'Video Idea', 'Hashtags'] as const;
type ContentType = (typeof contentTypes)[number];

export default function Page() {
  const [activeType, setActiveType] = useState<ContentType>('Caption');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);

    const messages = [
      {
        role: 'user',
        parts: [
          {
            text: `You are Ideako, the AI creative partner. The user wants only a ${activeType.toLowerCase()}. Based on the input: "${input}", respond with just the ${activeType.toLowerCase()} — no extra text, no unrelated formats. Response should be short, scroll-stopping, and creative.`,
          },
        ],
      },
    ];

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = await res.json();
      const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No output found.';

      localStorage.setItem('ideako_result', generated);
      router.push('/result');
    } catch (err) {
      console.error('Error generating:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full md:bg-contain bg-center bg-no-repeat text-black font-montserrat tracking-wider"
      style={{ backgroundImage: 'url(/bg-image.png)' }}
    >
      <Head>
        <title>Ideako - AI Creative Partner</title>
      </Head>

      <header className="flex justify-between items-center p-6 bg-white/30 backdrop-blur-3xl">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Ideko Logo" width={30} height={30} />
          <span className="font-semibold text-lg">Ideko</span>
        </div>
        <a
          href="https://www.linkedin.com/in/goutham-g-98a0ba253/"
          className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
        >
          Contact ↗
        </a>
      </header>

      <div className="md:pt-10 md:pl-10">
        <h1 className="text-4xl md:text-5xl font-light">
          Meet <span className="text-black font-semibold">Ideko!</span>
        </h1>
        <p className="text-xl md:text-3xl mt-3">Your intelligent AI creative partner</p>
      </div>

      <main className="flex flex-col md:flex-row justify-between px-6 md:px-24 py-5">
        <div className="max-w-xl text-center md:text-left">
          <div className="md:mt-20">
            <h3 className="text-4xl font-medium">What’s on Your Mind?</h3>

            <div className="flex gap-6 text-[#696969] text-sm font-medium mt-3 mb-3">
              {contentTypes.map((type) => (
                <span
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`cursor-pointer ${
                    activeType === type ? 'text-black font-semibold' : ''
                  }`}
                >
                  {type}
                </span>
              ))}
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter Your Input"
              className="w-full p-2 rounded-md bg-[#D9D9D9] mb-4 md:w-96 outline-none"
            />

            <button
              onClick={handleGenerate}
              className="bg-black text-white px-6 py-3 rounded-md text-xs font-medium flex items-center gap-2"
              disabled={loading}
            >
              <Image src="/generate.png" alt="AI Bot" width={15} height={15} />
              {loading ? 'Generating...' : 'Generate Magic'}
            </button>
          </div>
        </div>

        <div className="mt-10 md:mt-0 flex items-center justify-center">
          {loading ? (
            <Image src="/bot-loading.gif" alt="Bot Loading" width={505} height={505} />
          ) : (
            <Image src="/bot.png" alt="AI Bot" width={505} height={505} />
          )}
        </div>
      </main>
    </div>
  );
}
