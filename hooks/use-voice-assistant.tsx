import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface ConversationEntry {
  role: 'user' | 'ai';
  text: string;
}

interface VoiceAssistantData {
  isAwake: boolean;
  collectedData: string[];
  conversation: ConversationEntry[];
  aiResponse: string;
  resumeData?: any;
  collectedFields?: string[];
  interviewPhase?: string;
}

interface VoiceAssistantContextType {
  isMinimized: boolean;
  isActive: boolean;
  data: VoiceAssistantData | null;
  minimize: (data: VoiceAssistantData) => void;
  restore: () => void;
  dismiss: () => void;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType>({
  isMinimized: false,
  isActive: false,
  data: null,
  minimize: () => {},
  restore: () => {},
  dismiss: () => {},
});

export const VoiceAssistantProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const savedData = useRef<VoiceAssistantData | null>(null);

  const minimize = useCallback((data: VoiceAssistantData) => {
    savedData.current = data;
    setIsMinimized(true);
  }, []);

  const restore = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const dismiss = useCallback(() => {
    savedData.current = null;
    setIsMinimized(false);
  }, []);

  return (
    <VoiceAssistantContext.Provider
      value={{
        isMinimized,
        isActive: isMinimized || savedData.current !== null,
        data: savedData.current,
        minimize,
        restore,
        dismiss,
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = () => useContext(VoiceAssistantContext);
