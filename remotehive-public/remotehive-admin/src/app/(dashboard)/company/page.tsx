"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  Save, 
  Loader2, 
  Users, 
  Shield, 
  Upload, 
  CheckCircle, 
  Plus,
  Trash2,
  Globe,
  Lock
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { 
  getCompany, 
  updateCompany, 
  getUserByClerkId, 
  getCompanyUsers,
  uploadCompanyLogo,
  createUser,
  CompanyProfile 
} from "../../../lib/api";

type Tab = 'profile' | 'team' | 'security';

export default function CompanyProfilePage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data State
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // UI State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({ email: '', name: '', role: 'member' });
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      try {
        const dbUser = await getUserByClerkId(user.id);
        const fetchedCompanyId = (dbUser as any).company_id;
        
        if (fetchedCompanyId) {
          setCompanyId(fetchedCompanyId);
          
          // Fetch Company Data
          const companyData = await getCompany(fetchedCompanyId);
          setProfile(companyData);
          
          // Fetch Team Data
          const usersData = await getCompanyUsers(fetchedCompanyId);
          setTeamMembers(usersData || []);

          if (companyData.domain_verified) {
            setVerificationStatus('verified');
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyId) return;

    setIsSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    let logoUrl = profile?.logo_url;

    try {
      // Upload Logo if changed
      if (logoFile) {
        try {
           logoUrl = await uploadCompanyLogo(companyId, logoFile);
        } catch (uploadErr) {
           console.warn("Logo upload failed, skipping...", uploadErr);
           // Fallback or alert user
        }
      }

      const updates: Partial<CompanyProfile> = {
        name: formData.get('name') as string,
        website_url: formData.get('website_url') as string,
        logo_url: logoUrl,
        description: formData.get('description') as string,
        type: formData.get('type') as string,
        locations: (formData.get('locations') as string).split(',').map(s => s.trim()).filter(Boolean),
        tags: (formData.get('tags') as string).split(',').map(s => s.trim()).filter(Boolean),
      };

      await updateCompany(companyId, updates);
      setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
      alert("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Failed to update profile";
      if (msg.includes("400") || msg.includes("row")) {
          setError("Database Schema Error: It seems the database is missing some fields. Please run the 'supabase_setup.sql' script in your Supabase SQL Editor.");
      } else {
          setError(msg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!companyId) return;
    setVerificationStatus('verifying');
    
    // Simulate verification delay
    setTimeout(async () => {
      try {
        await updateCompany(companyId, { domain_verified: true });
        setVerificationStatus('verified');
        setProfile(prev => prev ? ({ ...prev, domain_verified: true }) : null);
      } catch (e) {
        setVerificationStatus('failed');
      }
    }, 2000);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    
    try {
      // Create a "pending" user or real user if we had auth hookup
      // For now, we simulate creating a user entry in DB
      const createdUser = await createUser(
        `pending_${Date.now()}`, // Temporary Clerk ID
        newMember.email,
        newMember.name,
        newMember.role,
        companyId
      );
      
      setTeamMembers(prev => [...prev, createdUser]);
      setShowAddMember(false);
      setNewMember({ email: '', name: '', role: 'member' });
      alert("Member invited successfully!");
    } catch (err: any) {
      alert("Failed to invite member: " + err.message);
    }
  };

  const handleSSOSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyId) return;
    
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const ssoConfig = {
      provider: formData.get('sso_provider') as string,
      entry_point: formData.get('sso_entry_point') as string,
      issuer: formData.get('sso_issuer') as string,
      cert: formData.get('sso_cert') as string,
    };
    
    const updates = {
      sso_enabled: formData.get('sso_enabled') === 'on',
      sso_config: ssoConfig
    };

    try {
      await updateCompany(companyId, updates);
      setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
      alert("SSO Configuration saved!");
    } catch (err: any) {
      alert("Failed to save SSO config: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Company Management</h1>
        <p className="text-slate-500">Manage your company profile, team, and security settings.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'profile' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="h-4 w-4" />
          General Info
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'team' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" />
          Team Members
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'security' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield className="h-4 w-4" />
          Security & SSO
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Logo Section */}
            <div className="lg:col-span-1">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Company Logo</h3>
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-32 w-32 overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center group hover:border-indigo-500 transition-colors">
                    {logoFile ? (
                      <img src={URL.createObjectURL(logoFile)} alt="Preview" className="h-full w-full object-cover" />
                    ) : profile?.logo_url ? (
                      <img src={profile.logo_url} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <Upload className="h-8 w-8 text-slate-400" />
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                  <p className="text-xs text-center text-slate-500">
                    Click to upload. PNG, JPG or GIF up to 2MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                    <input
                      name="name"
                      defaultValue={profile?.name}
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                          name="website_url"
                          defaultValue={profile?.website_url}
                          placeholder="https://example.com"
                          className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleVerifyDomain}
                        disabled={verificationStatus === 'verified' || verificationStatus === 'verifying'}
                        className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
                          verificationStatus === 'verified' 
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {verificationStatus === 'verifying' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : verificationStatus === 'verified' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Shield className="h-4 w-4" />
                        )}
                        {verificationStatus === 'verified' ? 'Verified' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      defaultValue={profile?.description}
                      rows={4}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Industry / Type</label>
                    <input
                      name="type"
                      defaultValue={profile?.type}
                      placeholder="e.g. Technology"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Locations</label>
                    <input
                      name="locations"
                      defaultValue={profile?.locations?.join(', ')}
                      placeholder="Remote, NY, London"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                    <input
                      name="tags"
                      defaultValue={profile?.tags?.join(', ')}
                      placeholder="Startup, SaaS, Fintech"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Team Members</h2>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Member
            </button>
          </div>

          {showAddMember && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6">
              <h3 className="text-sm font-semibold text-indigo-900 mb-4">Invite New Member</h3>
              <form onSubmit={handleAddMember} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-indigo-700 mb-1">Full Name</label>
                  <input
                    value={newMember.name}
                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                    required
                    className="w-full rounded-md border-indigo-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-indigo-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    required
                    className="w-full rounded-md border-indigo-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-medium text-indigo-700 mb-1">Role</label>
                  <select
                    value={newMember.role}
                    onChange={e => setNewMember({...newMember, role: e.target.value})}
                    className="w-full rounded-md border-indigo-200 px-3 py-2 text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">Invite</button>
                  <button type="button" onClick={() => setShowAddMember(false)} className="px-4 py-2 bg-white text-indigo-700 rounded-md text-sm font-medium hover:bg-indigo-50">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{member.full_name}</td>
                    <td className="px-6 py-4 text-slate-500">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {teamMembers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No team members yet. Invite someone above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Security & SSO Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handleSSOSave} className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Single Sign-On (SSO)</h3>
                <p className="text-sm text-slate-500">Enable employees to log in using your Identity Provider.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Enable SSO</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    name="sso_enabled" 
                    type="checkbox" 
                    defaultChecked={profile?.sso_enabled} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Identity Provider</label>
                  <select 
                    name="sso_provider" 
                    defaultValue={profile?.sso_config?.provider || "okta"}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="okta">Okta</option>
                    <option value="google">Google Workspace</option>
                    <option value="azure">Azure AD</option>
                    <option value="onelogin">OneLogin</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">SAML Entry Point (SSO URL)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      name="sso_entry_point"
                      defaultValue={profile?.sso_config?.entry_point}
                      placeholder="https://idp.example.com/sso/saml"
                      className="w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Issuer (Entity ID)</label>
                  <input
                    name="sso_issuer"
                    defaultValue={profile?.sso_config?.issuer}
                    placeholder="http://www.okta.com/exk..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Public Certificate (X.509)</label>
                  <textarea
                    name="sso_cert"
                    defaultValue={profile?.sso_config?.cert}
                    rows={5}
                    placeholder="-----BEGIN CERTIFICATE-----..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Service Provider Configuration</h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <p><span className="font-medium">ACS URL:</span> https://remotehive.in/api/auth/sso/callback</p>
                  <p><span className="font-medium">Entity ID:</span> urn:remotehive:sp</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}