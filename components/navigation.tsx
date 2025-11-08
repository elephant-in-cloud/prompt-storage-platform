// Компонент навигационной панели приложения
// Отображает главное меню и меню пользователя

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { logout } from '@/lib/auth/actions'
import { User, LogOut, Settings, BookOpen, Library, LayoutDashboard } from 'lucide-react'

// Массив навигационных элементов
const navItems = [
  {
    label: 'Каталог',
    href: '/catalog',
    icon: Library,
  },
  {
    label: 'Мои промты',
    href: '/my-prompts',
    icon: BookOpen,
  },
]

export function Navigation() {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  
  // Проверка текущего активного пути
  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/')

  // Обработчик выхода
  const handleLogout = async () => {
    await logout()
  }

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Логотип */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="font-bold text-xl text-primary">
            📝 Хранилище промтов
          </div>
        </Link>

        {/* Навигационное меню (только для авторизованных пользователей) */}
        {user && !isLoading && (
          <>
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive(item.href) ? 'default' : 'ghost'}
                    className="flex items-center space-x-2"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              ))}
            </div>

            {/* Меню пользователя */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm font-semibold">
                  {user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Настройки</span>
                  </Link>
                </DropdownMenuItem>
                {/* Админ панель (только для админов) */}
                {/* TODO: Добавить проверку is_admin из профиля */}
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Админ панель</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Выйти</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        {/* Кнопки входа/регистрации для неавторизованных */}
        {!user && !isLoading && (
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <Button variant="ghost">Войти</Button>
            </Link>
            <Link href="/signup">
              <Button>Регистрация</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

