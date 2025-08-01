import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Save, Trash2, Check } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

export interface ProductVariant {
  id?: number;
  productId?: number;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
}

interface VariantRowProps {
  variant: ProductVariant;
  isEditing: boolean;
  onUpdate: (field: keyof ProductVariant, value: any) => void;
  onSave: () => void;
  onDelete: () => void;
}

function VariantRow({ variant, isEditing, onUpdate, onSave, onDelete }: VariantRowProps) {
  if (isEditing) {
    return (
      <TableRow className="bg-blue-50/40 hover:bg-blue-50/60">
        <TableCell>
          <Input 
            placeholder="SKU" 
            value={variant.sku || ''}
            onChange={(e) => onUpdate('sku', e.target.value)}
            className="h-9"
          />
        </TableCell>
        <TableCell>
          <Input 
            placeholder="Red" 
            value={variant.color || ''}
            onChange={(e) => onUpdate('color', e.target.value)}
            className="h-9"
          />
        </TableCell>
        <TableCell>
          <Input 
            placeholder="S, M" 
            value={variant.size || ''}
            onChange={(e) => onUpdate('size', e.target.value)}
            className="h-9"
          />
        </TableCell>
        <TableCell>
          <Input 
            type="number"
            min="0"
            placeholder="0" 
            value={variant.price || 0}
            onChange={(e) => onUpdate('price', Number(e.target.value))}
            className="h-9"
          />
        </TableCell>
        <TableCell>
          <Input 
            type="number"
            min="0"
            placeholder="0" 
            value={variant.mrp || 0}
            onChange={(e) => onUpdate('mrp', Number(e.target.value))}
            className="h-9"
          />
        </TableCell>
        <TableCell>
          <Input 
            type="number"
            min="0"
            placeholder="0"
            value={variant.stock || 0}
            onChange={(e) => onUpdate('stock', Number(e.target.value))}
            className="h-9"
          />
        </TableCell>
        <TableCell>
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onSave}
              className="h-9 gap-1 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }
  
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">{variant.sku}</TableCell>
      <TableCell>{variant.color || '—'}</TableCell>
      <TableCell>{variant.size || '—'}</TableCell>
      <TableCell>₹{variant.price}</TableCell>
      <TableCell>₹{variant.mrp || '—'}</TableCell>
      <TableCell>{variant.stock}</TableCell>
      <TableCell>
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-red-600 h-8 w-8 hover:bg-red-50"
            title="Delete Variant"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface MultiRowVariantFormProps {
  existingVariants: ProductVariant[];
  draftVariants: ProductVariant[];
  newVariant: ProductVariant | null;
  onAddNewVariant: () => void;
  onSaveNewVariant: (variant: ProductVariant) => void;
  onCancelNewVariant: () => void;
  onUpdateNewVariant: (field: keyof ProductVariant, value: any) => void;
  onDeleteVariant: (id?: number) => void;
}

export function MultiRowVariantForm({
  existingVariants,
  draftVariants,
  newVariant,
  onAddNewVariant,
  onSaveNewVariant,
  onCancelNewVariant,
  onUpdateNewVariant,
  onDeleteVariant
}: MultiRowVariantFormProps) {
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>MRP</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-center">
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddNewVariant}
                  className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50 gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add More Variant
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Show existing variants */}
          {existingVariants.map((variant) => (
            <VariantRow
              key={`existing-${variant.id || variant.sku}`}
              variant={variant}
              isEditing={false}
              onUpdate={() => {}}
              onSave={() => {}}
              onDelete={() => onDeleteVariant(variant.id)}
            />
          ))}
          
          {/* Show draft variants */}
          {draftVariants.map((variant) => (
            <VariantRow
              key={`draft-${variant.id || variant.sku}`}
              variant={variant}
              isEditing={false}
              onUpdate={() => {}}
              onSave={() => {}}
              onDelete={() => onDeleteVariant(variant.id)}
            />
          ))}
          
          {/* Show current editing variant if any */}
          {newVariant && (
            <TableRow className="bg-blue-50/40 hover:bg-blue-50/60">
              <TableCell>
                <Input 
                  placeholder="SKU" 
                  value={newVariant.sku || ''}
                  onChange={(e) => onUpdateNewVariant('sku', e.target.value)}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input 
                  placeholder="Red" 
                  value={newVariant.color || ''}
                  onChange={(e) => onUpdateNewVariant('color', e.target.value)}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input 
                  placeholder="S, M" 
                  value={newVariant.size || ''}
                  onChange={(e) => onUpdateNewVariant('size', e.target.value)}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number"
                  min="0"
                  placeholder="0" 
                  value={newVariant.price || 0}
                  onChange={(e) => onUpdateNewVariant('price', Number(e.target.value))}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number"
                  min="0"
                  placeholder="0" 
                  value={newVariant.mrp || 0}
                  onChange={(e) => onUpdateNewVariant('mrp', Number(e.target.value))}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newVariant.stock || 0}
                  onChange={(e) => onUpdateNewVariant('stock', Number(e.target.value))}
                  className="h-9"
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => onSaveNewVariant(newVariant)}
                    className="h-9 gap-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onCancelNewVariant}
                    className="h-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}