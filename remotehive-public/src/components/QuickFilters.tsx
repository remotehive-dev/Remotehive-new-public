import { 
  Briefcase, 
  Code, 
  Megaphone, 
  BarChart, 
  PenTool, 
  Users, 
  LineChart, 
  Globe, 
  Building2, 
  GraduationCap 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CATEGORIES = [
  { name: 'Remote', icon: Globe, href: '/jobs?location=Remote', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'MNC', icon: Building2, href: '/jobs?type=MNC', color: 'bg-orange-50 text-orange-600' },
  { name: 'Engineering', icon: Code, href: '/jobs?role=Engineering', color: 'bg-blue-50 text-blue-600' },
  { name: 'Marketing', icon: Megaphone, href: '/jobs?role=Marketing', color: 'bg-pink-50 text-pink-600' },
  { name: 'Internship', icon: GraduationCap, href: '/jobs?type=Internship', color: 'bg-purple-50 text-purple-600' },
  { name: 'Data Science', icon: BarChart, href: '/jobs?role=Data+Science', color: 'bg-yellow-50 text-yellow-600' },
  { name: 'Supply Chain', icon: Briefcase, href: '/jobs?role=Supply+Chain', color: 'bg-slate-50 text-slate-600' },
  { name: 'Banking', icon: LineChart, href: '/jobs?role=Banking', color: 'bg-green-50 text-green-600' },
  { name: 'HR', icon: Users, href: '/jobs?role=HR', color: 'bg-rose-50 text-rose-600' },
  { name: 'Analytics', icon: BarChart, href: '/jobs?role=Analytics', color: 'bg-cyan-50 text-cyan-600' },
  { name: 'Fresher', icon: GraduationCap, href: '/jobs?type=Fresher', color: 'bg-amber-50 text-amber-600' },
  { name: 'Design', icon: PenTool, href: '/jobs?role=Design', color: 'bg-teal-50 text-teal-600' },
];

export function QuickFilters() {
  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {CATEGORIES.map((category) => (
        <Link
          key={category.name}
          to={category.href}
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md active:scale-95"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${category.color}`}>
            <category.icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
            {category.name}
          </span>
          <span className="text-slate-400 group-hover:text-indigo-400">›</span>
        </Link>
      ))}
    </div>
  );
}
