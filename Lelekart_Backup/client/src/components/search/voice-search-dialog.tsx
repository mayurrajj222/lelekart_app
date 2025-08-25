import { useState, useEffect, useRef } from "react";
import { Mic, X, StopCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Define types for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface VoiceSearchDialogProps {
  onSearch: (query: string) => void;
  className?: string;
  buttonText?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  showIcon?: boolean;
}

export function VoiceSearchDialog({
  onSearch,
  className,
  buttonText = "Search with voice",
  buttonVariant = "outline",
  buttonSize = "default",
  showIcon = true,
}: VoiceSearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Speech API recognition instance
  const recognitionRef = useRef<any>(null);

  // Check if browser supports speech recognition
  const isSpeechRecognitionSupported = () => {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  };

  // Set up speech recognition
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }

    // Clear any existing recognition instance
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Initialize speech recognition
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setProgress(0);
      startTimer();
    };

    recognition.onend = () => {
      setIsListening(false);
      stopTimer();

      // If we have a transcript, submit the search
      if (transcript.trim()) {
        submitSearch();
      }
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const currentTranscript = event.results[current][0].transcript;
      setTranscript(currentTranscript);
    };

    recognition.onerror = (event: any) => {
      setError(`Error: ${event.error}`);
      setIsListening(false);
      stopTimer();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopTimer();
    };
  }, []);

  // Auto-stop recording after 10 seconds
  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Reset progress
    setProgress(0);

    // Update progress bar every 100ms for 10 seconds
    const interval = 100;
    const maxTime = 10000; // 10 seconds
    const steps = maxTime / interval;
    let currentStep = 0;

    timerRef.current = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        stopListening();
      }
    }, interval);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startListening = () => {
    setTranscript("");
    setError(null);

    if (!recognitionRef.current) {
      setError("Speech recognition is not initialized.");
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Error starting speech recognition:", err);
      setError("Failed to start speech recognition. Please try again.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const submitSearch = () => {
    if (transcript.trim()) {
      onSearch(transcript.trim());
      setIsOpen(false);
    }
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      setTranscript("");
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={className}
          aria-label="Search with voice"
        >
          {showIcon && <Mic className="h-4 w-4 text-black" />}
          {buttonText && <span className="ml-2">{buttonText}</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Search</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {error ? (
            <div className="text-center text-destructive mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : null}

          <div className="relative mb-6">
            <div
              className={cn(
                "h-24 w-24 rounded-full flex items-center justify-center transition-all",
                isListening
                  ? "bg-red-100 border-2 border-red-500 animate-pulse"
                  : "bg-gray-100 border-2 border-gray-300"
              )}
            >
              {isListening ? (
                <StopCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Mic className="h-12 w-12 text-black" />
              )}
            </div>

            {isListening && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="min-h-[80px] w-full px-4 py-2 border rounded-md bg-muted/50 mb-4 overflow-auto">
            {transcript ? (
              <p className="text-center">{transcript}</p>
            ) : (
              <p className="text-center text-muted-foreground">
                {isListening
                  ? "Listening..."
                  : "Press the button and start speaking"}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            {isListening ? (
              <Button
                type="button"
                variant="destructive"
                onClick={stopListening}
              >
                Stop
              </Button>
            ) : (
              <Button
                type="button"
                onClick={startListening}
                disabled={!isSpeechRecognitionSupported()}
              >
                {isSpeechRecognitionSupported()
                  ? "Start speaking"
                  : "Not supported"}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={submitSearch}
              disabled={!transcript.trim()}
            >
              Search
            </Button>
          </div>
        </div>

        <DialogFooter className="text-xs text-gray-500">
          Speak clearly into your microphone
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
