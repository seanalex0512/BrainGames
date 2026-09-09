import { useState, type ReactNode } from 'react';
import { useAuthStore } from '../../stores/auth-store';

interface AdminGateProps {
  readonly children: ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const login = useAuthStore((s) => s.login);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (isAdmin) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(password);
    if (!success) {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <h1 className="text-white font-black text-3xl mb-2">Admin Access</h1>
      <p className="text-white/60 mb-8">Enter the password to manage quizzes</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 focus:border-white/50 focus:outline-none text-center text-lg"
          autoFocus
        />
        {error && (
          <p className="text-red-400 text-sm">Wrong password. Try again.</p>
        )}
        <button
          type="submit"
          className="px-6 py-3 bg-brain-purple text-white font-black rounded-xl text-lg hover:bg-brain-purple/80 transition-colors"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
