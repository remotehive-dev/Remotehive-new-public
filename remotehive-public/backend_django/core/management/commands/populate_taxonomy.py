from django.core.management.base import BaseCommand
from django.utils.text import slugify
from core.taxonomy_models import JobFamily, JobCategory, JobRole

class Command(BaseCommand):
    help = 'Populates the standard Job Taxonomy (Remote-First) with Detailed Metadata'

    def handle(self, *args, **options):
        self.stdout.write("Starting Detailed Taxonomy Import...")

        # Structure: "Family": { "Category": { "Role Name": { metadata... } } }
        # Using exact categories provided by user
        TAXONOMY = {
            "Customer Success & Support": {
                "Customer Success & Support": {
                    "Customer Support Representative": {
                        "seniority": "Junior → Mid",
                        "skills": "written English, CRM (Zendesk), typing, troubleshooting",
                        "kpis": "CSAT, FCR, avg handle time, SLA compliance",
                        "remote": "Fully remote / FT/PT/Contract"
                    },
                    "Technical Support Engineer (Tier 2)": {
                        "seniority": "Mid",
                        "skills": "product/debugging, logs, SQL/basic scripting, documentation",
                        "kpis": "ticket resolution rate, escalation rate, time-to-fix",
                        "remote": "Fully remote / FT or contract"
                    },
                    "Customer Success Manager (CSM)": {
                        "seniority": "Mid → Senior",
                        "skills": "account management, product demo, CRM, stakeholder mgmt",
                        "kpis": "churn rate, NRR, expansion revenue, health score",
                        "remote": "Remote-first / FT"
                    },
                    "Support Operations Specialist": {
                        "seniority": "Mid",
                        "skills": "process mapping, analytics, Zendesk/Gorgias admin, automation",
                        "kpis": "ticket backlog, automation ROI, QA scores",
                        "remote": "Fully remote / FT"
                    },
                    "Community Manager": {
                        "seniority": "Mid",
                        "skills": "social media, content, moderation, Slack/Discord management",
                        "kpis": "community growth, engagement rate, referral leads",
                        "remote": "Fully remote / FT or contract"
                    }
                }
            },
            "Sales & Business Development": {
                "Sales & Business Development": {
                    "Sales Development Representative (SDR)": {
                        "seniority": "Junior → Mid",
                        "skills": "cold outreach, CRM, LinkedIn, communication",
                        "kpis": "meetings booked, SQLs, response rate",
                        "remote": "Fully remote / FT or commission"
                    },
                    "Account Executive (AE)": {
                        "seniority": "Mid → Senior",
                        "skills": "demo skills, negotiation, pipeline management, closing",
                        "kpis": "quota attainment, deal cycle time, ACV",
                        "remote": "Remote-first / FT"
                    },
                    "Channel / Partnerships Manager": {
                        "seniority": "Mid",
                        "skills": "partner ops, contract negotiation, relationship mgmt",
                        "kpis": "partner-sourced revenue, partner onboarding time",
                        "remote": "Remote-first / FT or contract"
                    },
                    "Renewals Manager": {
                        "seniority": "Mid",
                        "skills": "negotiation, analytics, CRM",
                        "kpis": "renewal rate, churn reduction, net revenue retention",
                        "remote": "Fully remote / FT"
                    }
                }
            },
            "Marketing & Growth": {
                "Marketing & Growth": {
                    "Performance Marketing Manager": {
                        "seniority": "Mid → Senior",
                        "skills": "Google Ads, analytics, CRO, budgeting",
                        "kpis": "CAC, ROAS, conversion rate",
                        "remote": "Fully remote / FT or contract"
                    },
                    "Content Marketing Manager": {
                        "seniority": "Mid → Senior",
                        "skills": "SEO, CMS, editorial calendar, copywriting",
                        "kpis": "organic traffic, leads from content, backlinks",
                        "remote": "Fully remote / FT or freelance"
                    },
                    "Growth Product Manager": {
                        "seniority": "Mid → Senior",
                        "skills": "A/B testing, analytics, SQL, product sense",
                        "kpis": "activation rate, retention, LTV/CAC",
                        "remote": "Remote-first / FT"
                    },
                    "Social Media Specialist": {
                        "seniority": "Junior → Mid",
                        "skills": "social tools, copy, creative coordination",
                        "kpis": "engagement, follower growth, referral traffic",
                        "remote": "Fully remote / FT or contract"
                    },
                    "SEO Specialist": {
                        "seniority": "Mid",
                        "skills": "keyword research, technical SEO, analytics, CMS",
                        "kpis": "organic keywords, organic sessions, SERP positions",
                        "remote": "Fully remote / FT or freelance"
                    }
                }
            },
            "Product, Design & UX": {
                "Product, Design & UX": {
                    "Product Manager (Remote)": {
                        "seniority": "Mid → Senior",
                        "skills": "user research, roadmapping, stakeholder mgmt, analytics",
                        "kpis": "feature adoption, delivery predictability, user satisfaction",
                        "remote": "Remote-first / FT"
                    },
                    "UX/UI Designer": {
                        "seniority": "Mid",
                        "skills": "Figma, prototyping, user research, component libraries",
                        "kpis": "usability test scores, design turnaround, handoff quality",
                        "remote": "Fully remote / FT or contract"
                    },
                    "Product Designer (Research-heavy)": {
                        "seniority": "Senior",
                        "skills": "research methods, synthesis, prototyping",
                        "kpis": "research insights used, usability improvements",
                        "remote": "Fully remote / FT or contract"
                    },
                    "UX Researcher": {
                        "seniority": "Mid → Senior",
                        "skills": "research design, moderation, data synthesis",
                        "kpis": "research impact, insights delivered, stakeholder adoption",
                        "remote": "Remote-first / FT or contract"
                    }
                }
            },
            "Engineering & IT": {
                "Engineering & IT": {
                    "Frontend Engineer (React/Vue)": {
                        "seniority": "Mid → Senior",
                        "skills": "JS, React/Vue, testing, accessibility",
                        "kpis": "deployment frequency, bugs, performance metrics",
                        "remote": "Fully remote / FT"
                    },
                    "Backend Engineer": {
                        "seniority": "Mid → Senior",
                        "skills": "Python/Node/Go/Java, SQL/NoSQL, REST/gRPC, testing",
                        "kpis": "uptime, latency, error rate, throughput",
                        "remote": "Fully remote / FT"
                    },
                    "Full-stack Engineer": {
                        "seniority": "Mid",
                        "skills": "JS + backend language, DB, infra basics",
                        "kpis": "feature delivery, code quality, PR throughput",
                        "remote": "Fully remote / FT"
                    },
                    "Mobile Engineer (React Native/Flutter)": {
                        "seniority": "Mid",
                        "skills": "RN/Flutter, native modules, testing",
                        "kpis": "crash rate, app store ratings, release cadence",
                        "remote": "Remote-first / FT"
                    },
                    "QA / Test Engineer (Automation)": {
                        "seniority": "Mid",
                        "skills": "Selenium/Playwright, test design, CI/CD",
                        "kpis": "test coverage, regression defects, release stability",
                        "remote": "Fully remote / FT or contract"
                    },
                    "Site Reliability Engineer (SRE) / DevOps": {
                        "seniority": "Senior",
                        "skills": "Kubernetes, Terraform, observability, incident response",
                        "kpis": "MTTR, uptime, deployment success rate",
                        "remote": "Remote-first / FT"
                    },
                    "Security Engineer (AppSec/CloudSec)": {
                        "seniority": "Mid → Senior",
                        "skills": "pentesting, IAM, cloud security, tooling",
                        "kpis": "vulns fixed, time-to-remediate, compliance checks",
                        "remote": "Fully remote / FT or contract"
                    },
                    "Integration Engineer / API Specialist": {
                        "seniority": "Mid",
                        "skills": "RESTful APIs, OAuth, error handling, docs",
                        "kpis": "integration uptime, error rates, time-to-onboard",
                        "remote": "Fully remote / FT or contract"
                    }
                }
            },
            "Data & Analytics": {
                "Data & Analytics": {
                    "Data Analyst": {
                        "seniority": "Junior → Mid",
                        "skills": "SQL, Looker/Tableau, Excel, storytelling",
                        "kpis": "report adoption, query accuracy, insight-led changes",
                        "remote": "Fully remote / FT"
                    },
                    "Data Engineer": {
                        "seniority": "Mid → Senior",
                        "skills": "Python, Airflow, BigQuery/Redshift, data modeling",
                        "kpis": "pipeline reliability, data freshness, latency",
                        "remote": "Fully remote / FT"
                    },
                    "Machine Learning Engineer": {
                        "seniority": "Mid → Senior",
                        "skills": "ML frameworks, deployment, feature stores",
                        "kpis": "model accuracy, latency, business impact",
                        "remote": "Remote-first / FT or contract"
                    }
                }
            },
            "HR, People & Talent": {
                "HR, People & Talent": {
                    "Remote Recruiter (Technical & Non-Technical)": {
                        "seniority": "Mid",
                        "skills": "ATS, sourcing, interviewing, employer branding",
                        "kpis": "time-to-fill, offer acceptance, hiring quality",
                        "remote": "Fully remote / FT or contract"
                    },
                    "People Operations / HRBP": {
                        "seniority": "Mid → Senior",
                        "skills": "HRIS, employment law knowledge, payroll ops",
                        "kpis": "employee satisfaction, onboarding time, compliance",
                        "remote": "Remote-first / FT"
                    },
                    "L&D / Remote Trainer": {
                        "seniority": "Mid",
                        "skills": "instructional design, LMS, webinar delivery",
                        "kpis": "completion rates, time-to-productivity, training NPS",
                        "remote": "Fully remote / FT or contract"
                    }
                }
            },
            "Finance, Legal & Compliance": {
                "Finance, Legal & Compliance": {
                    "Remote Accountant / Bookkeeper": {
                        "seniority": "Junior → Mid",
                        "skills": "accounting software (Xero/QuickBooks), invoicing, reconciliations",
                        "kpis": "closing time, reconciliation accuracy, days payable/receivable",
                        "remote": "Fully remote / FT or contract"
                    },
                    "Finance Manager / FP&A (Remote)": {
                        "seniority": "Mid → Senior",
                        "skills": "modeling, dashboards, stakeholder comms",
                        "kpis": "forecast accuracy, burn rate, CAC:LTV metrics",
                        "remote": "Remote-first / FT"
                    },
                    "Legal Counsel (Contract & Compliance)": {
                        "seniority": "Senior",
                        "skills": "contract law, privacy (GDPR), vendor contracts",
                        "kpis": "contract cycle time, compliance incidents",
                        "remote": "Remote-first / FT or contract"
                    }
                }
            },
            "Operations & Admin": {
                "Operations & Admin": {
                    "Virtual Assistant / Executive Assistant": {
                        "seniority": "Junior → Mid",
                        "skills": "organization, comms, GSuite/Office",
                        "kpis": "exec satisfaction, task completion",
                        "remote": "Fully remote / FT/PT/contract"
                    },
                    "Project Manager / Scrum Master (Remote)": {
                        "seniority": "Mid → Senior",
                        "skills": "JIRA/Asana, stakeholder mgmt, facilitation",
                        "kpis": "sprint predictability, delivery on-time, team health",
                        "remote": "Remote-first / FT or contract"
                    },
                    "Procurement & Vendor Manager (Remote)": {
                        "seniority": "Mid",
                        "skills": "procurement processes, negotiation, vendor ops",
                        "kpis": "cost savings, SLAs met",
                        "remote": "Fully remote / FT or contract"
                    }
                }
            },
            "Creative, Media & Content Production": {
                "Creative, Media & Content Production": {
                    "Copywriter / Content Writer": {
                        "seniority": "Junior → Mid",
                        "skills": "strong writing, SEO, tone-of-voice, conversions",
                        "kpis": "conversion lift, content engagement, delivery",
                        "remote": "Fully remote / FT or freelance"
                    },
                    "Video Editor / Motion Designer": {
                        "seniority": "Mid",
                        "skills": "Premiere/After Effects, storytelling, compression",
                        "kpis": "video completion, engagement, turnaround time",
                        "remote": "Fully remote / Freelance/Contract"
                    },
                    "Graphic Designer": {
                        "seniority": "Junior → Mid",
                        "skills": "Figma/Illustrator, brand consistency",
                        "kpis": "asset quality, revision cycles, time-to-delivery",
                        "remote": "Fully remote / FT or freelance"
                    }
                }
            },
            "Education, Training & Coaching": {
                "Education, Training & Coaching": {
                    "Online Tutor / Learning Coach": {
                        "seniority": "Junior → Mid",
                        "skills": "subject expertise, video teaching, LMS use",
                        "kpis": "student progress, retention, NPS",
                        "remote": "Fully remote / Freelance or part-time"
                    },
                    "Instructional Designer": {
                        "seniority": "Mid",
                        "skills": "eLearning tools, curriculum design, LMS",
                        "kpis": "course completion, learner satisfaction",
                        "remote": "Fully remote / FT or contract"
                    }
                }
            },
            "Translation, Localization & Voice": {
                "Translation, Localization & Voice": {
                    "Translator / Localisation Specialist": {
                        "seniority": "Junior → Mid",
                        "skills": "bilingual fluency, CAT tools, cultural knowledge",
                        "kpis": "translation accuracy, turnaround, reviewer edits",
                        "remote": "Fully remote / Freelance"
                    },
                    "Voice-over Artist / Podcast Producer (Remote)": {
                        "seniority": "Freelance",
                        "skills": "audio editing, microphone technique",
                        "kpis": "audio quality, delivery time",
                        "remote": "Fully remote / Freelance"
                    }
                }
            },
            "QA, Compliance & Quality Assurance": {
                "QA, Compliance & Quality Assurance": {
                    "Content Moderator": {
                        "seniority": "Junior",
                        "skills": "policy understanding, quick judgement, empathy",
                        "kpis": "moderation accuracy, throughput, appeals rate",
                        "remote": "Fully remote / FT or contract"
                    },
                    "Regulatory & Compliance Analyst (Remote)": {
                        "seniority": "Mid",
                        "skills": "compliance research, reporting, policy drafting",
                        "kpis": "compliance incidents, audit findings",
                        "remote": "Remote-first / FT"
                    }
                }
            },
            "Cross-functional / Emerging Remote Roles": {
                "Cross-functional / Emerging Remote Roles": {
                    "Customer Data Privacy Officer (Remote)": {
                        "seniority": "Senior",
                        "skills": "privacy law, data maps, DPIAs",
                        "kpis": "privacy incidents, compliance audits",
                        "remote": "Remote-first / FT"
                    },
                    "Remote Program Manager (Global Ops)": {
                        "seniority": "Senior",
                        "skills": "program governance, stakeholder mgmt, cross-functional ops",
                        "kpis": "program delivery, milestone adherence",
                        "remote": "Remote-first / FT"
                    }
                }
            }
        }
        
        family_order = 0
        for family_name, categories in TAXONOMY.items():
            family_slug = slugify(family_name)
            family, _ = JobFamily.objects.get_or_create(
                name=family_name,
                defaults={'slug': family_slug, 'order': family_order}
            )
            family_order += 1
            self.stdout.write(f"  Processed Family: {family.name}")

            cat_order = 0
            for cat_name, roles_dict in categories.items():
                cat_slug = slugify(cat_name)
                category, _ = JobCategory.objects.get_or_create(
                    family=family,
                    name=cat_name,
                    defaults={'slug': cat_slug, 'order': cat_order}
                )
                cat_order += 1
                
                for role_name, metadata in roles_dict.items():
                    role_slug = slugify(role_name)
                    
                    # Ensure slug uniqueness if role name appears in multiple categories
                    if JobRole.objects.filter(slug=role_slug).exclude(category=category).exists():
                         role_slug = f"{role_slug}-{cat_slug}"
                    
                    # Parse remote string for employment_type and remote_type
                    # Example: "Fully remote / FT/PT/Contract" -> remote_type="Fully remote", employment_type="FT/PT/Contract"
                    remote_str = metadata.get('remote', '')
                    remote_type = ""
                    employment_type = ""
                    if "/" in remote_str:
                        parts = remote_str.split("/", 1)
                        remote_type = parts[0].strip()
                        employment_type = parts[1].strip()
                    else:
                        remote_type = remote_str
                        employment_type = ""

                    JobRole.objects.update_or_create(
                        category=category,
                        name=role_name,
                        defaults={
                            'slug': role_slug, 
                            'is_remote_friendly': True,
                            'seniority_level': metadata.get('seniority'),
                            'typical_skills': metadata.get('skills'),
                            'kpis': metadata.get('kpis'),
                            'employment_type': employment_type,
                            'remote_type_guidance': remote_type
                        }
                    )
        
        self.stdout.write(self.style.SUCCESS('Successfully populated Remote-First Job Taxonomy with Detailed Metadata'))
