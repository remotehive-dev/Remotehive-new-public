import { t } from "@lingui/macro";
import { ListIcon, SquaresFourIcon } from "@phosphor-icons/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@reactive-resume/ui";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useLocalStorage } from "usehooks-ts";

import { GridView } from "./_layouts/grid";
import { ListView } from "./_layouts/list";

type Layout = "grid" | "list";

export const ResumesPage = () => {
  const [layout, setLayout] = useLocalStorage<Layout>("dashboard-layout", "grid", {
    initializeWithValue: true,
  });

  return (
    <>
      <Helmet>
        <title>
          {t`Resumes`} - {t`Reactive Resume`}
        </title>
      </Helmet>

      <div className="max-w-7xl mx-auto py-6 px-6">
        <Tabs
          value={layout}
          className="space-y-4"
          onValueChange={(value) => {
            setLayout(value as Layout);
          }}
        >
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
                {t`Resumes`}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t`Create and manage your resumes.`}
              </p>
            </motion.div>

            <TabsList className="bg-white/50 border border-white/50 shadow-sm p-1">
              <TabsTrigger value="grid" className="size-8 p-0 sm:h-8 sm:w-auto sm:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600">
                <SquaresFourIcon />
                <span className="ml-2 hidden sm:block">{t`Grid`}</span>
              </TabsTrigger>
              <TabsTrigger value="list" className="size-8 p-0 sm:h-8 sm:w-auto sm:px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600">
                <ListIcon />
                <span className="ml-2 hidden sm:block">{t`List`}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="grid" className="mt-0 outline-none">
            <GridView />
          </TabsContent>
          <TabsContent value="list" className="mt-0 outline-none">
            <ListView />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};
