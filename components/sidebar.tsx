'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Package, 
  LayoutDashboard,
  ChefHat,
  Store
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Items & Inventory',
    href: '/inventory',
    icon: Package,
  },
  {
    name: 'Vendors',
    href: '/vendors',
    icon: Store,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r border-gray-200">
      {/* Logo/Header */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">FMB Kitchen</h1>
            <p className="text-xs text-gray-500">Menu & Inventory</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Weekly Menu & Inventory
          <br />
          Ultra-Simple MVP v0.2
        </div>
      </div>
    </div>
  );
}
