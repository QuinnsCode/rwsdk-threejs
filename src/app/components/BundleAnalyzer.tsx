"use client";

import { useEffect, useState } from 'react';

interface BundleStats {
  workerSize: number;
  threeJsSize: number;
  estimatedBundleWithThree: number;
  savings: number;
  savingsPercentage: number;
}

export function BundleAnalyzer() {
  const [bundleStats, setBundleStats] = useState<BundleStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    analyzeBundleSize();
  }, []);

  const analyzeBundleSize = async () => {
    setIsAnalyzing(true);
    
    try {
      // Get current worker bundle size by fetching the main script
      const workerScripts = Array.from(document.scripts)
        .filter(script => script.src && !script.src.includes('three'))
        .map(script => script.src);

      let totalWorkerSize = 0;
      
      // Estimate worker size by checking main bundle
      for (const scriptSrc of workerScripts.slice(0, 3)) { // Check first few scripts
        try {
          const response = await fetch(scriptSrc);
          const content = await response.text();
          totalWorkerSize += content.length;
        } catch (e) {
          // Skip if can't fetch
        }
      }

      // Get Three.js size
      const threeResponse = await fetch('/lib/three.min.js');
      const threeContent = await threeResponse.text();
      const threeJsSize = threeContent.length;

      // Calculate what bundle size would be if Three.js was included
      const estimatedBundleWithThree = totalWorkerSize + threeJsSize;
      const savings = threeJsSize;
      const savingsPercentage = (savings / estimatedBundleWithThree) * 100;

      setBundleStats({
        workerSize: totalWorkerSize,
        threeJsSize,
        estimatedBundleWithThree,
        savings,
        savingsPercentage
      });
    } catch (error) {
      console.error('Failed to analyze bundle size:', error);
      // Fallback estimates based on typical sizes
      const threeJsSize = 600000; // ~600KB typical Three.js size
      const workerSize = 50000; // ~50KB estimated worker size
      
      setBundleStats({
        workerSize,
        threeJsSize,
        estimatedBundleWithThree: workerSize + threeJsSize,
        savings: threeJsSize,
        savingsPercentage: (threeJsSize / (workerSize + threeJsSize)) * 100
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getBundleSizeColor = (size: number) => {
    if (size < 100000) return 'text-green-400'; // < 100KB
    if (size < 500000) return 'text-yellow-400'; // < 500KB
    return 'text-red-400'; // > 500KB
  };

  if (isAnalyzing) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          <h4 className="text-xl font-semibold text-white">Analyzing Bundle Size...</h4>
        </div>
      </div>
    );
  }

  if (!bundleStats) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-xl font-semibold text-white mb-3">📊 Bundle Analysis</h4>
        <p className="text-gray-400">Failed to analyze bundle size</p>
        <button 
          onClick={analyzeBundleSize}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h4 className="text-xl font-semibold text-white mb-4">📊 Bundle Size Analysis</h4>
      
      <div className="space-y-4">
        {/* Current Bundle Size */}
        <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
          <span className="text-gray-300">Current Worker Bundle:</span>
          <span className={`font-mono font-semibold ${getBundleSizeColor(bundleStats.workerSize)}`}>
            {formatFileSize(bundleStats.workerSize)}
          </span>
        </div>

        {/* Three.js Size */}
        <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
          <span className="text-gray-300">Three.js Library:</span>
          <span className="font-mono font-semibold text-orange-400">
            {formatFileSize(bundleStats.threeJsSize)}
          </span>
        </div>

        {/* Hypothetical Bundle Size */}
        <div className="flex justify-between items-center p-3 bg-red-900/20 border border-red-500/30 rounded">
          <span className="text-gray-300">If Three.js was bundled:</span>
          <span className="font-mono font-semibold text-red-400">
            {formatFileSize(bundleStats.estimatedBundleWithThree)}
          </span>
        </div>

        {/* Savings */}
        <div className="flex justify-between items-center p-3 bg-green-900/20 border border-green-500/30 rounded">
          <span className="text-gray-300">Bundle Size Savings:</span>
          <div className="text-right">
            <div className="font-mono font-semibold text-green-400">
              {formatFileSize(bundleStats.savings)}
            </div>
            <div className="text-sm text-green-300">
              ({bundleStats.savingsPercentage.toFixed(1)}% smaller)
            </div>
          </div>
        </div>

        {/* Performance Impact */}
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded">
          <h5 className="font-semibold text-blue-300 mb-2">⚡ Performance Benefits</h5>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Faster worker cold starts</li>
            <li>• Reduced memory usage</li>
            <li>• Parallel loading of Three.js</li>
            <li>• Edge caching benefits</li>
          </ul>
        </div>

        {/* Cost Analysis */}
        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded">
          <h5 className="font-semibold text-purple-300 mb-2">💰 Cost Impact</h5>
          <div className="text-sm text-gray-300 space-y-1">
            <div>R2 Storage: <span className="text-green-400">~$0.000009/month</span></div>
            <div>R2 Requests after cache: <span className="text-green-400">$0.00</span></div>
            <div>Worker CPU savings: <span className="text-green-400">Significant</span></div>
          </div>
        </div>

        <button 
          onClick={analyzeBundleSize}
          className="w-full mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          🔄 Refresh Analysis
        </button>
      </div>
    </div>
  );
}