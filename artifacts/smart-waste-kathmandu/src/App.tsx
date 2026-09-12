import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDetectWaste, type WasteDetectionResponse } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ClipboardList,
  Clock3,
  Coins,
  Home,
  Leaf,
  ListFilter,
  MapPin,
  Menu,
  Package,
  PencilLine,
  Plus,
  QrCode,
  Recycle,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  Upload,
  Weight,
  X,
} from 'lucide-react';

const queryClient = new QueryClient();

type Role = 'household' | 'collector';
type Page = 'home' | 'schedule' | 'marketplace' | 'requests' | 'scanner';
type PickupStatus = 'Pending' | 'Accepted' | 'Completed';

type Request = {
  id: number;
  item: string;
  type: string;
  weight: string;
  date: string;
  status: PickupStatus;
  payout: string;
};

type CollectorPickup = Request & { neighborhood: string };

const initialRequests: Request[] = [
  { id: 1, item: 'Clean PET bottles', type: 'Recyclable', weight: '3.5 kg', date: 'Today · 4:30 PM', status: 'Accepted', payout: 'NPR 120' },
  { id: 2, item: 'Cardboard & paper', type: 'Recyclable', weight: '2 kg', date: 'Tomorrow · 8:00 AM', status: 'Pending', payout: 'NPR 65' },
  { id: 3, item: 'Kitchen compost', type: 'Organic', weight: '4 kg', date: 'Wed · 7:30 AM', status: 'Completed', payout: 'NPR 0' },
];

const initialCollectorPickups: CollectorPickup[] = [
  { id: 11, item: 'PET bottles & cans', type: 'Recyclable', weight: '4.5 kg', neighborhood: 'Bafal, Ward 13', date: 'Ready now', status: 'Pending', payout: 'NPR 160' },
  { id: 12, item: 'Mixed cardboard', type: 'Recyclable', weight: '7 kg', neighborhood: 'Jawalakhel, Ward 4', date: 'Ready now', status: 'Pending', payout: 'NPR 245' },
  { id: 13, item: 'Glass bottles', type: 'Recyclable', weight: '3 kg', neighborhood: 'Kapan, Ward 11', date: 'Ready in 35 min', status: 'Pending', payout: 'NPR 105' },
  { id: 14, item: 'Sorted metal pieces', type: 'Recyclable', weight: '2.5 kg', neighborhood: 'Dillibazar, Ward 30', date: 'Ready in 1 hr', status: 'Pending', payout: 'NPR 90' },
];

const navItems: Array<{ id: Page; label: string; icon: typeof Home }> = [
  { id: 'home', label: 'Overview', icon: Home },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
  { id: 'requests', label: 'My pickups', icon: ClipboardList },
  { id: 'scanner', label: 'AI Scanner', icon: ScanLine },
];

