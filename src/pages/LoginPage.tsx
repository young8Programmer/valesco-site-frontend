import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, auth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Auth changed:', auth);
    if (auth && auth.token && !loading) {
      console.log('Auth is valid, navigating to dashboard...');
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [auth, navigate, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    const currentUsername = username;
    const currentPassword = password;
    
    if (!currentUsername || !currentPassword) {
      toast.error('Login va parolni kiriting');
      return;
    }
    
    setLoading(true);
    console.log('Form submitted with:', { username: currentUsername, password: '***' });

    try {
      await login({ username: currentUsername, password: currentPassword });
      console.log('Login function completed, waiting for auth state update...');
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if auth is set
      if (auth && auth.token) {
        toast.success('Muvaffaqiyatli kirildi!');
        setUsername('');
        setPassword('');
      } else {
        // If auth is not set after login, something went wrong
        throw new Error('Kirish muvaffaqiyatsiz');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      setLoading(false);
      
      // Show appropriate error message
      const errorMessage = error?.message || 'Login yoki parol noto\'g\'ri';
      if (errorMessage.includes('Vaqt tugadi') || errorMessage.includes('Tarmoq')) {
        toast.error(errorMessage);
      } else {
        toast.error('Login yoki parol noto\'g\'ri');
      }
      // Xato bo'lsa inputlarni tozalamaymiz, foydalanuvchi qayta urinishi uchun
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Login
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="Login kiriting"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="Parolni kiriting"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Kirilmoqda...
                </span>
              ) : (
                'Kirish'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

