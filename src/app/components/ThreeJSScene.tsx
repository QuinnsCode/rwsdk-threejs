"use client";

import { useEffect, useRef, useState } from 'react';

// Declare THREE as a global to avoid TypeScript errors
declare global {
  interface Window {
    THREE: any;
  }
}

interface CacheStats {
  source: 'localStorage' | 'browser-cache' | 'network' | 'memory';
  loadTime: number;
  fileSize?: number;
  timestamp: number;
}

export function ThreeJSScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const frameRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadThreeJS = async () => {
      const startTime = performance.now();
      
      try {
        // Check if Three.js is already loaded in memory
        if (window.THREE) {
          const loadTime = performance.now() - startTime;
          setCacheStats({
            source: 'memory',
            loadTime,
            timestamp: Date.now()
          });
          
          if (isMounted) {
            initScene();
          }
          return;
        }

        // Check localStorage for cached Three.js
        const cachedThreeJS = localStorage.getItem('threejs-r134');
        const cacheTimestamp = localStorage.getItem('threejs-r134-timestamp');
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        
        if (cachedThreeJS && cacheTimestamp && 
            (Date.now() - parseInt(cacheTimestamp)) < oneWeek) {
          // Use localStorage cached version
          try {
            const script = document.createElement('script');
            script.textContent = cachedThreeJS;
            document.head.appendChild(script);
            
            if (window.THREE && isMounted) {
              const loadTime = performance.now() - startTime;
              setCacheStats({
                source: 'localStorage',
                loadTime,
                fileSize: cachedThreeJS.length,
                timestamp: Date.now()
              });
              
              initScene();
              return;
            }
          } catch (e) {
            localStorage.removeItem('threejs-r134');
            localStorage.removeItem('threejs-r134-timestamp');
          }
        }

        // Load from network/browser cache
        const script = document.createElement('script');
        script.src = '/lib/three.min.js?v=r134';
        
        // Track if it comes from browser cache vs network
        const fetchStartTime = performance.now();
        
        script.onload = async () => {
          if (isMounted && window.THREE) {
            const loadTime = performance.now() - startTime;
            const fetchTime = performance.now() - fetchStartTime;
            
            try {
              // Check if it was cached by examining performance API
              const perfEntries = performance.getEntriesByName(script.src);
              const isFromCache = perfEntries.length > 0 && 
                (perfEntries[0] as PerformanceResourceTiming).transferSize === 0;
              
              // Fetch the content to cache it and get size
              const response = await fetch('/lib/three.min.js', {
                cache: 'force-cache'
              });
              const scriptContent = await response.text();
              const fileSize = scriptContent.length;
              
              // Cache in localStorage for next time
              localStorage.setItem('threejs-r134', scriptContent);
              localStorage.setItem('threejs-r134-timestamp', Date.now().toString());
              
              setCacheStats({
                source: isFromCache ? 'browser-cache' : 'network',
                loadTime,
                fileSize,
                timestamp: Date.now()
              });
              
            } catch (e) {
              console.warn('Failed to analyze cache performance:', e);
              setCacheStats({
                source: 'network',
                loadTime,
                timestamp: Date.now()
              });
            }
            
            initScene();
          } else {
            setError('Three.js loaded but not available');
          }
        };

        script.onerror = () => {
          if (isMounted) {
            setError('Failed to load Three.js library');
          }
        };

        document.head.appendChild(script);

        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } catch (err) {
        if (isMounted) {
          setError('Error loading Three.js: ' + (err as Error).message);
        }
      }
    };

    const initScene = () => {
      if (!mountRef.current || !window.THREE) return;

      const THREE = window.THREE;
      
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.z = 5;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      
      mountRef.current.appendChild(renderer.domElement);

      // Create a rotating cube with gradient material
      const geometry = new THREE.BoxGeometry(2, 2, 2);
      
      // Create multiple materials for each face
      const materials = [
        new THREE.MeshLambertMaterial({ color: 0xff6b6b }), // Red
        new THREE.MeshLambertMaterial({ color: 0x4ecdc4 }), // Teal
        new THREE.MeshLambertMaterial({ color: 0x45b7d1 }), // Blue
        new THREE.MeshLambertMaterial({ color: 0xf9ca24 }), // Yellow
        new THREE.MeshLambertMaterial({ color: 0x6c5ce7 }), // Purple
        new THREE.MeshLambertMaterial({ color: 0xa55eea }), // Pink
      ];

      const cube = new THREE.Mesh(geometry, materials);
      cube.position.set(0, 0, 0);
      cube.castShadow = true;
      scene.add(cube);

      // Add some smaller floating cubes
      for (let i = 0; i < 8; i++) {
        const smallGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const smallMaterial = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(i / 8, 0.8, 0.6)
        });
        const smallCube = new THREE.Mesh(smallGeometry, smallMaterial);
        
        // Position in a circle around the main cube
        const angle = (i / 8) * Math.PI * 2;
        smallCube.position.x = Math.cos(angle) * 4;
        smallCube.position.y = Math.sin(angle) * 2;
        smallCube.position.z = Math.sin(angle) * 3;
        
        scene.add(smallCube);
      }

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      const pointLight = new THREE.PointLight(0x00ff88, 0.5, 50);
      pointLight.position.set(-5, 5, 5);
      scene.add(pointLight);

      // Store references
      sceneRef.current = { scene, camera, renderer, cube };
      rendererRef.current = renderer;

      // Mouse controls
      let mouseX = 0;
      let mouseY = 0;
      let isMouseDown = false;

      const handleMouseMove = (event: MouseEvent) => {
        if (!isMouseDown) return;
        
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        cube.rotation.y += deltaX * 0.01;
        cube.rotation.x += deltaY * 0.01;
        
        mouseX = event.clientX;
        mouseY = event.clientY;
      };

      const handleMouseDown = (event: MouseEvent) => {
        isMouseDown = true;
        mouseX = event.clientX;
        mouseY = event.clientY;
      };

      const handleMouseUp = () => {
        isMouseDown = false;
      };

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        camera.position.z += event.deltaY * 0.01;
        camera.position.z = Math.max(2, Math.min(20, camera.position.z));
      };

      // Add event listeners
      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      renderer.domElement.addEventListener('mousedown', handleMouseDown);
      renderer.domElement.addEventListener('mouseup', handleMouseUp);
      renderer.domElement.addEventListener('wheel', handleWheel);

      // Handle window resize
      const handleResize = () => {
        if (!mountRef.current) return;
        
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      // Animation loop
      const animate = () => {
        if (!isMounted) return;
        
        frameRef.current = requestAnimationFrame(animate);

        // Rotate the main cube slowly
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.01;

        // Animate the small cubes
        scene.children.forEach((child: any, index: number) => {
          if (child.geometry?.type === 'BoxGeometry' && child !== cube) {
            const time = Date.now() * 0.001;
            child.rotation.x = time + index;
            child.rotation.y = time * 0.5 + index;
            
            // Floating motion
            child.position.y += Math.sin(time * 2 + index) * 0.01;
          }
        });

        renderer.render(scene, camera);
      };

      setIsLoading(false);
      animate();

      // Cleanup function
      return () => {
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('mouseup', handleMouseUp);
        renderer.domElement.removeEventListener('wheel', handleWheel);
        window.removeEventListener('resize', handleResize);
      };
    };

    loadThreeJS();

    return () => {
      isMounted = false;
      
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      
      if (rendererRef.current && mountRef.current?.contains(rendererRef.current.domElement)) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get cache status indicator
  const getCacheIndicator = () => {
    if (!cacheStats) return null;
    
    const indicators = {
      'memory': { color: 'bg-purple-500', text: '🧠 Memory' },
      'localStorage': { color: 'bg-green-500', text: '💾 Local Storage' },
      'browser-cache': { color: 'bg-blue-500', text: '🌐 Browser Cache' },
      'network': { color: 'bg-orange-500', text: '📡 Network' }
    };
    
    const indicator = indicators[cacheStats.source];
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded text-xs text-white ${indicator.color}`}>
        {indicator.text}
      </div>
    );
  };

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-900 text-red-400">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <div className="text-xl font-semibold mb-2">Failed to Load Three.js</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
            <div className="text-lg">Loading Three.js Scene...</div>
            <div className="text-sm text-gray-400 mt-2">Fetching library from R2...</div>
          </div>
        </div>
      )}
      
      <div 
        ref={mountRef} 
        className="w-full h-96 bg-gray-900 rounded-lg"
        style={{ minHeight: '400px' }}
      />
      
      {!isLoading && (
        <div className="absolute bottom-4 left-4 space-y-2">
          <div className="text-white bg-black bg-opacity-75 px-3 py-1 rounded text-sm">
            Three.js r134 • Click & drag to rotate • Scroll to zoom
          </div>
          
          {cacheStats && (
            <div className="bg-black bg-opacity-75 px-3 py-2 rounded text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-300">Source:</span>
                {getCacheIndicator()}
              </div>
              <div className="text-gray-300">
                Load time: <span className="text-white">{cacheStats.loadTime.toFixed(1)}ms</span>
              </div>
              {cacheStats.fileSize && (
                <div className="text-gray-300">
                  Size: <span className="text-white">{formatFileSize(cacheStats.fileSize)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}