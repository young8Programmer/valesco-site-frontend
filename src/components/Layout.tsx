import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  FolderTree, 
  LogOut, 
  Menu,
  X,
  Globe,
  User,
  ChevronDown,
  Tag
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const Layout = () => {
  const { auth, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved ? JSON.parse(saved) : true;
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'right' | 'left'>('right');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      
      // Check if dropdown fits on the right side
      if (dropdownRef.current && userMenuRef.current) {
        const rect = userMenuRef.current.getBoundingClientRect();
        const dropdownWidth = dropdownRef.current.offsetWidth;
        const spaceOnRight = window.innerWidth - rect.right;
        
        if (spaceOnRight < dropdownWidth) {
          setDropdownPosition('left');
        } else {
          setDropdownPosition('right');
        }
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    toast.success('Chiqildi');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/products', label: 'Mahsulotlar', icon: Package },
    ...(auth?.site === 'gpg' ? [{ path: '/brands', label: 'Brendlar', icon: Tag }] : []),
    { path: '/categories', label: 'Kategoriyalar', icon: FolderTree },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:bg-opacity-0 lg:pointer-events-none"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <Globe className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                {auth?.site === 'gpg' ? 'GPG' : auth?.site === 'valesco' ? 'Valesco' : 'Admin Panel'}
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    // Close sidebar on mobile only
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Foydalanuvchi:</p>
              <p className="font-medium text-gray-900 truncate" title={auth?.user?.username || auth?.user?.login || 'Admin'}>
                {auth?.user?.username || auth?.user?.login || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {auth?.user?.role === 'super_admin' || auth?.user?.role === 'superAdmin'
                  ? 'Super Admin'
                  : 'Admin'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        {/* Top bar */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4 relative">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {navItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="relative z-50" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden md:flex flex-col items-start max-w-[150px]">
                  <span className="text-sm font-medium text-gray-900 truncate w-full">
                    {auth?.user?.username || auth?.user?.login || 'Admin'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {auth?.user?.role === 'super_admin' || auth?.user?.role === 'superAdmin'
                      ? 'Super Admin'
                      : 'Admin'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {userMenuOpen && (
                <div 
                  ref={dropdownRef}
                  className={`absolute ${dropdownPosition === 'right' ? 'right-0' : 'left-0'} top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100]`}
                  style={{ maxWidth: 'calc(100vw - 2rem)' }}
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {auth?.user?.username || auth?.user?.login || 'Admin'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {auth?.user?.role === 'super_admin' || auth?.user?.role === 'superAdmin'
                        ? 'Super Admin'
                        : 'Admin'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Chiqish</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

