import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { calculateBasePrice, extractGstAmount } from "@shared/utils/gst";

interface GstRateFieldProps {
  form: any;
  getSelectedCategoryGstRate: () => number;
}

export function GstRateField({ form, getSelectedCategoryGstRate }: GstRateFieldProps) {
  return (
    <>
      {/* GST Rate Field */}
      <FormField
        control={form.control}
        name="gstRate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              Custom GST Rate (%)
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      <Info className="h-4 w-4 text-blue-500" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Optional: Specify a custom GST rate for this product.</p>
                    <p className="mt-1">If left empty, the default GST rate for the selected category will be used.</p>
                    <p className="mt-1 font-medium">Current category default: {getSelectedCategoryGstRate()}%</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  placeholder={`e.g. ${getSelectedCategoryGstRate()}`} 
                  type="number" 
                  className="pr-8" 
                  {...field} 
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground pointer-events-none">
                  %
                </div>
              </div>
            </FormControl>
            <FormDescription>
              Leave blank to use category default rate ({getSelectedCategoryGstRate()}%)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* GST Information Display */}
      {(form.watch("price") > 0 && form.watch("category")) && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-center mb-2">
            <Info className="h-5 w-5 text-blue-500 mr-2" />
            <h4 className="font-medium text-blue-700">GST Information</h4>
          </div>
          <div className="space-y-1 text-sm">
            {(() => {
              // Get the selling price (which includes GST)
              const sellingPrice = parseInt(form.getValues("price")) || 0;
              const customGstRate = form.getValues("gstRate");
              const gstRate = customGstRate !== undefined && customGstRate !== null && customGstRate !== "" 
                ? parseFloat(customGstRate.toString()) 
                : getSelectedCategoryGstRate();
              
              // Calculate base price by extracting GST
              const basePrice = calculateBasePrice(sellingPrice, gstRate);
              const gstAmount = extractGstAmount(sellingPrice, gstRate);
              
              const isCustomRate = form.getValues("gstRate") !== undefined && form.getValues("gstRate") !== null && form.getValues("gstRate") !== "";
              
              return (
                <>
                  <p className="text-slate-600">
                    <span className="font-medium">Category:</span> {form.watch("category")}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-medium">Category Default GST Rate:</span> {getSelectedCategoryGstRate()}%
                  </p>
                  {isCustomRate && (
                    <p className="text-slate-600 font-medium text-blue-700">
                      <span className="font-medium">Custom GST Rate:</span> {gstRate}%
                    </p>
                  )}
                  <p className="text-slate-600">
                    <span className="font-medium">Selling Price (including GST):</span> ₹{sellingPrice.toFixed(2)}
                  </p>
                  <p className="text-slate-600">
                    <span className="font-medium">GST Amount:</span> ₹{gstAmount.toFixed(2)}
                  </p>
                  <div className="h-px bg-blue-200 my-2"></div>
                  <p className="font-medium text-blue-800">
                    Base Price (excluding GST): ₹{basePrice.toFixed(2)}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}