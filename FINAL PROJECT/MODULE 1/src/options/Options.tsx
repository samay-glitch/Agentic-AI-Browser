import { useState } from 'react';
import { Bot, User, Settings, FileText } from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TemplatesPage } from '@/pages/TemplatesPage';

export function Options() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-bg-base text-text-base flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-8">
        
        <header className="flex items-center gap-3">
          <Bot className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Agentic AI Settings</h1>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="profile" className="flex gap-2">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex gap-2">
              <FileText className="w-4 h-4" /> Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
          </TabsList>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'profile' && (
                <TabsContent value="profile" className="mt-0 outline-none">
                  <ProfilePage />
                </TabsContent>
              )}

              {activeTab === 'templates' && (
                <TabsContent value="templates" className="mt-0 outline-none">
                  <TemplatesPage />
                </TabsContent>
              )}

              {activeTab === 'settings' && (
                <TabsContent value="settings" className="mt-0 outline-none">
                  <SettingsPage />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
}
