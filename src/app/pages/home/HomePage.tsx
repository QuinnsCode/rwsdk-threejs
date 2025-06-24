import { ThreeJSScene } from "@/app/components/ThreeJSScene";
import { BundleAnalyzer } from "@/app/components/BundleAnalyzer";

export default function HomePage () {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-white">
              Three.js Demo
            </h1>
            <nav className="space-x-4">
              <a href="/protected" className="text-gray-300 hover:text-white transition-colors">
                Protected
              </a>
              <a href="/user/login" className="text-gray-300 hover:text-white transition-colors">
                Login
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4">
            Welcome to Three.js with Cloudflare Workers
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            This demo shows Three.js loaded efficiently from Cloudflare R2, 
            keeping your worker bundle small while delivering fast 3D graphics.
          </p>
        </div>

        {/* Three.js Scene Container */}
        <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-2xl font-semibold mb-2">Interactive 3D Scene</h3>
            <p className="text-gray-400">
              Click and drag to rotate • Scroll to zoom
            </p>
          </div>
          
          {/* Three.js Component */}
          <div className="relative">
            <ThreeJSScene />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-3">🚀 Fast Loading</h4>
              <p className="text-gray-300">
                Three.js is served from Cloudflare R2, cached at the edge for lightning-fast delivery.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-3">📦 Small Bundle</h4>
              <p className="text-gray-300">
                Worker bundle stays lean by loading Three.js dynamically instead of bundling it.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-xl font-semibold mb-3">🌍 Global CDN</h4>
              <p className="text-gray-300">
                Leverages Cloudflare's global network for optimal performance worldwide.
              </p>
            </div>
          </div>

          {/* Bundle Size Analysis */}
          <div>
            <BundleAnalyzer />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>Built with RedwoodSDK, Three.js, and Cloudflare Workers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}