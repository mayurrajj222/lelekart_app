import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceSearchProps {
  onSearch: (query: string) => void;
  className?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: 'spring',
      damping: 25,
      stiffness: 500
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.8,
    transition: { duration: 0.2 } 
  }
};

const pulseVariants = {
  inactive: { scale: 1 },
  active: { 
    scale: [1, 1.1, 1],
    boxShadow: [
      '0 0 0 0 rgba(220, 38, 38, 0)',
      '0 0 0 10px rgba(220, 38, 38, 0.1)',
      '0 0 0 0 rgba(220, 38, 38, 0)'
    ],
    transition: { 
      repeat: Infinity, 
      duration: 1.5 
    }
  }
};

const fadeVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

/**
 * VoiceSearch component
 * Provides voice search functionality using the Web Speech API
 */
export function VoiceSearch({ onSearch, className }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErrorMessage('Voice search is not supported in your browser');
      return;
    }

    // Create speech recognition instance
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    // Configure speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Default language
      
      // Handle results
      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptValue = result[0].transcript;
        
        setTranscript(transcriptValue);
        
        // If result is final, stop listening
        if (result.isFinal) {
          stopListening();
          processVoiceQuery(transcriptValue);
        }
      };
      
      // Handle errors
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setErrorMessage(`Error: ${event.error}`);
        stopListening();
      };
      
      // Handle end of speech
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);
  
  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  // Start listening for voice input
  const startListening = () => {
    setErrorMessage(null);
    setTranscript('');
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition', error);
        setErrorMessage('Failed to start voice search. Please try again.');
      }
    }
  };
  
  // Stop listening for voice input
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition', error);
      }
    }
    setIsListening(false);
  };
  
  // Clear the transcript
  const clearTranscript = () => {
    setTranscript('');
    setErrorMessage(null);
  };
  
  // Process the voice query
  const processVoiceQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    
    try {
      console.log('Processing voice query:', query.trim());
      
      // Call the onSearch callback to handle the search
      await onSearch(query.trim());
      
      // Show toast notification
      toast({
        title: 'Voice Search',
        description: `Searching for: "${query.trim()}"`,
        duration: 3000
      });
    } catch (error) {
      console.error('Error processing voice query', error);
      setErrorMessage('Failed to process your search. Please try again.');
      
      toast({
        title: 'Voice Search Error',
        description: error instanceof Error ? error.message : 'Failed to process your search query',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Manually submit the current transcript
  const submitTranscript = () => {
    if (transcript.trim()) {
      processVoiceQuery(transcript.trim());
    }
  };
  
  return (
    <div className={cn("voice-search relative", className)}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="flex flex-col items-center"
      >
        {/* Test button in development - only visible in development */}
        {process.env.NODE_ENV === 'development' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs"
            onClick={() => processVoiceQuery("show me women clothes under 1000 rupees")}
          >
            Test AI Search
          </Button>
        )}
        {/* Voice button */}
        <motion.div
          variants={pulseVariants}
          animate={isListening ? "active" : "inactive"}
          className="relative mb-3"
        >
          <Button 
            variant={isListening ? "destructive" : "default"}
            size="icon" 
            className={cn(
              "h-14 w-14 rounded-full shadow-md", 
              isListening ? "bg-red-600 hover:bg-red-700" : "",
              errorMessage ? "bg-gray-400 hover:bg-gray-500 cursor-not-allowed" : ""
            )}
            onClick={toggleListening}
            disabled={!!errorMessage || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>
          
          {isListening && (
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-medium text-red-600">
              Listening...
            </span>
          )}
        </motion.div>
        
        {/* Transcript display */}
        <AnimatePresence>
          {transcript && (
            <motion.div
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative w-full max-w-md mb-4"
            >
              <div className="bg-white p-3 rounded-lg shadow-md text-gray-800 relative">
                <p className="pr-6">{transcript}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 opacity-70 hover:opacity-100"
                  onClick={clearTranscript}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex justify-end mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={clearTranscript}
                >
                  Clear
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={submitTranscript}
                  disabled={isProcessing}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Search
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="text-red-500 text-sm text-center mb-3"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Instructions */}
        <motion.p 
          variants={fadeVariants}
          initial="hidden"
          animate="visible"
          className="text-sm text-center text-gray-600 max-w-md"
        >
          {!errorMessage ? (
            <>Click the microphone and speak to search. Try saying <em>"Show me red dresses"</em> or <em>"Find laptops under 50000 rupees"</em></>
          ) : (
            <>Voice search is not available. Please use the text search instead.</>
          )}
        </motion.p>
      </motion.div>
    </div>
  );
}