function App() {
  const [role, setRole] = useState<Role>('household');
  const [page, setPage] = useState<Page>('home');
  const [requests, setRequests] = useState<Request[]>(initialRequests);
  const [collectorPickups, setCollectorPickups] = useState<CollectorPickup[]>(initialCollectorPickups);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const notify = (message: string) => setToast(message);
  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    setPage('home');
    setMobileMenuOpen(false);
    notify(nextRole === 'collector' ? 'Collector view is ready nearby.' : 'Welcome back to your household view.');
  };
  const handleNav = (nextPage: Page) => {
    setPage(nextPage);
    setMobileMenuOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary resetKey={page}>
          <div className="grain app-shell min-h-[100dvh] text-foreground">
            <DesktopSidebar page={page} role={role} onNavigate={handleNav} onRoleChange={handleRoleChange} />
            <div className="min-h-[100dvh] lg:pl-[252px]">
              <TopBar role={role} onRoleChange={handleRoleChange} onMenu={() => setMobileMenuOpen((open) => !open)} />
              {mobileMenuOpen && (
                <div className="absolute inset-x-0 top-[73px] z-40 border-b border-border bg-card p-4 shadow-lg lg:hidden">
                  <div className="grid gap-1">
                    {navItems.map((item) => (
                      <button key={item.id} data-testid={`mobile-nav-${item.id}`} onClick={() => handleNav(item.id)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold ${page === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                        <item.icon size={18} /> {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <main className="mx-auto max-w-[1450px] px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
                {page === 'home' && role === 'household' && <HouseholdHome requests={requests} onNavigate={handleNav} onNotify={notify} />}
                {page === 'home' && role === 'collector' && <CollectorHome pickups={collectorPickups} onAccept={(id) => {
                  setCollectorPickups((items) => items.map((item) => item.id === id ? { ...item, status: 'Accepted' } : item));
                  notify('Pickup accepted. The household has been notified.');
                }} onNavigate={handleNav} />}
                {page === 'schedule' && <SchedulePage onNotify={notify} />}
                {page === 'marketplace' && <MarketplacePage onNotify={notify} />}
                {page === 'requests' && <RequestsPage requests={requests} onUpdate={(id, status) => setRequests((items) => items.map((item) => item.id === id ? { ...item, status } : item))} onNotify={notify} />}
                {page === 'scanner' && <ScannerPage onNotify={notify} />}
              </main>
            </div>
            <MobileNav page={page} onNavigate={handleNav} />
            {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
          </div>
        </ErrorBoundary>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function DesktopSidebar({ page, role, onNavigate, onRoleChange }: { page: Page; role: Role; onNavigate: (page: Page) => void; onRoleChange: (role: Role) => void }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col bg-sidebar px-4 py-5 text-sidebar-foreground lg:flex">
      <div className="mb-9 flex items-center gap-3 px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-secondary text-primary"><Recycle size={22} strokeWidth={2.4} /></div>
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-secondary">SWK / 24</p><p className="font-semibold leading-tight">Smart Waste<br />Kathmandu</p></div>
      </div>
      <div className="mb-5 rounded-2xl border border-sidebar-border bg-sidebar-accent p-1.5">
        <div className="grid grid-cols-2 gap-1">
          <RoleButton active={role === 'household'} icon={Home} label="Household" onClick={() => onRoleChange('household')} dark />
          <RoleButton active={role === 'collector'} icon={Truck} label="Collector" onClick={() => onRoleChange('collector')} dark />
        </div>
      </div>
      <p className="mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-sidebar-foreground/45">Workspace</p>
      <nav className="grid gap-1">
        {navItems.map((item) => (
          <button key={item.id} data-testid={`desktop-nav-${item.id}`} onClick={() => onNavigate(item.id)} className={`group flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium ${page === item.id ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' : 'text-sidebar-foreground/68 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}>
            <span className="flex items-center gap-3"><item.icon size={18} />{item.label}</span>
            {item.id === 'requests' && <span className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${page === item.id ? 'bg-primary/15' : 'bg-sidebar-foreground/10'}`}>3</span>}
          </button>
        ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent p-4">
        <div className="mb-3 flex items-center gap-2 text-secondary"><ShieldCheck size={17} /><span className="font-semibold">Ward 4 community</span></div>
        <p className="text-xs leading-relaxed text-sidebar-foreground/60">Every sorted kilo keeps Kathmandu cleaner and supports local collectors.</p>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-sidebar-foreground/10"><div className="h-full w-[72%] rounded-full bg-secondary" /></div>
        <p className="mt-2 flex justify-between font-mono text-[10px] text-sidebar-foreground/45"><span>MONTHLY GOAL</span><span>72%</span></p>
      </div>
    </aside>
  );
}

function TopBar({ role, onRoleChange, onMenu }: { role: Role; onRoleChange: (role: Role) => void; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-[73px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <button data-testid="button-mobile-menu" onClick={onMenu} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"><Menu size={21} /></button>
        <div className="lg:hidden"><p className="font-mono text-[9px] font-bold uppercase tracking-[.16em] text-primary">SWK / 24</p><p className="font-semibold leading-none">Smart Waste</p></div>
        <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex"><MapPin size={16} className="text-accent" /><span>Kathmandu Valley</span><span className="text-border">/</span><span className="font-medium capitalize text-foreground">{role} workspace</span></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden rounded-xl border border-border bg-card p-1 sm:flex">
          <RoleButton active={role === 'household'} icon={Home} label="Home" onClick={() => onRoleChange('household')} />
          <RoleButton active={role === 'collector'} icon={Truck} label="Collect" onClick={() => onRoleChange('collector')} />
        </div>
        <button data-testid="button-notifications" aria-label="Notifications" className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:border-primary hover:text-primary"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" /></button>
        <div className="hidden items-center gap-2 sm:flex"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">CM</div><div className="leading-tight"><p className="text-xs font-semibold">Community Member</p><p className="text-[10px] text-muted-foreground">Ward 4 · Lalitpur</p></div><ChevronDown size={15} className="text-muted-foreground" /></div>
      </div>
    </header>
  );
}

function RoleButton({ active, icon: Icon, label, onClick, dark = false }: { active: boolean; icon: typeof Home; label: string; onClick: () => void; dark?: boolean }) {
  return <button data-testid={`role-${label.toLowerCase()}`} onClick={onClick} className={`flex items-center justify-center gap-1.5 rounded-[9px] px-2.5 py-2 text-xs font-semibold ${active ? dark ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-primary text-primary-foreground shadow-sm' : dark ? 'text-sidebar-foreground/55 hover:bg-sidebar-foreground/10' : 'text-muted-foreground hover:bg-muted'}`}><Icon size={14} />{label}</button>;
}

function MobileNav({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  const items = navItems.filter((item) => item.id !== 'marketplace');
  return <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur-md lg:hidden">
    {items.map((item) => <button key={item.id} data-testid={`bottom-nav-${item.id}`} onClick={() => onNavigate(item.id)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold ${page === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><item.icon size={17} /><span>{item.id === 'home' ? 'Home' : item.label.replace('My ', '')}</span></button>)}
  </nav>;
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-secondary" />{eyebrow}</p><h1 className="text-[clamp(1.75rem,4vw,2.7rem)] font-bold tracking-[-.045em] text-foreground">{title}</h1><p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p></div>{action}</div>;
}

function HouseholdHome({ requests, onNavigate, onNotify }: { requests: Request[]; onNavigate: (page: Page) => void; onNotify: (message: string) => void }) {
  return <div className="rise-in">
    <PageHeading eyebrow="Wednesday · 28 August 2024" title="Good morning, neighbor." description="A little sorting today keeps our shared streets healthier tomorrow." action={<button data-testid="button-new-pickup" onClick={() => onNavigate('marketplace')} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/15 hover:-translate-y-0.5 hover:bg-primary/90"><Plus size={17} />List recyclables</button>} />
    <div className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
      <PickupHero onNotify={onNotify} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <StatCard icon={Recycle} label="Diverted this month" value="18.4 kg" detail="+3.2 kg from July" accent="yellow" />
        <StatCard icon={Coins} label="Community value" value="NPR 740" detail="earned by nearby collectors" accent="coral" />
      </div>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <ScheduleCard onNavigate={onNavigate} />
      <RequestsPreview requests={requests} onNavigate={onNavigate} />
    </div>
    <SegregationGuide onNotify={onNotify} />
  </div>;
}

function PickupHero({ onNotify }: { onNotify: (message: string) => void }) {
  const [reminded, setReminded] = useState(false);
  return <section className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10 sm:p-8">
    <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full border-[24px] border-secondary/15" /><div className="absolute -bottom-20 right-20 h-48 w-48 rounded-full border-[1px] border-primary-foreground/10" />
    <div className="relative">
      <div className="mb-9 flex items-start justify-between"><div><p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.17em] text-secondary"><span className="h-2 w-2 rounded-full bg-secondary" />Municipal collection</p><h2 className="max-w-sm text-2xl font-bold tracking-[-.04em] sm:text-3xl">Recyclables are up next.</h2></div><Truck size={33} className="text-secondary/80" /></div>
      <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="font-mono text-[11px] uppercase tracking-wider text-primary-foreground/55">Next pickup in</p><div className="mt-1 flex items-baseline gap-2"><span className="font-mono text-4xl font-bold tracking-[-.08em]">01:42:18</span><span className="text-sm text-primary-foreground/55">hrs</span></div></div><div className="text-left sm:text-right"><p className="font-mono text-[11px] uppercase tracking-wider text-primary-foreground/55">Today · 4:30–6:00 PM</p><p className="mt-1 text-sm font-semibold">Leave sorted bags outside</p></div></div>
      <div className="mt-7 flex flex-col gap-3 border-t border-primary-foreground/15 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-primary-foreground/70"><MapPin size={14} />Lalitpur Metropolitan · Ward 4</p><button data-testid="button-pickup-reminder" onClick={() => { setReminded(true); onNotify('Pickup reminder set for 4:00 PM.'); }} className="flex items-center justify-center gap-2 rounded-lg bg-primary-foreground/10 px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary-foreground/20">{reminded ? <Check size={14} /> : <Bell size={14} />}{reminded ? 'Reminder set' : 'Set a reminder'}</button></div>
    </div>
  </section>;
}

function StatCard({ icon: Icon, label, value, detail, accent }: { icon: typeof Recycle; label: string; value: string; detail: string; accent: 'yellow' | 'coral' }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent === 'yellow' ? 'bg-secondary/25 text-primary' : 'bg-accent/15 text-accent'}`}><Icon size={18} /></div><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This month</span></div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-[-.04em]">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function ScheduleCard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [selected, setSelected] = useState(3);
  const days = [{ day: 'M', date: 26, type: 'organic' }, { day: 'T', date: 27, type: 'recycle' }, { day: 'W', date: 28, type: 'organic' }, { day: 'T', date: 29, type: 'recycle' }, { day: 'F', date: 30, type: 'organic' }, { day: 'S', date: 31, type: 'recycle' }, { day: 'S', date: 1, type: 'organic' }];
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="mb-5 flex items-start justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Your street rhythm</p><h2 className="mt-1 text-lg font-bold">Collection schedule</h2></div><button data-testid="button-view-schedule" onClick={() => onNavigate('schedule')} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"><ArrowRight size={18} /></button></div><div className="mb-5 flex items-center justify-between"><button data-testid="button-previous-week" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><ChevronLeft size={17} /></button><span className="text-xs font-semibold">26 Aug — 01 Sep 2024</span><button data-testid="button-next-week" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><ChevronRight size={17} /></button></div><div className="grid grid-cols-7 gap-1.5">{days.map((item, index) => <button key={`${item.day}-${item.date}`} data-testid={`schedule-day-${item.date}`} onClick={() => setSelected(index)} className={`relative flex flex-col items-center gap-2 rounded-xl py-3 ${selected === index ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><span className={`font-mono text-[10px] font-bold ${selected === index ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{item.day}</span><span className="text-sm font-bold">{item.date}</span><span className={`h-2 w-2 rounded-full ${item.type === 'organic' ? selected === index ? 'bg-secondary' : 'bg-secondary' : selected === index ? 'bg-accent' : 'bg-accent'}`} /></button>)}</div><div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-xs"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-secondary" />Organic</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-accent" />Recyclable</span><span className="ml-auto font-semibold text-primary">{days[selected].type === 'organic' ? 'Organic pickup' : 'Recyclable pickup'}</span></div></section>;
}

function RequestsPreview({ requests, onNavigate }: { requests: Request[]; onNavigate: (page: Page) => void }) {
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-start justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">In motion</p><h2 className="mt-1 text-lg font-bold">Recent pickups</h2></div><button data-testid="button-view-requests" onClick={() => onNavigate('requests')} className="flex items-center gap-1 text-xs font-bold text-primary hover:text-accent">View all <ArrowRight size={14} /></button></div><div className="divide-y divide-border">{requests.slice(0, 3).map((request, index) => <RequestRow key={request.id} request={request} delay={index} />)}</div></section>;
}

function RequestRow({ request, delay = 0 }: { request: Request; delay?: number }) {
  const icon = request.type === 'Organic' ? Leaf : Recycle;
  const Icon = icon;
  return <div className={`rise-in delay-${Math.min(delay + 1, 4)} flex items-center gap-3 py-3`} data-testid={`request-row-${request.id}`}><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${request.type === 'Organic' ? 'bg-secondary/20 text-primary' : 'bg-accent/10 text-accent'}`}><Icon size={17} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{request.item}</p><p className="mt-0.5 text-xs text-muted-foreground">{request.date} · {request.weight}</p></div><StatusBadge status={request.status} /></div>;
}

function StatusBadge({ status }: { status: PickupStatus }) {
  const styles = { Pending: 'bg-secondary/20 text-[#7b5c05]', Accepted: 'bg-primary/10 text-primary', Completed: 'bg-muted text-muted-foreground' };
  return <span data-testid={`status-${status.toLowerCase()}`} className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${styles[status]}`}>{status === 'Completed' ? <Check size={11} /> : status === 'Accepted' ? <Truck size={11} /> : <CircleDashed size={11} />}{status}</span>;
}

function SegregationGuide({ onNotify }: { onNotify: (message: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cards = [{ title: 'Organic', subtitle: 'Kitchen & garden', icon: Leaf, color: 'bg-secondary/25 text-primary', items: 'Food scraps, tea leaves, garden clippings' }, { title: 'Recyclable', subtitle: 'Clean & dry', icon: Recycle, color: 'bg-accent/10 text-accent', items: 'Paper, PET bottles, metal, glass' }, { title: 'Residual', subtitle: 'Last resort', icon: Trash2, color: 'bg-muted text-muted-foreground', items: 'Sanitary waste, ceramics, contaminated wrappers' }];
  return <section className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Small choices, visible change</p><h2 className="mt-1 text-lg font-bold">Where does it go?</h2><p className="mt-1 text-sm text-muted-foreground">The two-second check before anything leaves your kitchen.</p></div><button data-testid="button-toggle-guide" onClick={() => setExpanded((value) => !value)} className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:border-primary hover:text-primary">{expanded ? 'Hide guide' : 'Open guide'}<ChevronDown size={16} className={expanded ? 'rotate-180' : ''} /></button></div><div className="grid gap-px border-t border-border bg-border sm:grid-cols-3">{cards.map((card) => <div key={card.title} className="bg-card p-5"><div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}><card.icon size={19} /></div><h3 className="font-bold">{card.title}</h3><p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{card.subtitle}</p>{expanded && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{card.items}. <button data-testid={`button-scan-${card.title.toLowerCase()}`} onClick={() => onNotify(`AI Scanner can help identify ${card.title.toLowerCase()} items.`)} className="font-bold text-primary underline underline-offset-2">Try the scanner</button></p>}</div>)}</div></section>;
}

function CollectorHome({ pickups, onAccept, onNavigate }: { pickups: CollectorPickup[]; onAccept: (id: number) => void; onNavigate: (page: Page) => void }) {
  const pending = pickups.filter((pickup) => pickup.status === 'Pending');
  return <div className="rise-in"><PageHeading eyebrow="Collector route · Wednesday 28 August" title="Good morning, Sita." description="There are sorted materials waiting in your nearby wards." action={<button data-testid="button-open-map" onClick={() => onNavigate('schedule')} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold hover:border-primary hover:text-primary"><MapPin size={16} />Open route map</button>} /><div className="mb-5 grid gap-4 sm:grid-cols-3"><CollectorStat label="Available nearby" value={`${pending.length}`} detail="pickup requests" icon={Package} /><CollectorStat label="Today’s earnings" value="NPR 1,240" detail="+NPR 180 vs yesterday" icon={Coins} /><CollectorStat label="Collected this week" value="42.8 kg" detail="across 17 households" icon={Weight} /></div><div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Live nearby feed</p><h2 className="mt-1 text-lg font-bold">Pickups you can take</h2></div><button data-testid="button-filter-pickups" className="flex items-center gap-2 self-start rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-primary"><ListFilter size={14} /> Filter: All</button></div><div className="grid gap-3">{pickups.map((pickup, index) => <CollectorPickupCard key={pickup.id} pickup={pickup} index={index} onAccept={onAccept} />)}</div>{pending.length === 0 && <EmptyState icon={CheckCircle2} title="All caught up" description="You accepted every nearby pickup. New requests will appear here." />}</section><CollectorTip /></div></div>;
}

function CollectorStat({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Package }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/25 text-primary"><Icon size={18} /></div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold tracking-[-.04em]">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>;
}

function CollectorPickupCard({ pickup, index, onAccept }: { pickup: CollectorPickup; index: number; onAccept: (id: number) => void }) {
  const accepted = pickup.status === 'Accepted';
  return <div className={`rise-in delay-${Math.min(index + 1, 4)} rounded-xl border ${accepted ? 'border-primary/30 bg-primary/[.035]' : 'border-border bg-background/35'} p-4`} data-testid={`collector-pickup-${pickup.id}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Recycle size={18} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{pickup.item}</h3><span className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-accent">{pickup.type}</span></div><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Weight size={13} />{pickup.weight}</span><span className="flex items-center gap-1"><MapPin size={13} />{pickup.neighborhood}</span><span className="flex items-center gap-1"><Clock3 size={13} />{pickup.date}</span></div></div></div><div className="flex items-center justify-between gap-3 border-t border-border pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0"><div className="text-right"><p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Estimated payout</p><p className="font-bold text-primary">{pickup.payout}</p></div><button data-testid={`button-accept-${pickup.id}`} disabled={accepted} onClick={() => onAccept(pickup.id)} className={`rounded-lg px-3 py-2 text-xs font-bold ${accepted ? 'cursor-default bg-primary/10 text-primary' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>{accepted ? <span className="flex items-center gap-1.5"><Check size={14} />Accepted</span> : 'Accept pickup'}</button></div></div></div>;
}

function CollectorTip() {
  return <aside className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/10"><div className="mb-10 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary"><Sparkles size={19} /></div><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-secondary">Route tip 04</span></div><h2 className="max-w-xs text-2xl font-bold leading-tight tracking-[-.04em]">Clean, dry, and sorted pays better.</h2><p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">Households who separate by type save you time at the door. Give them a quick thank-you — it keeps the loop going.</p><div className="mt-7 flex items-center gap-2 border-t border-primary-foreground/15 pt-4 text-xs text-primary-foreground/65"><ShieldCheck size={15} className="text-secondary" />Your safety comes first</div></aside>;
}

function SchedulePage({ onNotify }: { onNotify: (message: string) => void }) {
  const [month, setMonth] = useState(8);
  const [selected, setSelected] = useState(28);
  const months = ['August', 'September'];
  const dates = Array.from({ length: month === 8 ? 31 : 30 }, (_, index) => index + 1);
  const isRecycle = (date: number) => date % 2 === 0;
  return <div className="rise-in"><PageHeading eyebrow="Plan ahead" title="Your collection schedule." description="A simple rhythm for Ward 4. Put bags out by 7:00 AM on your pickup day." action={<button data-testid="button-calendar-sync" onClick={() => onNotify('Calendar link copied. Add it to your preferred calendar app.')} className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold hover:border-primary hover:text-primary"><CalendarDays size={16} />Add to calendar</button>} /><div className="grid gap-5 xl:grid-cols-[1fr_.7fr]"><section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"><div className="mb-6 flex items-center justify-between"><button data-testid="button-schedule-prev" onClick={() => setMonth((value) => value === 8 ? 9 : 8)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><ChevronLeft size={18} /></button><h2 className="font-bold">{months[month === 8 ? 0 : 1]} 2024</h2><button data-testid="button-schedule-next" onClick={() => setMonth((value) => value === 8 ? 9 : 8)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><ChevronRight size={18} /></button></div><div className="mb-3 grid grid-cols-7 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-2">{day.slice(0, 3)}</span>)}</div><div className="grid grid-cols-7 gap-1.5">{Array.from({ length: month === 8 ? 4 : 0 }).map((_, index) => <span key={`blank-${index}`} />)}{dates.map((date) => <button key={date} data-testid={`calendar-date-${date}`} onClick={() => setSelected(date)} className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold ${selected === date ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}><span>{date}</span><span className={`absolute bottom-2 h-1.5 w-1.5 rounded-full ${isRecycle(date) ? 'bg-accent' : 'bg-secondary'} ${selected === date ? 'opacity-90' : ''}`} /></button>)}</div></section><ScheduleLegend selected={selected} isRecycle={isRecycle} onNotify={onNotify} /></div></div>;
}

function ScheduleLegend({ selected, isRecycle, onNotify }: { selected: number; isRecycle: (date: number) => boolean; onNotify: (message: string) => void }) {
  const recycle = isRecycle(selected);
  return <div className="space-y-5"><div className={`rounded-2xl p-6 ${recycle ? 'bg-accent' : 'bg-primary'} text-primary-foreground`}><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary-foreground/60">Selected day · Aug {selected}</p><div className="mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-foreground/10">{recycle ? <Recycle size={24} /> : <Leaf size={24} />}</div><h2 className="mt-5 text-2xl font-bold">{recycle ? 'Recyclable pickup' : 'Organic pickup'}</h2><p className="mt-2 text-sm leading-relaxed text-primary-foreground/70">{recycle ? 'Clean, dry materials like paper, plastic, metal, and glass.' : 'Kitchen scraps and garden waste for a healthier soil cycle.'}</p><button data-testid="button-schedule-reminder" onClick={() => onNotify(`Reminder set for ${recycle ? 'recyclable' : 'organic'} pickup.`)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-foreground/10 px-4 py-3 text-sm font-bold hover:bg-primary-foreground/20"><Bell size={16} />Set reminder</button></div><div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">What to put out</p><div className="space-y-3 text-sm"><p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-primary" />Tie bags securely</p><p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-primary" />Keep materials dry</p><p className="flex items-center gap-3"><CheckCircle2 size={17} className="text-primary" />Place by 7:00 AM</p></div></div></div>;
}

function MarketplacePage({ onNotify }: { onNotify: (message: string) => void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [type, setType] = useState('PET bottles');
  const [weight, setWeight] = useState('3');
  const [note, setNote] = useState('');
  const [listings, setListings] = useState([{ title: 'Sorted PET bottles', seller: 'Mina K. · Patan', weight: '5 kg', price: 'NPR 175', time: '12 min ago', color: 'bg-accent/10 text-accent' }, { title: 'Old newspapers & cartons', seller: 'Ramesh T. · Kupondole', weight: '8 kg', price: 'NPR 240', time: '28 min ago', color: 'bg-secondary/25 text-primary' }, { title: 'Glass bottles', seller: 'Nisha B. · Jawalakhel', weight: '3.5 kg', price: 'NPR 120', time: '41 min ago', color: 'bg-primary/10 text-primary' }]);
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setListings((items) => [{ title: `Sorted ${type.toLowerCase()}`, seller: 'You · Lalitpur', weight: `${weight} kg`, price: `NPR ${Math.round(Number(weight) * 35)}`, time: 'just now', color: 'bg-primary/10 text-primary' }, ...items]);
    setSubmitted(true);
    setFormOpen(false);
    onNotify('Your recyclables are now visible to nearby collectors.');
  };
  return <div className="rise-in"><PageHeading eyebrow="Keep materials moving" title="Recyclables marketplace." description="List clean, sorted materials and connect with collectors in your neighborhood." action={<button data-testid="button-list-material" onClick={() => { setFormOpen(true); setSubmitted(false); }} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md shadow-primary/15 hover:-translate-y-0.5"><Plus size={17} />List materials</button>} /><div className="mb-5 grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/25 text-primary"><Coins size={19} /></div><div><h2 className="font-bold">Your sorted materials have value</h2><p className="mt-1 text-sm text-muted-foreground">Current neighborhood rate for clean PET is around <span className="font-bold text-foreground">NPR 35 / kg</span>.</p></div></div><div className="mt-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary sm:mt-0"><TrendingMini />Rates updated today</div></div>{submitted && <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary rise-in"><CheckCircle2 size={18} /><span><strong>Listing posted.</strong> Collectors nearby can now send an offer.</span><button data-testid="button-dismiss-listing" onClick={() => setSubmitted(false)} className="ml-auto p-1"><X size={16} /></button></div>}<div className="grid gap-5 xl:grid-cols-[1fr_.75fr]"><section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">Live in your area</p><h2 className="mt-1 text-lg font-bold">Available materials</h2></div><button data-testid="button-search-marketplace" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-primary"><Search size={17} /></button></div><div className="divide-y divide-border">{listings.map((listing, index) => <div key={listing.title} className={`rise-in delay-${index + 1} flex gap-3 py-4`}><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${listing.color}`}><Package size={19} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold">{listing.title}</h3><span className="font-mono text-sm font-bold text-primary">{listing.price}</span></div><p className="mt-1 text-xs text-muted-foreground">{listing.seller} · {listing.weight} · {listing.time}</p><button data-testid={`button-offer-${index}`} onClick={() => onNotify(`Offer request sent for ${listing.title.toLowerCase()}.`)} className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent">Request pickup <ArrowRight size={13} /></button></div></div>)}</div></section><MarketplaceAside /></div>{formOpen && <ListingModal type={type} weight={weight} note={note} onTypeChange={setType} onWeightChange={setWeight} onNoteChange={setNote} onClose={() => setFormOpen(false)} onSubmit={submit} />}</div>;
}

function TrendingMini() { return <span className="inline-flex h-4 items-end gap-0.5">{[5, 8, 11, 15].map((height) => <i key={height} className="w-1 rounded-sm bg-secondary" style={{ height }} />)}</span>; }

function MarketplaceAside() {
  return <aside className="rounded-2xl bg-[#d9e4c7] p-6 text-primary"><div className="mb-12 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary"><Recycle size={20} /></div><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary/55">3 ways to prep</span></div><h2 className="text-2xl font-bold leading-tight tracking-[-.04em]">Better sorting,<br />better rates.</h2><div className="mt-7 space-y-4">{['Rinse bottles and let them dry', 'Flatten cardboard to save space', 'Keep each material type separate'].map((tip, index) => <div key={tip} className="flex gap-3 border-t border-primary/15 pt-3 text-sm"><span className="font-mono text-xs font-bold text-primary/50">0{index + 1}</span><span>{tip}</span></div>)}</div></aside>;
}

function ListingModal({ type, weight, note, onTypeChange, onWeightChange, onNoteChange, onClose, onSubmit }: { type: string; weight: string; note: string; onTypeChange: (value: string) => void; onWeightChange: (value: string) => void; onNoteChange: (value: string) => void; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/35 p-0 backdrop-blur-sm sm:items-center sm:p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-2xl sm:p-7"><div className="mb-6 flex items-start justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">New marketplace listing</p><h2 className="mt-1 text-xl font-bold">What are you putting out?</h2></div><button data-testid="button-close-listing" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><form onSubmit={onSubmit} className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-bold">Material type</span><select data-testid="select-material-type" value={type} onChange={(event) => onTypeChange(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"><option>PET bottles</option><option>Cardboard & paper</option><option>Glass bottles</option><option>Metal</option></select></label><div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-xs font-bold">Estimated weight</span><div className="relative"><input data-testid="input-material-weight" required min="0.1" step="0.1" type="number" value={weight} onChange={(event) => onWeightChange(event.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-3 pr-10 text-sm" /><span className="absolute right-3 top-3 text-xs text-muted-foreground">kg</span></div></label><label className="block"><span className="mb-1.5 block text-xs font-bold">Ready by</span><select data-testid="select-ready-time" className="w-full rounded-xl border border-input bg-background px-3 py-3 text-sm"><option>Today, 4 PM</option><option>Tomorrow, 8 AM</option><option>This weekend</option></select></label></div><label className="block"><span className="mb-1.5 block text-xs font-bold">A note for the collector <span className="font-normal text-muted-foreground">(optional)</span></span><textarea data-testid="textarea-listing-note" value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Gate code, floor, or anything helpful" rows={3} className="w-full resize-none rounded-xl border border-input bg-background px-3 py-3 text-sm placeholder:text-muted-foreground/70" /></label><div className="flex gap-3 pt-2"><button type="button" data-testid="button-cancel-listing" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:bg-muted">Cancel</button><button type="submit" data-testid="button-submit-listing" className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"><span className="flex items-center justify-center gap-2"><Send size={15} />Post listing</span></button></div></form></div></div>;
}

function RequestsPage({ requests, onUpdate, onNotify }: { requests: Request[]; onUpdate: (id: number, status: PickupStatus) => void; onNotify: (message: string) => void }) {
  const [filter, setFilter] = useState<'All' | PickupStatus>('All');
  const filtered = filter === 'All' ? requests : requests.filter((request) => request.status === filter);
  return <div className="rise-in"><PageHeading eyebrow="Your activity" title="Pickup requests." description="Track what is scheduled, on its way, and already part of the circular economy." action={<button data-testid="button-request-pickup" onClick={() => onNotify('Choose recyclable materials in Marketplace to create a request.')} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"><Plus size={17} />New request</button>} /><div className="mb-5 flex flex-wrap gap-2">{(['All', 'Pending', 'Accepted', 'Completed'] as const).map((item) => <button key={item} data-testid={`filter-requests-${item.toLowerCase()}`} onClick={() => setFilter(item)} className={`rounded-full px-3.5 py-2 text-xs font-bold ${filter === item ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-primary'}`}>{item} {item !== 'All' && <span className="ml-1 opacity-60">{requests.filter((request) => request.status === item).length}</span>}</button>)}</div><section className="rounded-2xl border border-border bg-card shadow-sm"><div className="hidden grid-cols-[1.3fr_.8fr_.7fr_.6fr_auto] gap-4 border-b border-border px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:grid"><span>Material</span><span>Pickup time</span><span>Value</span><span>Status</span><span /></div>{filtered.map((request, index) => <div key={request.id} className={`rise-in delay-${Math.min(index + 1, 4)} flex flex-col gap-4 border-b border-border px-5 py-5 last:border-0 md:grid md:grid-cols-[1.3fr_.8fr_.7fr_.6fr_auto] md:items-center md:gap-4 md:px-6`} data-testid={`request-detail-${request.id}`}><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">{request.type === 'Organic' ? <Leaf size={18} /> : <Recycle size={18} />}</div><div><p className="font-bold">{request.item}</p><p className="text-xs text-muted-foreground">{request.type} · {request.weight}</p></div></div><p className="text-sm text-muted-foreground"><span className="mr-2 font-mono text-[10px] uppercase text-muted-foreground/70 md:hidden">Time</span>{request.date}</p><p className="text-sm font-bold text-primary"><span className="mr-2 font-mono text-[10px] uppercase text-muted-foreground/70 md:hidden">Value</span>{request.payout}</p><div><StatusBadge status={request.status} /></div><div className="flex gap-2 md:justify-end">{request.status === 'Pending' && <button data-testid={`button-cancel-request-${request.id}`} onClick={() => { onUpdate(request.id, 'Completed'); onNotify('Request marked as cancelled.'); }} className="rounded-lg border border-border p-2 text-muted-foreground hover:border-destructive hover:text-destructive"><Trash2 size={15} /></button>}{request.status === 'Accepted' && <button data-testid={`button-complete-request-${request.id}`} onClick={() => { onUpdate(request.id, 'Completed'); onNotify('Pickup marked complete. Nice work.'); }} className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15"><Check size={14} />Complete</button>}<button data-testid={`button-edit-request-${request.id}`} onClick={() => onNotify('Pickup details are locked while a collector is assigned.')} className="rounded-lg border border-border p-2 text-muted-foreground hover:border-primary hover:text-primary"><PencilLine size={15} /></button></div></div>)}{filtered.length === 0 && <EmptyState icon={ClipboardList} title="No requests here" description="Try another filter or list some recyclables to get started." />}</section></div>;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ScannerPage({ onNotify }: { onNotify: (message: string) => void }) {
  const [state, setState] = useState<'idle' | 'scanning' | 'result' | 'error'>('idle');
  const [fileName, setFileName] = useState('');
  const [scanError, setScanError] = useState('');
  const [result, setResult] = useState<WasteDetectionResponse | null>(null);
  const detectWaste = useDetectWaste();

  const startScan = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Please choose an image file.');
      setState('error');
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setScanError('Please choose an image smaller than 7 MB.');
      setState('error');
      return;
    }

    setFileName(file.name);
    setScanError('');
    setResult(null);
    setState('scanning');

    try {
      const imageBase64 = await readFileAsBase64(file);
      const [detected] = await Promise.all([
        detectWaste.mutateAsync({ data: { imageBase64, mimeType: file.type } }),
        wait(1600),
      ]);
      setResult(detected);
      setState('result');
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Gemini could not analyze this image. Please try a clearer photo.');
      setState('error');
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void startScan(file);
  };

  const reset = () => {
    setState('idle');
    setFileName('');
    setScanError('');
    setResult(null);
  };

  return <div className="rise-in"><PageHeading eyebrow="Know before you throw" title="AI waste scanner." description="Not sure which bin? Take a photo and Gemini will give you a Kathmandu-specific sorting recommendation." action={<div className="flex items-center gap-2 rounded-full bg-secondary/20 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider text-primary"><Sparkles size={14} />Gemini Flash</div>} /><div className="grid gap-5 xl:grid-cols-[1fr_.72fr]"><section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8"><div className="mb-8 flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary">One item at a time</p><h2 className="mt-1 text-xl font-bold">{state === 'idle' ? 'Show us the item.' : state === 'scanning' ? 'Reading the material…' : state === 'error' ? 'We could not finish the scan.' : 'Here is what Gemini found.'}</h2></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><ScanLine size={20} /></div></div>{state === 'idle' && <div className="rounded-2xl border-2 border-dashed border-border bg-background/50 px-5 py-12 text-center sm:px-10"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/25 text-primary"><Camera size={28} /></div><h3 className="font-bold">Upload or take a photo</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">A clear photo of one item works best. Your image is sent securely to Gemini for analysis and is not stored by this app.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><label data-testid="label-upload-image" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"><Upload size={16} />Upload image<input data-testid="input-upload-image" type="file" accept="image/*" onChange={handleFile} className="sr-only" /></label><label data-testid="label-camera-image" className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:border-primary hover:text-primary"><Camera size={16} />Use camera<input data-testid="input-camera-image" type="file" accept="image/*" capture="environment" onChange={handleFile} className="sr-only" /></label></div></div>}{state === 'scanning' && <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl bg-primary p-8 text-center text-primary-foreground"><div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-primary-foreground/30"><div className="absolute inset-4 rounded-xl border border-secondary/40 pulse-ring" /><ScanLine size={43} className="text-secondary" /><div className="scan-line absolute inset-x-3 top-1/2 h-0.5 bg-secondary shadow-[0_0_16px_hsl(var(--secondary))]" /></div><p className="mt-7 font-bold">Gemini is checking the material</p><p className="mt-1 text-xs text-primary-foreground/60">{fileName || 'Your image'} · secure image analysis</p><div className="mt-5 flex items-center gap-1.5">{[1, 2, 3].map((dot) => <i key={dot} className="h-1.5 w-1.5 rounded-full bg-secondary" style={{ opacity: dot === 2 ? .55 : 1 }} />)}</div></div>}{state === 'error' && <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-accent/30 bg-accent/5 p-8 text-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent"><X size={25} /></div><h3 className="mt-5 font-bold">Scan unavailable</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{scanError}</p><button data-testid="button-retry-scan" onClick={reset} className="mt-6 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">Try another image</button></div>}{state === 'result' && result && <ScannerResult fileName={fileName} result={result} onReset={reset} onNotify={onNotify} />}</section><ScannerInfo /></div></div>;
}

function ScannerResult({ fileName, result, onReset, onNotify }: { fileName: string; result: WasteDetectionResponse; onReset: () => void; onNotify: (message: string) => void }) {
  const CategoryIcon = result.category === 'Organic' ? Leaf : result.category === 'Hazardous' ? ShieldCheck : Recycle;
  const categoryStyle = result.category === 'Organic' ? 'bg-secondary/20 text-primary' : result.category === 'Hazardous' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary';
  return <div className="rounded-2xl border border-primary/20 bg-primary/[.04] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2 text-primary"><CheckCircle2 size={18} /><span className="font-mono text-[10px] font-bold uppercase tracking-widest">Gemini scan complete</span></div><h3 className="mt-4 text-2xl font-bold tracking-[-.04em]">{result.detectedItem}</h3><p className="mt-1 text-sm text-muted-foreground">{fileName || 'Uploaded image'} · not stored by this app</p></div><span className="shrink-0 rounded-full bg-secondary/30 px-2.5 py-1 font-mono text-xs font-bold text-primary">{Math.round(result.confidencePercent)}% match</span></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-border bg-card p-4"><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Waste category</p><p className={`mt-2 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-sm font-bold ${categoryStyle}`}><CategoryIcon size={16} />{result.category}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{result.segregationAdvice}</p></div><div className="rounded-xl border border-border bg-card p-4"><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Kathmandu market value</p><p className="mt-2 flex items-center gap-2 font-bold"><Coins size={17} className="text-secondary" />{result.marketValueNpr}</p><p className="mt-2 text-xs text-muted-foreground">An estimate only; rates vary by material quality and collector.</p></div></div><div className="mt-5 rounded-xl border border-border bg-card p-4"><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Segregation advice</p><p className="mt-2 text-sm leading-relaxed">{result.segregationAdvice}</p></div><div className="mt-5 flex flex-col gap-3 sm:flex-row"><button data-testid="button-list-scanned-item" onClick={() => onNotify(`Opening a new listing for ${result.detectedItem.toLowerCase()}.`)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"><ShoppingBag size={16} />List this material</button><button data-testid="button-reset-scanner" onClick={onReset} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-bold hover:border-primary hover:text-primary"><ScanLine size={16} />Scan another</button></div></div>;
}

function ScannerInfo() {
  return <aside className="space-y-5"><div className="rounded-2xl bg-[#e6d9bc] p-6 text-primary"><div className="mb-10 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary"><ShieldCheck size={19} /></div><span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary/55">No image storage</span></div><h2 className="text-2xl font-bold leading-tight tracking-[-.04em]">A helpful guess,<br />not a final word.</h2><p className="mt-4 text-sm leading-relaxed text-primary/70">Gemini helps identify everyday items. When in doubt, keep hazardous or medical waste separate and ask your ward office.</p></div><div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">How it works</p><div className="space-y-4">{[{ icon: Camera, title: 'Take one clear photo' }, { icon: Sparkles, title: 'Gemini analyzes the material' }, { icon: Recycle, title: 'Get a sorting suggestion' }].map((item, index) => <div className="flex items-center gap-3" key={item.title}><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary"><item.icon size={15} /></div><div className="flex-1 text-sm font-semibold">{item.title}</div><span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span></div>)}</div></div></aside>;
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof ClipboardList; title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center px-5 py-16 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Icon size={23} /></div><h3 className="font-bold">{title}</h3><p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">{description}</p></div>;
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div role="status" data-testid="toast-feedback" className="fixed bottom-20 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl lg:bottom-6"><CheckCircle2 size={18} className="shrink-0 text-secondary" /><span className="flex-1">{message}</span><button data-testid="button-dismiss-toast" onClick={onDismiss} className="rounded-md p-1 text-primary-foreground/60 hover:text-primary-foreground"><X size={15} /></button></div>;
}

export default App;