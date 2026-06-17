import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function DebugAuth() {
  const [email, setEmail] = useState('devansh@gmail.com');
  const [password, setPassword] = useState('devansh@2006');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      // Call Supabase auth directly and show full response
      const res = await supabase.auth.signInWithPassword({ email, password });
      setResult({ ok: true, res });
    } catch (err) {
      setResult({ ok: false, err: { message: err.message, stack: err.stack } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Dev Debug — Auth Test</h2>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />
        </div>

        <div>
          <label className="text-xs font-semibold">Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-2 py-1 mt-1" />
        </div>

        <div>
          <button onClick={runTest} disabled={loading} className="bg-brand-green text-white px-4 py-2 rounded">
            {loading ? 'Running...' : 'Run Sign-In Test'}
          </button>
        </div>

        <div className="mt-4">
          <label className="text-xs font-semibold">Result (JSON)</label>
          <pre className="mt-2 bg-gray-100 p-3 rounded text-xs max-h-72 overflow-auto">{result ? JSON.stringify(result, null, 2) : 'No result yet'}</pre>
        </div>
      </div>
    </div>
  );
}
