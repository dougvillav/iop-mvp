
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Building2,
  ArrowLeftRight,
  Wallet,
  Shield,
  LogOut,
  Calculator,
  UserCog,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Instancias', href: '/instances', icon: Building2 },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'Transacciones', href: '/transactions', icon: CreditCard },
  { name: 'Cardholders', href: '/cardholders', icon: Users },
  { name: 'Anti-Fraude', href: '/fraud', icon: Shield },
  { name: 'Payouts', href: '/payouts', icon: ArrowLeftRight },
  { name: 'Conciliación', href: '/reconciliation', icon: Calculator },
  { name: 'Usuarios', href: '/users', icon: UserCog },
];

export const Sidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <h1 className="text-xl font-bold text-gray-900">InOutPayments</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-blue-50 border-r-2 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="flex-shrink-0 border-t border-gray-200 p-4">
        <button 
          onClick={handleSignOut}
          className="group flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};
