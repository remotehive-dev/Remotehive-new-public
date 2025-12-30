import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: "How do I apply for jobs?",
    answer: "You can apply for jobs by creating a profile and clicking the 'Apply' button on any job listing. Some jobs may redirect you to the company's career page."
  },
  {
    question: "Is RemoteHive free for job seekers?",
    answer: "Yes! RemoteHive is completely free for job seekers. You can create a profile, upload your resume, and apply to unlimited jobs at no cost."
  },
  {
    question: "How do I post a job?",
    answer: "To post a job, you need to create an employer account. Once logged in, click on 'Post a Job' in your dashboard. We offer both free and premium posting options."
  },
  {
    question: "Are all jobs 100% remote?",
    answer: "Most jobs on RemoteHive are fully remote. However, some listings may require specific time zones or occasional travel. Check the job description for details."
  },
  {
    question: "How can I edit my profile?",
    answer: "Log in to your account and navigate to the Dashboard > Profile section. There you can update your experience, skills, and resume."
  }
];

export function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-center text-slate-900">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg border-slate-200 bg-white">
      <button
        className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-slate-900">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-slate-600">
          {answer}
        </div>
      )}
    </div>
  );
}
