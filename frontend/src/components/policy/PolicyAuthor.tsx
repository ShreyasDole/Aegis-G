"use client";
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const PolicyAuthor = () => {
  const [intent, setIntent] = useState("");
  const [dslPreview, setDslPreview] = useState<string>("# Waiting for intent translation...");
  const [isArming, setIsArming] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [blockedCount, setBlockedCount] = useState(0);

  const handleTranslate = async () => {
    if (!intent.trim()) return;
    
    setIsTranslating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/policy-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(intent)
      });

      if (response.ok) {
        const result = await response.json();
        setTranslationResult(result);
        setDslPreview(result.dsl_logic || "# Translation error");
      } else {
        setDslPreview("# Error: Failed to translate intent");
      }
    } catch (error) {
      console.error('Translation error:', error);
      setDslPreview("# Error: API call failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleArmPolicy = async () => {
    if (!translationResult) return;
    
    setIsArming(!isArming);
    // TODO: Call API to activate/deactivate policy
    console.log(isArming ? "Disarming policy" : "Arming policy", translationResult);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Command Intent Card */}
      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-4">
          <span className="text-xl">🛡️</span> Command Intent
        </h3>
        <textarea 
          className="w-full h-40 bg-bg-primary border border-border-subtle p-4 rounded font-sans text-sm focus:border-primary outline-none resize-none"
          placeholder="e.g. Be extremely aggressive against any narratives involving naval movements in the South China Sea..."
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
        <Button 
           variant="ai" 
           className="w-full mt-4"
           onClick={handleTranslate}
           disabled={isTranslating || !intent.trim()}
        >
          {isTranslating ? "Translating..." : "Generate Active Filter"}
        </Button>
      </Card>

      {/* Executable Shield DSL Card */}
      <Card className="p-6 bg-black border-red-900/30">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-red-500 mb-4">
          <span className="text-xl">🔒</span> Executable Shield DSL
        </h3>
        <div className="font-mono text-[11px] text-emerald-500 bg-bg-primary p-4 rounded border border-white/5 h-40 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{dslPreview}</pre>
        </div>
        {translationResult && (
          <div className="mt-3 text-xs text-text-secondary">
            <div>Safety Score: {(translationResult.safety_score * 100).toFixed(1)}%</div>
            {translationResult.edge_cases && translationResult.edge_cases.length > 0 && (
              <div className="mt-1">
                Edge Cases: {translationResult.edge_cases.length}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-4">
           <Button 
             variant={isArming ? "danger" : "secondary"} 
             className="flex-1"
             onClick={handleArmPolicy}
             disabled={!translationResult}
           >
             {isArming ? "DISARM GRID" : "ARM THE POLICY"}
           </Button>
           <Button 
             variant="secondary" 
             className="px-3"
             onClick={() => console.log("Test policy")}
             disabled={!translationResult}
           >
             ▶
           </Button>
        </div>
      </Card>
    </div>
  );
};

