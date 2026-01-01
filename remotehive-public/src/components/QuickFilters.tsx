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
  GraduationCap,
  Rocket,
  Laptop,
  Search,
  Zap,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Icon mapper for dynamic icons
const IconMap: Record<string, any> = {
  Code, Briefcase, Rocket, Globe, Laptop, Megaphone, BarChart, 
  PenTool, Users, LineChart, Building2, GraduationCap, Search, Zap, User,
  // Mapping some common variations
  'Code2': Code,
  'Engineering': Code,
  'Marketing': Megaphone,
  'Design': PenTool,
  'Product': Briefcase,
  'Sales': Globe,
};

interface QuickFilter {
  name: string;
  icon: string;
  href: string;
  color: string;
}

interface QuickFiltersProps {
  filters?: QuickFilter[];
}

export function QuickFilters({ filters }: QuickFiltersProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      {filters.map((category) => {
        const IconComponent = IconMap[category.icon] || Briefcase; // Fallback
        
        return (
          <Link
            key={category.name}
            to={category.href}
            className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md active:scale-95"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${category.color}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
              {category.name}
            </span>
            <span className="text-slate-400 group-hover:text-indigo-400">›</span>
          </Link>
        );
      })}
    </div>
  );
}
