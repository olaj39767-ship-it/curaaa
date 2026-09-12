import React, { useState } from 'react';
import {
  Pill,
  UploadCloud,
  Video,
  HeartHandshake,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  PhoneCall,
  MessageSquareHeart,
  LayoutDashboard,
  LogOut,
  LogIn,
} from 'lucide-react';
import { User, CartItem } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  cartItems: CartItem[];
  setIsCartOpen: (open: boolean) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  pendingRequestsCount: number;
}

const roleLabel: Record<string, string> = {
  admin: 'Administrator',
  pharmacist: 'Pharmacist',
  patient: 'Patient',
};

// Always visible in the top bar — the three things people do most.
const PRIMARY_LINKS = [
  { id: 'chat', label: 'Concierge', icon: MessageSquareHeart },
  { id: 'market', label: 'Market', icon: Pill },
  { id: 'upload-quote', label: 'Upload prescription', icon: UploadCloud },
] as const;

// Grouped under "Services" — used less often, don't need to sit in the main row.
const SERVICE_LINKS = [
  { id: 'consultations', label: 'Consult a doctor', detail: 'Video call, from ₦2,500', icon: Video },
  { id: 'care-nurses', label: 'Hire a nurse', detail: 'Home visits, from ₦12,000', icon: HeartHandshake },
  { id: 'orders', label: 'Track orders', detail: 'See status and quotes', icon: Truck },
] as const;

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartItems,
  setIsCartOpen,
  currentUser,
  onLogout,
  onOpenAuth,
  pendingRequestsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isStaffOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'pharmacist';
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const activeServiceLink = SERVICE_LINKS.find((l) => l.id === activeTab);

  const closeAllMenus = () => {
    setMobileMenuOpen(false);
    setServicesOpen(false);
    setProfileOpen(false);
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    closeAllMenus();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FBF9F4] border-b border-[#E4DFD3]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Wordmark */}
            <button
              onClick={() => handleNavClick('chat')}
              className="flex items-center gap-2.5 shrink-0 focus:outline-none cursor-pointer"
              aria-label="Curadeck"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0B5D52] flex items-center justify-center text-white">
                <Pill className="w-4 h-4 -rotate-45" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-[#16231F]">
                Cura<span className="text-[#0B5D52]">deck</span>
              </span>
            </button>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {PRIMARY_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isActive ? 'bg-[#EAF3F0] text-[#0B5D52]' : 'text-[#6B6157] hover:text-[#16231F]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </button>
                );
              })}

              {/* Services dropdown groups the less-frequent links */}
              <div className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeServiceLink ? 'bg-[#EAF3F0] text-[#0B5D52]' : 'text-[#6B6157] hover:text-[#16231F]'
                  }`}
                >
                  <span>{activeServiceLink ? activeServiceLink.label : 'Services'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {servicesOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setServicesOpen(false)} />
                    <div className="absolute left-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-[#E4DFD3] py-1.5 z-50">
                      {SERVICE_LINKS.map((link) => {
                        const Icon = link.icon;
                        const isActive = activeTab === link.id;
                        return (
                          <button
                            key={link.id}
                            onClick={() => handleNavClick(link.id)}
                            className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 cursor-pointer transition-colors ${
                              isActive ? 'bg-[#EAF3F0]' : 'hover:bg-[#F0ECE2]'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#0B5D52]' : 'text-[#6B6157]'}`} />
                            <span>
                              <span className={`block text-xs font-semibold ${isActive ? 'text-[#0B5D52]' : 'text-[#16231F]'}`}>
                                {link.label}
                              </span>
                              <span className="block text-[10px] text-[#8A8175]">{link.detail}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 rounded-lg hover:bg-[#F0ECE2] transition-colors cursor-pointer"
                aria-label={`Cart, ${totalCartCount} items`}
              >
                <ShoppingBag className="w-4.5 h-4.5 text-[#16231F]" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#C23B3B] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalCartCount}
                  </span>
                )}
              </button>

              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="relative flex items-center gap-1 p-1 rounded-lg hover:bg-[#F0ECE2] transition-colors cursor-pointer"
                    aria-label="Account menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#EAF3F0] text-[#0B5D52] font-bold flex items-center justify-center text-xs">
                      {currentUser.name ? currentUser.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    {isStaffOrAdmin && pendingRequestsCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#B8862E] text-white text-[9px] flex items-center justify-center font-bold">
                        {pendingRequestsCount}
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-[#6B6157] hidden sm:block" />
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-[#E4DFD3] py-2 z-50">
                        <div className="px-4 py-3 border-b border-[#EEEAE0]">
                          <p className="font-display text-sm font-bold text-[#16231F] truncate">{currentUser.name}</p>
                          <p className="text-xs text-[#6B6157] truncate">{currentUser.email}</p>
                          <p className="mt-1 text-[11px] font-semibold text-[#0B5D52]">
                            {roleLabel[currentUser.role] ?? currentUser.role}
                          </p>
                        </div>

                        <div className="p-1.5 space-y-0.5">
                          {isStaffOrAdmin && (
                            <button
                              onClick={() => handleNavClick('admin-hub')}
                              className="w-full text-left px-3 py-2 text-xs rounded-lg text-[#16231F] hover:bg-[#F0ECE2] font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <LayoutDashboard className="w-4 h-4 text-[#0B5D52]" />
                              Operations Hub
                              {pendingRequestsCount > 0 && (
                                <span className="ml-auto w-4 h-4 rounded-full bg-[#B8862E] text-white text-[9px] flex items-center justify-center font-bold">
                                  {pendingRequestsCount}
                                </span>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleNavClick('orders')}
                            className="w-full text-left px-3 py-2 text-xs rounded-lg text-[#16231F] hover:bg-[#F0ECE2] font-semibold flex items-center gap-2 cursor-pointer"
                          >
                            <Truck className="w-4 h-4 text-[#6B6157]" />
                            My orders &amp; quotes
                          </button>
                        </div>

                        <div className="border-t border-[#EEEAE0] pt-1.5 pb-2 px-1.5 space-y-1.5">
                          <button
                            onClick={() => {
                              setProfileOpen(false);
                              onLogout();
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-[#C23B3B] hover:bg-[#FBEEEE] rounded-lg cursor-pointer flex items-center gap-2 font-semibold"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign out
                          </button>
                          <div className="flex items-center justify-between px-3 pt-1 text-[10px] text-[#8A8175]">
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" /> PCN #LA/8892
                            </span>
                            <a href="tel:+2348002872332" className="flex items-center gap-1 hover:text-[#0B5D52]">
                              <PhoneCall className="w-3 h-3" /> 0800-CURADECK
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#16231F] hover:bg-[#0B5D52] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign in</span>
                </button>
              )}

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-[#16231F] hover:bg-[#F0ECE2] cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu — everything flat, since there's no room for a nested dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E4DFD3] bg-white px-4 pt-3 pb-5 space-y-1">
            {[...PRIMARY_LINKS, ...SERVICE_LINKS].map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    isActive ? 'bg-[#EAF3F0] text-[#0B5D52]' : 'text-[#16231F] hover:bg-[#F0ECE2]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {isStaffOrAdmin && (
              <button
                onClick={() => handleNavClick('admin-hub')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold bg-[#16231F] text-white cursor-pointer mt-2"
              >
                <span className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4" />
                  Operations Hub
                </span>
                {pendingRequestsCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] rounded bg-[#B8862E] font-bold">
                    {pendingRequestsCount} new
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#EEEAE0] text-[10px] text-[#8A8175]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> PCN Licensed #LA/8893
              </span>
              <a href="tel:+2348002872332" className="flex items-center gap-1">
                <PhoneCall className="w-3 h-3" /> 0800-CURADECK
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E4DFD3] px-2 py-1 flex items-center justify-around"
      >
        {[
          { id: 'chat', label: 'Concierge', icon: MessageSquareHeart },
          { id: 'market', label: 'Market', icon: Pill },
          { id: 'upload-quote', label: 'Upload', icon: UploadCloud },
          isStaffOrAdmin
            ? { id: 'admin-hub', label: 'Operations', icon: LayoutDashboard }
            : { id: 'orders', label: 'Orders', icon: Truck },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 min-h-[48px] rounded-lg cursor-pointer"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#0B5D52]' : 'text-[#8A8175]'}`} />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-[#0B5D52]' : 'font-medium text-[#8A8175]'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};