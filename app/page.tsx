"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Shield, Zap, Download } from "lucide-react";
import Hls from "hls.js";

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setError("Please enter a valid Terabox URL.");
      return;
    }

    setLoading(true);
    setError("");
    setStreamUrl("");

    try {
      const backendUrl = "http://localhost:3000/api/watch";
      const res = await fetch(`${backendUrl}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: inputUrl }),
      });

      if (!res.ok) throw new Error("Failed to fetch stream URL");

      const data = await res.json();

      if (!data.streamUrl) {
        throw new Error("Invalid response from server.");
      }

      setStreamUrl(data.streamUrl);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Setup HLS on streamUrl change
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("HLS manifest parsed, ready to play");
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          setError("Failed to load video stream");
        }
      });

      return () => {
        hls.destroy();
      };
    } else {
      setError("HLS streaming not supported in this browser");
    }
  }, [streamUrl]);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-black" />
            </div>
            <span className="text-xl font-semibold">TeraStream</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6">
        {/* Hero Section */}
        <section className="py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Stream Terabox Videos
            <span className="text-amber-500">.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Convert any Terabox link into a streamable video. No downloads, no waiting.
          </p>

          {/* Input Form */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Paste your Terabox link here..."
                  className="flex-1 px-4 py-3 bg-black text-white rounded-xl border border-gray-700 focus:border-amber-500 focus:outline-none transition-colors placeholder-gray-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 min-w-[100px]"
                >
                  {loading ? (
                    <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Stream</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto text-center">
            <div>
              <div className="text-3xl font-bold text-amber-500">1M+</div>
              <div className="text-sm text-gray-400">Videos streamed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-500">99.9%</div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-500">&lt;2s</div>
              <div className="text-sm text-gray-400">Load time</div>
            </div>
          </div>
        </section>

        {/* Video Player */}
        {streamUrl && (
          <section className="mb-24">
            <div className="bg-gray-900 rounded-2xl p-2 border border-gray-800">
              <video
                ref={videoRef}
                controls
                className="w-full h-[60vh] rounded-xl bg-black"
                poster=""
                preload="metadata"
              >
                <p className="text-center text-gray-400 p-8">
                  Your browser doesn't support video playback.
                </p>
              </video>
            </div>
          </section>
        )}
        {streamUrl && (
          <textarea
            readOnly
            value={streamUrl}
            className="w-full h-50vh bg-gray-900 rounded-2xl p-2 border border-gray-800"
          />
        )}

        {/* Features */}
        <section id="features" className="py-24">
          <h2 className="text-3xl font-bold text-center mb-16">
            Why TeraStream<span className="text-amber-500">?</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Instant Streaming",
                desc: "No buffering, no delays. Stream immediately."
              },
              {
                icon: Shield,
                title: "Secure & Private",
                desc: "Your links are processed safely and securely."
              },
              {
                icon: Download,
                title: "No Downloads",
                desc: "Stream directly in your browser. Save storage."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-900 rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section id="how" className="py-24">
          <h2 className="text-3xl font-bold text-center mb-16">
            How it works<span className="text-amber-500">.</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Paste Link",
                desc: "Copy your Terabox video link and paste it above"
              },
              {
                step: "2", 
                title: "Process",
                desc: "Our servers convert the link to a streamable format"
              },
              {
                step: "3",
                title: "Stream",
                desc: "Watch your video instantly, no downloads required"
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-amber-500 text-black font-bold rounded-xl flex items-center justify-center mx-auto mb-6 text-lg">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24">
          <h2 className="text-3xl font-bold text-center mb-16">
            FAQ<span className="text-amber-500">.</span>
          </h2>
          
          <div className="max-w-2xl mx-auto space-y-6">
            {[
              {
                q: "Is it free to use?",
                a: "Yes, TeraStream is completely free to use with no hidden charges."
              },
              {
                q: "What video formats are supported?",
                a: "We support all major video formats including M3U8/HLS streams from Terabox."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We don't store your links or videos. Everything is processed in real-time."
              },
              {
                q: "Are there any limits?",
                a: "No limits on the number of videos you can stream or their file size."
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-gray-400">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-24">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center">
                <Play className="w-3 h-3 text-black" />
              </div>
              <span className="font-semibold">TeraStream</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 TeraStream. Simple video streaming.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}