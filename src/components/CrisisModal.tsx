import React from 'react';
import { PhoneCall, MessageSquare, Globe, HeartHandshake, X } from 'lucide-react';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  crisisMessage?: string;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ isOpen, onClose, crisisMessage }) => {
  if (!isOpen) return null;

  return (
    <div
      id="crisis-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3E3833]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crisis-modal-title"
    >
      <div
        id="crisis-modal-card"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#EAE4DD] p-6 md:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          id="crisis-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#8C847C] hover:text-[#3E3833] rounded-full hover:bg-[#F4F1EA] transition-colors"
          aria-label="Close crisis support modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#FDF0EE] text-rose-700 rounded-2xl border border-rose-200 shrink-0">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <h2 id="crisis-modal-title" className="text-xl font-serif-natural font-bold text-[#3E3833]">
              You Are Never Alone
            </h2>
            <p className="text-xs sm:text-sm text-[#5C554E] mt-1 leading-relaxed">
              {crisisMessage ||
                'Your wellbeing and safety mean everything. Free, confidential support is available 24/7 from trained compassionate professionals.'}
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* 988 Lifeline */}
          <div className="p-4 rounded-xl bg-[#FDF0EE] border border-rose-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-700 text-white rounded-full">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[#3E3833] text-sm">988 Suicide & Crisis Lifeline</p>
                <p className="text-xs text-[#7A736E]">Available 24/7 in English and Spanish across USA & Canada</p>
              </div>
            </div>
            <a
              id="call-988-link"
              href="tel:988"
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-full shadow-2xs transition-colors whitespace-nowrap"
            >
              Call 988
            </a>
          </div>

          {/* Crisis Text Line */}
          <div className="p-4 rounded-xl bg-[#F4F1EA] border border-[#EAE4DD] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#D18B63] text-white rounded-full">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[#3E3833] text-sm">Crisis Text Line</p>
                <p className="text-xs text-[#7A736E]">Free, confidential 24/7 crisis counseling via text</p>
              </div>
            </div>
            <a
              id="text-home-link"
              href="sms:741741?&body=HOME"
              className="px-4 py-2 bg-[#D18B63] hover:bg-[#BF7851] text-white text-xs font-semibold rounded-full shadow-2xs transition-colors whitespace-nowrap"
            >
              Text HOME
            </a>
          </div>

          {/* International Resources */}
          <div className="p-4 rounded-xl bg-[#F1F3EF] border border-[#EAE4DD] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#5A6B5D] text-white rounded-full">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-[#3E3833] text-sm">International Helplines</p>
                <p className="text-xs text-[#7A736E]">Find confidential support services in your country</p>
              </div>
            </div>
            <a
              id="international-helpline-link"
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#5A6B5D] hover:bg-[#4A594D] text-white text-xs font-semibold rounded-full shadow-2xs transition-colors whitespace-nowrap"
            >
              Find Hotline
            </a>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            id="close-crisis-modal-button"
            onClick={onClose}
            className="px-5 py-2 bg-[#F4F1EA] hover:bg-[#EDE9E1] text-[#3E3833] text-xs font-medium rounded-full border border-[#EAE4DD] transition-colors"
          >
            I'm safe, return to journal
          </button>
        </div>
      </div>
    </div>
  );
};
