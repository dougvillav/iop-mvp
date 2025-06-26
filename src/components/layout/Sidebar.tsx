import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Wallet, 
  Building2, 
  CreditCard, 
  ArrowUpDown, 
  AlertTriangle, 
  BarChart3, 
  Users,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'operator', 'readonly']
  },
  {
    title: 'Wallets',
    href: '/wallets',
    icon: Wallet,
    roles: ['admin', 'operator', 'readonly']
  },
  {
    title: 'Instancias',
    href: '/instances',
    icon: Building2,
    roles: ['admin', 'operator']
  },
  {
    title: 'Cardholders',
    href: '/cardholders',
    icon: CreditCard,
    roles: ['admin', 'operator']
  },
  {
    title: 'Transacciones',
    href: '/transactions',
    icon: ArrowUpDown,
    roles: ['admin', 'operator', 'readonly']
  },
  {
    title: 'Disputas',
    href: '/disputes',
    icon: AlertTriangle,
    roles: ['admin', 'operator']
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'operator', 'readonly']
  },
  {
    title: 'Usuarios',
    href: '/users',
    icon: Users,
    roles: ['admin']
  }
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    {
      name: 'Dashboard', 
      path: '/dashboard',
      icon: BarChart3
    },
    {
      name: 'Instancias',
      path: '/instances', 
      icon: Building2
    },
    {
      name: 'Wallets',
      path: '/wallets',
      icon: Wallet
    },
    {
      name: 'Payouts',
      path: '/payouts',
      icon: CreditCard
    }
  ];

  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const filteredNavItems = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">PayoutsPro</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name || profile?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.role}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="w-full"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};
