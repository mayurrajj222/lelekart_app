import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TruckIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

interface PendingReturn {
  id: number;
  orderId: number;
  orderItemId: number | null;
  buyerId: number;
  status: string;
  productName?: string | null;
  buyerName?: string | null;
  orderTotal?: number | null;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone?: string;
  } | null;
}

const PAGE_SIZE = 10;

export default function PendingShiprocketReturns() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);
  const [courierCompany, setCourierCompany] = React.useState<string>("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [activeReturnId, setActiveReturnId] = React.useState<number | null>(
    null
  );
  const [couriersByReturn, setCouriersByReturn] = React.useState<
    Record<number, any[]>
  >({});
  const [couriersLoading, setCouriersLoading] = React.useState(false);
  const [couriersError, setCouriersError] = React.useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["shiprocket", "returns", "pending", page],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/shiprocket/returns/pending?page=${page}&limit=${PAGE_SIZE}`
      );
      return res.json();
    },
    staleTime: 10_000,
  });

  const assignMutation = useMutation({
    mutationFn: async (returnRequestId: number) => {
      return apiRequest("POST", "/api/shiprocket/returns/ship", {
        returnRequestId,
        courierCompany:
          courierCompany === "auto" || courierCompany === ""
            ? undefined
            : courierCompany,
      });
    },
    onSuccess: async () => {
      toast({ title: "Return shipment created" });
      setDialogOpen(false);
      setActiveReturnId(null);
      setCourierCompany("");
      await queryClient.invalidateQueries({
        queryKey: ["shiprocket", "returns", "pending"],
      });
    },
    onError: async (err: any) => {
      const body = await err?.response?.json?.();
      toast({
        title: "Failed to create return shipment",
        description: body?.error || err.message,
        variant: "destructive",
      });
    },
  });

  const returns: PendingReturn[] = data?.returns || [];
  const total: number = data?.total || 0;
  const totalPages = Math.max(data?.totalPages || 1, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TruckIcon className="h-4 w-4" />
          Pending Returns
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading pending
              returns...
            </div>
          ) : returns.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No pending return requests.
            </div>
          ) : (
            <div className="space-y-3">
              {returns.map((rr) => (
                <div
                  key={rr.id}
                  className="flex items-center justify-between border rounded-md p-3"
                >
                  <div className="text-sm">
                    <div className="font-medium">
                      Return #{rr.id} for Order #{rr.orderId}
                    </div>
                    <div className="text-muted-foreground">
                      {rr.productName || "Item"} • {rr.buyerName || "Buyer"}
                    </div>
                    {rr.shippingAddress && (
                      <div className="text-xs text-muted-foreground">
                        {rr.shippingAddress.address}, {rr.shippingAddress.city},{" "}
                        {rr.shippingAddress.state} -{" "}
                        {rr.shippingAddress.pincode}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog
                      open={dialogOpen && activeReturnId === rr.id}
                      onOpenChange={(o) => {
                        setDialogOpen(o);
                        if (!o) {
                          setActiveReturnId(null);
                          setCourierCompany("");
                          setCouriersError(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => {
                            setActiveReturnId(rr.id);
                            setDialogOpen(true);
                            if (!couriersByReturn[rr.id]) {
                              setCouriersLoading(true);
                              setCouriersError(null);
                              apiRequest(
                                "GET",
                                `/api/shiprocket/couriers?orderId=${rr.orderId}&return=1`
                              )
                                .then((res) => res.json())
                                .then((data) => {
                                  const list = Array.isArray(data?.couriers)
                                    ? data.couriers
                                    : [];
                                  setCouriersByReturn((prev) => ({
                                    ...prev,
                                    [rr.id]: list,
                                  }));
                                })
                                .catch((e: any) => {
                                  setCouriersError(
                                    e?.message || "Failed to load couriers"
                                  );
                                })
                                .finally(() => setCouriersLoading(false));
                            }
                          }}
                        >
                          Select Courier
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Select Courier</DialogTitle>
                          <DialogDescription>
                            Choose a courier company ID to assign now, or leave
                            empty to auto-assign later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-2">
                          {couriersLoading ? (
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />{" "}
                              Loading couriers...
                            </div>
                          ) : couriersError ? (
                            <div className="text-sm text-red-600">
                              {couriersError}
                            </div>
                          ) : (
                            <Select
                              value={courierCompany}
                              onValueChange={setCourierCompany}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select courier (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Auto later</SelectItem>
                                {(couriersByReturn[rr.id] || []).map(
                                  (c: any) => (
                                    <SelectItem
                                      key={String(c.courier_company_id)}
                                      value={String(c.courier_company_id)}
                                    >
                                      {c.courier_name}
                                      {c.rate ? ` — ₹${c.rate}` : ""}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDialogOpen(false);
                              setActiveReturnId(null);
                              setCourierCompany("");
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => {
                              if (activeReturnId)
                                assignMutation.mutate(activeReturnId);
                            }}
                            disabled={assignMutation.isPending}
                          >
                            {assignMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Create Shipment"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Page {page} of {totalPages} • {total} total
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
