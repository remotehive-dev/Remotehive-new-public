import { X, Globe, MapPin, Briefcase, Calendar, Save, Building } from 'lucide-react';
import { Company } from '../types';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CompanyDrawerProps {
    company: Company | null;
    isOpen: boolean;
    onClose: () => void;
}

export function CompanyDrawer({ company, isOpen, onClose }: CompanyDrawerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Company>>({});

    useEffect(() => {
        if (company) {
            setEditForm(company);
            setIsEditing(false);
        }
    }, [company]);

    if (!isOpen || !company) return null;

    const handleSave = () => {
        // In a real app, this would call an API to update Supabase
        alert("Update feature would save to database here. (Simulated)");
        setIsEditing(false);
    };

    const getLogoUrl = (company: Company) => {
        if (company.logo_url) return company.logo_url;
        if (company.website_url) {
            try {
                const urlStr = company.website_url.startsWith('http') ? company.website_url : `https://${company.website_url}`;
                const urlObj = new URL(urlStr);
                const domain = urlObj.hostname.replace('www.', '');
                return `https://logo.clearbit.com/${domain}`;
            } catch (e) { }
        }
        return `https://ui-avatars.com/api/?name=${company.name.charAt(0)}&background=random`;
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative z-50 h-full w-full max-w-2xl transform overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-in-out">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 p-1">
                            <img src={getLogoUrl(company)} alt={company.name} className="h-full w-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">{company.name}</h2>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="uppercase tracking-wider">{company.type || 'Company'}</span>
                                {company.industry && <>•<span>{company.industry}</span></>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
                            >
                                Edit Details
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                            >
                                <Save className="h-4 w-4" />
                                Save
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

                    {/* About Section */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Building className="h-5 w-5 text-indigo-600" />
                            About {company.name}
                        </h3>
                        {isEditing ? (
                            <textarea
                                className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[150px]"
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Company description..."
                            />
                        ) : (
                            <p className="text-slate-600 leading-relaxed">
                                {company.description || "No description available for this company yet."}
                            </p>
                        )}
                    </section>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="text-sm text-slate-500 font-medium mb-1">Website</div>
                            {isEditing ? (
                                <input
                                    className="w-full rounded border-slate-300 text-sm px-2 py-1"
                                    value={editForm.website_url || ''}
                                    onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })}
                                />
                            ) : (
                                <a
                                    href={company.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 font-medium hover:underline flex items-center gap-2"
                                >
                                    <Globe className="h-4 w-4" />
                                    Visit Website
                                </a>
                            )}
                        </div>
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="text-sm text-slate-500 font-medium mb-1">Headquarters</div>
                            {isEditing ? (
                                <input
                                    className="w-full rounded border-slate-300 text-sm px-2 py-1"
                                    value={editForm.location || ''}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                />
                            ) : (
                                <div className="text-slate-900 font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-slate-400" />
                                    {company.location || "Remote"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                            {company.tags?.map(tag => (
                                <span key={tag} className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-600 font-medium">
                                    {tag}
                                </span>
                            ))}
                            {(!company.tags || company.tags.length === 0) && (
                                <span className="text-sm text-slate-400 italic">No tags added</span>
                            )}
                        </div>
                    </section>

                    {/* Jobs CTA */}
                    <div className="rounded-2xl bg-indigo-600 p-6 text-white flex items-center justify-between shadow-lg ring-1 ring-indigo-500/50">
                        <div>
                            <h4 className="text-lg font-bold">Interested in working here?</h4>
                            <p className="text-indigo-100 text-sm opacity-90 mt-1">
                                Check out open positions at {company.name}.
                            </p>
                        </div>
                        <Link
                            to={`/jobs?company_name=${encodeURIComponent(company.name)}`}
                            onClick={onClose}
                            className="px-6 py-2.5 bg-white text-indigo-600 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-sm"
                        >
                            View Jobs
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
}
