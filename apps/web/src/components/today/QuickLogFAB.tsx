'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

export function QuickLogFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.div
        className="fixed bottom-[100px] right-5 z-20"
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.1 }}
      >
        <Button
          variant="coral"
          size="icon"
          className="w-14 h-14 rounded-full shadow-lg"
          onClick={() => setOpen(true)}
          aria-label="Quick log food or workout"
        >
          <Plus className="h-6 w-6" strokeWidth={1.8} />
        </Button>
      </motion.div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Quick Log"
        description="Choose what you'd like to log"
      >
        <div className="space-y-3 mt-2">
          <Button variant="secondary" className="w-full" onClick={() => setOpen(false)}>
            Log Food
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>
            Log Cardio
          </Button>
        </div>
      </Modal>
    </>
  );
}
