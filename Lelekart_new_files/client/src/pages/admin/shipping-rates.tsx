import React from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, DollarSign, Edit, Trash2, GlobeIcon } from "lucide-react";

const ShippingRatesPage = () => {
  // Sample data - in a real app, this would come from an API
  const shippingRates = [
    {
      id: 1,
      name: "Standard Shipping",
      zone: "All India",
      minWeight: "0kg",
      maxWeight: "1kg",
      price: "₹80",
      estimatedDelivery: "3-5 days",
      active: true,
    },
    {
      id: 2,
      name: "Standard Shipping",
      zone: "All India",
      minWeight: "1kg",
      maxWeight: "5kg",
      price: "₹120",
      estimatedDelivery: "3-5 days",
      active: true,
    },
    {
      id: 3,
      name: "Express Shipping",
      zone: "Metro Cities",
      minWeight: "0kg",
      maxWeight: "2kg",
      price: "₹150",
      estimatedDelivery: "1-2 days",
      active: true,
    },
    {
      id: 4,
      name: "Express Shipping",
      zone: "Metro Cities",
      minWeight: "2kg",
      maxWeight: "10kg",
      price: "₹250",
      estimatedDelivery: "1-2 days",
      active: true,
    },
    {
      id: 5,
      name: "Economy Shipping",
      zone: "Remote Areas",
      minWeight: "0kg",
      maxWeight: "2kg",
      price: "₹120",
      estimatedDelivery: "5-7 days",
      active: false,
    },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Shipping Rates
            </h1>
            <p className="text-muted-foreground">
              Manage shipping rates by zone and weight
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Shipping Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Shipping Rate</DialogTitle>
                <DialogDescription>
                  Create a new shipping rate based on zone and weight range.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Standard Shipping"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="zone" className="text-right">
                    Zone
                  </Label>
                  <Input
                    id="zone"
                    placeholder="All India"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="min-weight" className="text-right">
                    Min Weight
                  </Label>
                  <Input
                    id="min-weight"
                    placeholder="0kg"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="max-weight" className="text-right">
                    Max Weight
                  </Label>
                  <Input
                    id="max-weight"
                    placeholder="5kg"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input id="price" placeholder="₹100" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="delivery" className="text-right">
                    Est. Delivery
                  </Label>
                  <Input
                    id="delivery"
                    placeholder="3-5 days"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save Rate</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Shipping Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Shipping Rates</CardTitle>
            <CardDescription>
              Rates automatically applied based on customer location and cart
              weight
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Weight Range</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Est. Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <GlobeIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                        {rate.zone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rate.minWeight} - {rate.maxWeight}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        {rate.price}
                      </div>
                    </TableCell>
                    <TableCell>{rate.estimatedDelivery}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${rate.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                      >
                        {rate.active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ShippingRatesPage;
