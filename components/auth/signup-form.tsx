"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupWithEmail, signInWithGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const createSession = async (user: import('firebase/auth').User) => {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error('Session creation failed');
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setLoading(false);
      return;
    }

    try {
      const result = await signupWithEmail(email, password);
      await createSession(result.user);
      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'アカウント作成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle();
      await createSession(result.user);
      router.push('/chat');
    } catch (err: any) {
      setError(err.message || 'Googleサインアップに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl font-bold text-alcheme-charcoal">
          alche:me
        </h1>
        <p className="text-sm text-alcheme-muted">
          あなたのコスメの可能性を、もっと
        </p>
      </div>

      <form onSubmit={handleEmailSignup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-alcheme-charcoal">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-alcheme-charcoal">パスワード</Label>
          <Input
            id="password"
            type="password"
            placeholder="6文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-input"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-alcheme-charcoal">パスワード（確認）</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="もう一度入力"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="rounded-input"
          />
        </div>
        {error && <p className="text-sm text-alcheme-danger">{error}</p>}
        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-button bg-alcheme-rose hover:bg-alcheme-rose/90 text-white"
        >
          {loading ? '作成中...' : 'アカウント作成'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-alcheme-sand" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-alcheme-cream px-3 text-alcheme-muted">または</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-button border-alcheme-sand"
        onClick={handleGoogleSignup}
        disabled={loading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Googleで登録
      </Button>

      <p className="text-center text-sm text-alcheme-muted">
        すでにアカウントをお持ちの方は{' '}
        <a href="/login" className="text-alcheme-rose hover:underline font-medium">
          ログイン
        </a>
      </p>
    </div>
  );
}
