import { TooltipProvider } from "@reactive-resume/ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import { helmetContext } from "@/client/constants/helmet";
import { queryClient } from "@/client/libs/query-client";
import { DialogProvider } from "@/client/providers/dialog";
import { LocaleProvider } from "@/client/providers/locale";
import { ThemeProvider } from "@/client/providers/theme";
import { Toaster } from "@/client/providers/toaster";

export const ResumeProviders = ({ children }: { children: React.ReactNode }) => (
  <LocaleProvider>
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TooltipProvider>
              <DialogProvider>
                {children}
                <Toaster />
              </DialogProvider>
            </TooltipProvider>
          </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </LocaleProvider>
);
