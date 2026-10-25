import React, { useState } from 'react';
import { GardenConfig } from '../../types/garden';
import { DEFAULT_CONFIG } from '../../utils/constants';

interface CustomizeModalProps {
  isOpen: boolean;
  config: GardenConfig;
  onSave: (newConfig: GardenConfig) => void;
  onClose: () => void;
}

export const CustomizeModal: React.FC<CustomizeModalProps> = ({
  isOpen,
  config,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<GardenConfig>({ ...config });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_CONFIG });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel max-w-xl w-full rounded-3xl p-6 relative max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between border-b border-amber-400/20 pb-3 mb-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
              Personalization Studio
            </span>
            <h2 className="font-cinzel text-lg sm:text-xl font-bold gold-gradient-text">
              Customize Shubham's Garden
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="glass-pill w-8 h-8 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 overflow-y-auto custom-scrollbar pr-1 text-xs sm:text-sm">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-amber-200 text-xs mb-1">Recipient Name</label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-amber-200 text-xs mb-1">Milestone (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 25th"
                value={formData.optionalAge}
                onChange={(e) => setFormData({ ...formData, optionalAge: e.target.value })}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-amber-200 text-xs mb-1">Opening Gate Greeting</label>
            <textarea
              rows={2}
              value={formData.openingGreeting}
              onChange={(e) => setFormData({ ...formData, openingGreeting: e.target.value })}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-amber-200 text-xs mb-1">Grand Finale Brother's Tribute Letter</label>
            <textarea
              rows={3}
              value={formData.finaleMessage}
              onChange={(e) => setFormData({ ...formData, finaleMessage: e.target.value })}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-amber-200 text-xs mb-1">Keepsake I Story (Memory Pavilion)</label>
            <textarea
              rows={2}
              value={formData.memories[0]?.body || ''}
              onChange={(e) => {
                const newMems = [...formData.memories];
                if (newMems[0]) newMems[0].body = e.target.value;
                setFormData({ ...formData, memories: newMems });
              }}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="glass-pill px-3.5 py-2 rounded-full text-xs text-slate-300 hover:text-white"
            >
              Reset Defaults
            </button>
            <button type="submit" className="btn-gold px-5 py-2 rounded-full text-xs sm:text-sm">
              Save & Update Garden
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
