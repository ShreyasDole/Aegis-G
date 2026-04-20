"use client";
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const PolicyAuthor = () => {
  const [intent, setIntent] = useState("");
  const [dslPreview, setDslPreview] = useState<string>("# Waiting for intent translation...");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isArming, setIsArming] = useState(false);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [armStatus, setArmStatus] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!intent.trim()) return;
    setIsTranslating(true);
    setArmStatus(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/policy-translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({ intent }),
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
    setIsArming(true);
    try {
      const token = localStorage.getItem('token');
      const policyData = {
        name: translationResult.rule_name || `Aegis_Rule_${Date.now()}`,
        description: translationResult.explanation || intent,
        policy_type: "logical",
        content: translationResult.dsl_logic,
        category: "dynamic_firewall",
        priority: 10,
      };
      const response = await fetch('/api/ai/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify(policyData),
      });
      if (response.ok) {
        setArmStatus("✅ GRID ARMED: Policy is now live across all nodes.");
        setTimeout(() => setArmStatus(null), 4000);
      } else {
        setArmStatus("❌ ERROR: Failed to inject policy into the grid.");
      }
    } catch (error) {
      console.error('Arming error:', error);
      setArmStatus("❌ ERROR: Network failure.");
    } finally {
      setIsArming(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Command Intent */}
      <Card className="p-6">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-primary mb-4">
          <span className="text-xl">🛡️</span> Command Intent
        </h3>
        <textarea
          className="w-full h-40 bg-bg-primary border border-border-subtle p-4 rounded font-sans text-sm focus:border-primary outline-none resize-none"
          placeholder='e.g. "Block all posts with an AI score above 85% that mention election interference..."'
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
        <Button
          variant="ai"
          className="w-full mt-4"
          onClick={handleTranslate}
          disabled={isTranslating || !intent.trim()}
        >
          {isTranslating ? "Compiling NL to DSL..." : "Generate Active Filter"}
        </Button>
      </Card>

      {/* Executable Shield DSL */}
      <Card className="p-6 bg-black border-red-900/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-red-500 mb-4">
          <span className="text-xl">🔒</span> Executable Shield DSL
        </h3>
        <div className="font-mono text-[12px] text-emerald-400 bg-bg-primary p-4 rounded border border-white/5 h-40 overflow-y-auto shadow-inner">
          <pre className="whitespace-pre-wrap">{dslPreview}</pre>
        </div>

        {translationResult && (
          <div className="mt-3 text-[11px] text-text-secondary flex justify-between">
            <div>
              <span className="text-primary font-bold">SAFETY SCORE:</span>{" "}
              {(translationResult.safety_score * 100).toFixed(1)}%
            </div>
            <div>
              <span className="text-warning font-bold">EDGE CASES:</span>{" "}
              {translationResult.edge_cases?.length || 0} mitigated
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4">
          <Button
            variant="danger"
            className="w-full font-bold tracking-widest shadow-glow-red"
            onClick={handleArmPolicy}
            disabled={!translationResult || isArming}
          >
            {isArming ? "INJECTING TO FIREWALL..." : "ARM THE POLICY"}
          </Button>

          {armStatus && (
            <div
              className={`text-xs font-mono font-bold text-center mt-1 ${
                armStatus.includes("✅") ? "text-success" : "text-danger"
              }`}
            >
              {armStatus}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
