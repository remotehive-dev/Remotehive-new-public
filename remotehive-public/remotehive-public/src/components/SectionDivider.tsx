import { clsx } from "clsx";

interface SectionDividerProps {
    title?: string;
    subtitle?: string;
    className?: string;
}

export function SectionDivider({ title, subtitle, className }: SectionDividerProps) {
    return (
        <div className={clsx("relative py-8 flex flex-col items-center justify-center text-center", className)}>
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative bg-slate-50 px-4">
                {title && (
                    <h2 className="text-xl font-bold text-slate-900 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm border border-slate-200">
                        {title}
                    </h2>
                )}
            </div>
            {subtitle && (
                <p className="relative mt-4 text-sm text-slate-500 bg-white/50 px-3 py-1 rounded-md">
                    {subtitle}
                </p>
            )}
        </div>
    );
}
