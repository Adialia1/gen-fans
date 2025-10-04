'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompatibilityTest() {
  // Test basic hooks
  const [count, setCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState<{ id: number; name: string }[]>([]);
  
  // Test useRef
  const containerRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);
  
  // Test useCallback
  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
    countRef.current += 1;
  }, []);
  
  const handleToggleModal = useCallback(() => {
    setShowModal(prev => !prev);
  }, []);
  
  // Test useMemo
  const doubledCount = useMemo(() => count * 2, [count]);
  
  // Test useEffect with cleanup
  useEffect(() => {
    console.log('Component mounted');
    
    const timer = setTimeout(() => {
      setData([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ]);
    }, 1000);
    
    return () => {
      console.log('Component unmounted');
      clearTimeout(timer);
    };
  }, []);
  
  // Test useEffect with dependencies
  useEffect(() => {
    console.log(`Count changed to: ${count}`);
    
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = count % 2 === 0 ? '#f0f0f0' : '#e0e0e0';
    }
  }, [count]);
  
  // Test async state updates
  const handleAsyncOperation = useCallback(async () => {
    setData(prev => [...prev, { id: Date.now(), name: `New Item ${prev.length + 1}` }]);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCount(prev => prev + 1);
  }, []);
  
  // Test conditional rendering with fragments
  const renderContent = useCallback(() => {
    return (
      <>
        {data.length > 0 ? (
          <ul className="space-y-2">
            {data.map(item => (
              <li key={item.id} className="p-2 bg-white rounded">
                {item.name}
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading data...</p>
        )}
      </>
    );
  }, [data]);
  
  return (
    <div ref={containerRef} className="p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">React 19 Compatibility Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Hook Tests</h2>
          <p>Count: {count}</p>
          <p>Doubled Count (useMemo): {doubledCount}</p>
          <p>Ref Count: {countRef.current}</p>
          
          <div className="flex gap-2 mt-2">
            <button 
              onClick={handleIncrement}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Increment
            </button>
            
            <button 
              onClick={handleToggleModal}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Toggle Modal
            </button>
            
            <button 
              onClick={handleAsyncOperation}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Async Operation
            </button>
          </div>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Data Rendering</h2>
          {renderContent()}
        </div>
        
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={handleToggleModal}
            >
              <motion.div
                className="bg-white p-6 rounded-lg shadow-lg"
                onClick={(e) => e.stopPropagation()}
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                exit={{ y: -50 }}
              >
                <h3 className="text-xl font-bold mb-2">Modal Test</h3>
                <p>This tests AnimatePresence and Framer Motion compatibility</p>
                <button 
                  onClick={handleToggleModal}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Close
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}