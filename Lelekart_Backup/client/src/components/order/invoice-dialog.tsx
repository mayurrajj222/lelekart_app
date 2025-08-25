import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
}

export function InvoiceDialog({
  open,
  onOpenChange,
  orderId,
}: InvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [invoiceHtml, setInvoiceHtml] = useState<string>("");
  const { toast } = useToast();

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/orders/${orderId}/invoice?format=html`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoice");
      }

      const html = await response.text();
      setInvoiceHtml(html);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}/invoice`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `invoice-order-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Invoice downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Error",
        description:
          "Could not open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${orderId}</title>
          <style>
            body { margin: 0; padding: 20px; }
            @media print {
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          ${invoiceHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Fix: Change useState to useEffect for the fetch effect
  useEffect(() => {
    if (open) {
      fetchInvoice();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Invoice #{orderId}</DialogTitle>
          <DialogDescription>
            View and manage your order invoice. You can print or download the
            invoice as PDF.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={loading || !invoiceHtml}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
        <ScrollArea className="h-[calc(90vh-200px)] rounded-md border">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : invoiceHtml ? (
            <div
              className="p-4"
              dangerouslySetInnerHTML={{ __html: invoiceHtml }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Failed to load invoice
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
