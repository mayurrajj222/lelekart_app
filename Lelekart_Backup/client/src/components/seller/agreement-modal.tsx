import { useState } from "react";
import { SellerAgreement } from "@shared/schema";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface AgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: SellerAgreement | null;
  onAccept: (agreementId: number) => void;
  isAccepting: boolean;
  canClose?: boolean;
}

export function AgreementModal({
  open,
  onOpenChange,
  agreement,
  onAccept,
  isAccepting,
  canClose = true,
}: AgreementModalProps) {
  const [hasRead, setHasRead] = useState(false);

  if (!agreement) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={canClose ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Seller Agreement - Version {agreement.version}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <ScrollArea className="h-[50vh] rounded-md border p-4">
            <ReactMarkdown className="prose">
              {agreement.content}
            </ReactMarkdown>
          </ScrollArea>
        </div>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="agreement-checkbox"
            checked={hasRead}
            onCheckedChange={(checked) => setHasRead(!!checked)}
          />
          <label
            htmlFor="agreement-checkbox"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and accept the terms of this agreement
          </label>
        </div>

        <DialogFooter>
          {canClose && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          <Button
            onClick={() => onAccept(agreement.id)}
            disabled={!hasRead || isAccepting}
          >
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              "Accept & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}