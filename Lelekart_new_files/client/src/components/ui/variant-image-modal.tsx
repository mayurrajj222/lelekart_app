import { VariantImageGallery } from "@/components/product/variant-image-gallery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VariantImageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  variantInfo?: {
    color?: string;
    size?: string;
    price?: number;
    mrp?: number;
    stock?: number;
  };
  title?: string;
}

export function VariantImageModal({
  open,
  onOpenChange,
  images,
  variantInfo,
  title = "Variant Images"
}: VariantImageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <VariantImageGallery 
            images={images} 
            variantInfo={variantInfo}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}