import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AuthContext } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CreditCard, Check, Copy, Gift, Clock, CopyCheck, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

type GiftCard = {
  id: number;
  code: string;
  initialValue: number;
  currentBalance: number;
  userId: number | null;
  senderUserId: number | null;
  recipientEmail: string | null;
  recipientName: string | null;
  expiryDate: string | null;
  status: string;
  templateId: number | null;
  createdAt: string;
  updatedAt: string;
};

export default function GiftCardsPage() {
  const [activeTab, setActiveTab] = useState("my-cards");
  const [showCheckBalanceDialog, setShowCheckBalanceDialog] = useState(false);
  const [showBuyGiftCardDialog, setShowBuyGiftCardDialog] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [checkedCard, setCheckedCard] = useState<GiftCard | null>(null);
  const [giftCardAmount, setGiftCardAmount] = useState<number>(500);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [personalizedMessage, setPersonalizedMessage] = useState("");
  
  const authContext = useContext(AuthContext);
  const { toast } = useToast();
  
  // Get the authenticated user
  const user = authContext?.user;
  const userId = user?.id;
  
  // Fetch user gift cards
  const { data: giftCards = [], isLoading: isLoadingGiftCards } = useQuery({
    queryKey: [`/api/gift-cards/user/${userId}`],
    queryFn: async () => {
      const response = await fetch(`/api/gift-cards/user/${userId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch gift cards');
      }
      return response.json();
    },
    enabled: !!userId,
  });
  
  // Copy gift card code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Gift card code copied to clipboard",
    });
  };
  
  // Check gift card balance
  const checkBalance = async () => {
    if (!giftCardCode) {
      toast({
        title: "Error",
        description: "Please enter a gift card code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Loading toast
      toast({
        title: "Checking Balance",
        description: "Verifying gift card code...",
      });
      
      // Call the actual API endpoint
      const response = await fetch('/api/gift-cards/check-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: giftCardCode }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check gift card balance');
      }
      
      const cardData = await response.json();
      
      // Create a card object from the API response
      const card: GiftCard = {
        id: 0, // The API doesn't return the ID for security
        code: giftCardCode,
        initialValue: cardData.initialValue,
        currentBalance: cardData.currentBalance,
        userId: null,
        senderUserId: null,
        recipientEmail: null,
        recipientName: null,
        expiryDate: cardData.expiryDate,
        status: cardData.status,
        templateId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setCheckedCard(card);
    } catch (error) {
      console.error('Error checking balance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to check gift card balance",
        variant: "destructive",
      });
    }
  };
  
  // Handle purchase of new gift card
  const handleBuyGiftCard = async () => {
    if (!recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter recipient email",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Coming Soon",
      description: "The gift card purchase feature will be available soon!",
    });
    
    setShowBuyGiftCardDialog(false);
  };
  
  // Loading state
  if (isLoadingGiftCards) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F8F5E4]">
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Gift Cards</h1>
              <p className="text-muted-foreground">Manage and purchase gift cards</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCheckBalanceDialog(true)}
              >
                Check Balance
              </Button>
              <Button 
                onClick={() => setShowBuyGiftCardDialog(true)}
              >
                Buy Gift Card
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="my-cards" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex bg-[#F8F5E4]">
              <TabsTrigger value="my-cards">My Gift Cards</TabsTrigger>
              <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-cards" className="space-y-6 mt-6">
              {giftCards.length > 0 ? (
                <Card className="border shadow-sm bg-[#F8F5E4]">
                  <CardHeader>
                    <CardTitle>My Gift Cards</CardTitle>
                    <CardDescription>Gift cards associated with your account</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table className="bg-[#F8F5E4]">
                      <TableHeader>
                        <TableRow className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                          <TableHead className="bg-[#F8F5E4]">Gift Card Code</TableHead>
                          <TableHead className="bg-[#F8F5E4]">Initial Value</TableHead>
                          <TableHead className="bg-[#F8F5E4]">Current Balance</TableHead>
                          <TableHead className="bg-[#F8F5E4]">Expiry Date</TableHead>
                          <TableHead className="bg-[#F8F5E4]">Status</TableHead>
                          <TableHead className="text-right bg-[#F8F5E4]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {giftCards.map((card: GiftCard) => (
                          <TableRow key={card.id} className="bg-[#F8F5E4] hover:bg-[#EADDCB]">
                            <TableCell className="bg-[#F8F5E4]">
                              <div className="flex items-center">
                                <span className="font-mono">{card.code}</span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => copyToClipboard(card.code)}
                                  className="ml-2 h-6 w-6"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="bg-[#F8F5E4]">₹{card.initialValue}</TableCell>
                            <TableCell className="bg-[#F8F5E4]">₹{card.currentBalance}</TableCell>
                            <TableCell className="bg-[#F8F5E4]">
                              {card.expiryDate ? 
                                format(new Date(card.expiryDate), 'dd MMM yyyy') : 
                                'No expiry'
                              }
                            </TableCell>
                            <TableCell className="bg-[#F8F5E4]">
                              <Badge 
                                variant={card.status === 'active' ? 'outline' : 'secondary'}
                                className={card.status === 'active' ? 'bg-green-50 text-green-700' : ''}
                              >
                                {card.status === 'active' ? 'Active' : 
                                 card.status === 'expired' ? 'Expired' : 
                                 card.status === 'used' ? 'Used' : card.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right bg-[#F8F5E4]">
                              <Button variant="ghost" size="sm">
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border shadow-sm bg-[#F8F5E4]">
                  <CardHeader>
                    <CardTitle>My Gift Cards</CardTitle>
                    <CardDescription>You don't have any gift cards yet</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="mx-auto bg-gray-100 rounded-full p-3 w-fit mb-3">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="text-md font-medium mb-2">No Gift Cards Found</h3>
                      <p className="text-sm text-muted-foreground mb-4">You haven't purchased or received any gift cards yet.</p>
                      <Button 
                        onClick={() => setShowBuyGiftCardDialog(true)}
                      >
                        Buy Your First Gift Card
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="how-it-works" className="space-y-6 mt-6">
              <Card className="border shadow-sm bg-[#F8F5E4]">
                <CardHeader>
                  <CardTitle>How Lelekart Gift Cards Work</CardTitle>
                  <CardDescription>Send and receive the perfect gift</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="border rounded-lg p-4 text-center bg-[#F8F5E4]">
                      <div className="bg-primary/10 rounded-full p-3 mx-auto w-fit mb-3">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium mb-2">1. Purchase a Gift Card</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose an amount between ₹500 and ₹10,000 and personalize your gift card.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 text-center bg-[#F8F5E4]">
                      <div className="bg-primary/10 rounded-full p-3 mx-auto w-fit mb-3">
                        <CopyCheck className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium mb-2">2. Share with Recipient</h3>
                      <p className="text-sm text-muted-foreground">
                        The recipient will receive the gift card code via email with your personal message.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 text-center bg-[#F8F5E4]">
                      <div className="bg-primary/10 rounded-full p-3 mx-auto w-fit mb-3">
                        <ShoppingCart className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-medium mb-2">3. Redeem &amp; Shop</h3>
                      <p className="text-sm text-muted-foreground">
                        Gift cards can be redeemed during checkout for any purchase on Lelekart.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-4 text-sm">
                    <div className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Gift cards are valid for 12 months from the date of purchase.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Gift cards can be used for multiple purchases until the balance is depleted.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Gift cards cannot be redeemed for cash or refunded.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Lost or stolen gift cards can be replaced with proof of purchase.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Check Balance Dialog */}
        <Dialog open={showCheckBalanceDialog} onOpenChange={setShowCheckBalanceDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Check Gift Card Balance</DialogTitle>
              <DialogDescription>
                Enter your gift card code to check its balance.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="gift-card-code">Gift Card Code</Label>
                <Input 
                  id="gift-card-code" 
                  placeholder="Enter 16-digit gift card code" 
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value)}
                />
              </div>
              
              {checkedCard && (
                <div className="border rounded-md p-4 bg-gray-50">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Initial Value:</span>
                      <span>₹{checkedCard.initialValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Current Balance:</span>
                      <span className="font-semibold">₹{checkedCard.currentBalance}</span>
                    </div>
                    {checkedCard.expiryDate && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Expires:</span>
                        <span>{format(new Date(checkedCard.expiryDate), 'dd MMM yyyy')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge 
                        variant={checkedCard.status === 'active' ? 'outline' : 'secondary'}
                        className={checkedCard.status === 'active' ? 'bg-green-50 text-green-700' : ''}
                      >
                        {checkedCard.status === 'active' ? 'Active' : 
                         checkedCard.status === 'expired' ? 'Expired' : 
                         checkedCard.status === 'used' ? 'Used' : checkedCard.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex space-x-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowCheckBalanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={checkBalance}>Check Balance</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Buy Gift Card Dialog */}
        <Dialog open={showBuyGiftCardDialog} onOpenChange={setShowBuyGiftCardDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Buy a Gift Card</DialogTitle>
              <DialogDescription>
                Send the perfect gift to friends and family.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="gift-card-amount">Gift Card Amount</Label>
                <div className="flex flex-wrap gap-2">
                  {[500, 1000, 2000, 5000, 10000].map((amount) => (
                    <Button 
                      key={amount}
                      type="button"
                      variant={giftCardAmount === amount ? "default" : "outline"}
                      onClick={() => setGiftCardAmount(amount)}
                      className="flex-1"
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input 
                  id="recipient-email" 
                  type="email"
                  placeholder="Enter recipient's email" 
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="recipient-name">Recipient Name (Optional)</Label>
                <Input 
                  id="recipient-name" 
                  placeholder="Enter recipient's name" 
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="personal-message">Personal Message (Optional)</Label>
                <Input 
                  id="personal-message" 
                  placeholder="Add a personal message" 
                  value={personalizedMessage}
                  onChange={(e) => setPersonalizedMessage(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="flex space-x-2 sm:justify-end">
              <Button variant="outline" onClick={() => setShowBuyGiftCardDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleBuyGiftCard}>Buy Gift Card (₹{giftCardAmount})</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </div>
  );
}