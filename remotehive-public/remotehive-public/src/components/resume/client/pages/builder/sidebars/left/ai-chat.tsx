import { t } from "@lingui/macro";
import { PaperPlaneRightIcon, SparkleIcon } from "@phosphor-icons/react";
import { Button, Input, ScrollArea } from "@reactive-resume/ui";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { useResumeStore } from "@/client/stores/resume";
import { aiClient, DEFAULT_MODEL } from "@/lib/ai";

export const AIChatSidebar = () => {
  const [messages, setMessages] = useState<any[]>([
    { role: "assistant", content: "Hi! I'm your AI Resume Assistant. How can I help you build your resume today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const resume = useResumeStore((state) => state.resume);
  const setValue = useResumeStore((state) => state.setValue);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Enhanced context from resume
      const context = JSON.stringify({
         basics: resume.data.basics,
         summary: resume.data.sections.summary,
         experience: resume.data.sections.experience,
         education: resume.data.sections.education,
         skills: resume.data.sections.skills,
      });
      
      const response = await aiClient.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
           { role: "system", content: `You are a helpful AI resume builder. You can suggest changes and improvements.
You have access to the user's current resume content.

If you want to update a field directly, output a JSON block like this:
\`\`\`json
{ "action": "update", "path": "basics.name", "value": "New Name" }
\`\`\`

Examples:
- Update Summary: { "action": "update", "path": "sections.summary.content", "value": "<p>Experienced developer...</p>" }
- Update Job Title: { "action": "update", "path": "basics.headline", "value": "Senior Software Engineer" }
- Update First Experience Item Summary: { "action": "update", "path": "sections.experience.items[0].summary", "value": "<p>Led team of 5...</p>" }

For complex updates (like adding new items), it is often safer to provide the text for the user or replace the whole list if you are sure.
Current Resume Context: ${context}
` },
           ...messages.map(m => ({ role: m.role, content: m.content })),
           userMsg
        ]
      });

      const aiMsg = response.choices[0].message;
      setMessages(prev => [...prev, aiMsg]);
      
      // Robust JSON parsing
      const content = aiMsg.content || "";
      let jsonBlock = null;

      // 1. Try to find markdown code block
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonBlock = jsonMatch[1];
      } else {
        // 2. Try to find raw JSON object if no markdown
        const rawJsonMatch = content.match(/\{[\s\S]*"action"[\s\S]*\}/);
        if (rawJsonMatch) {
          jsonBlock = rawJsonMatch[0];
        }
      }

      if (jsonBlock) {
         try {
           const cmd = JSON.parse(jsonBlock);
           // Handle single update or array of updates
           const updates = Array.isArray(cmd) ? cmd : [cmd];
           
           updates.forEach(update => {
             if (update.action === "update" && update.path && update.value) {
               setValue(update.path, update.value);
             }
           });
           
           // Notify user of update
           if (updates.length > 0) {
             setMessages(prev => [...prev, { role: "system", content: `⚡ Applied ${updates.length} update(s) to your resume.` }]);
           }
         } catch (e) { 
           console.error("Failed to parse AI update command:", e); 
         }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please check your API key." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
       <div className="flex items-center justify-between border-b p-4">
         <h2 className="flex items-center gap-2 font-semibold">
           <SparkleIcon className="text-purple-500" size={20}/> AI Assistant
         </h2>
       </div>
       <ScrollArea className="flex-1 p-4">
         <div className="space-y-4">
           {messages.map((m, i) => (
             <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[90%] rounded-lg p-3 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                 {m.content}
               </div>
             </div>
           ))}
           {loading && <div className="text-xs text-muted-foreground animate-pulse">Thinking...</div>}
         </div>
       </ScrollArea>
       <div className="border-t p-4">
         <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
           <Input 
             value={input} 
             onChange={e => setInput(e.target.value)} 
             placeholder="Ask to rewrite summary, fix typos..." 
             disabled={loading}
           />
           <Button type="submit" size="icon" disabled={loading}>
             <PaperPlaneRightIcon />
           </Button>
         </form>
       </div>
    </div>
  );
};
