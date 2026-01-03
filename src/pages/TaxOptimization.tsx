
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PageTransition from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { taxApi } from "@/services/api";

// Define the schema for portfolio entry validation
const portfolioItemSchema = z.object({
  type: z.string(),
  purchase_date: z.date(),
  purchase_price: z.number().positive(),
  current_price: z.number().positive(),
  quantity: z.number().positive(),
});

type PortfolioItem = z.infer<typeof portfolioItemSchema>;

const TaxOptimization = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Set up form with validation
  const form = useForm<PortfolioItem>({
    resolver: zodResolver(portfolioItemSchema),
    defaultValues: {
      type: "stock",
      purchase_price: 0,
      current_price: 0,
      quantity: 0,
    },
  });

  const onSubmit = (data: PortfolioItem) => {
    setPortfolioItems([...portfolioItems, data]);
    form.reset();
    toast.success("Portfolio item added");
  };

  const calculateTaxLiability = async () => {
    if (portfolioItems.length === 0) {
      toast.error("Please add at least one portfolio item");
      return;
    }

    setIsLoading(true);
    try {
      // Format items to send to API
      const formattedItems = portfolioItems.map(item => ({
        ...item,
        purchase_date: item.purchase_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      }));
      
      const result = await taxApi.calculateTaxLiability(formattedItems);
      setTaxSummary(result.tax_summary);
    } catch (error) {
      console.error("Tax calculation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="container py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-6 text-gradient">Tax Optimization</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add Portfolio Item</CardTitle>
                <CardDescription>
                  Enter your investment details to calculate potential tax liability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asset Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select asset type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="stock">Stocks</SelectItem>
                              <SelectItem value="mutual_fund">Mutual Funds</SelectItem>
                              <SelectItem value="crypto">Cryptocurrency</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="purchase_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Purchase Date</FormLabel>
                          <DatePicker 
                            date={field.value} 
                            setDate={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="purchase_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purchase Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="current_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Price</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              step="1" 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit">Add to Portfolio</Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Button 
              onClick={calculateTaxLiability} 
              className="w-full" 
              disabled={isLoading || portfolioItems.length === 0}
            >
              {isLoading ? "Calculating..." : "Calculate Tax Liability"}
            </Button>
          </div>
          
          {/* Results Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Items</CardTitle>
                <CardDescription>
                  {portfolioItems.length === 0 
                    ? "No items added yet" 
                    : `${portfolioItems.length} items in your portfolio`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioItems.length === 0 ? (
                  <div className="text-center p-6 text-muted-foreground">
                    Add items to your portfolio to see them here
                  </div>
                ) : (
                  <div className="space-y-4">
                    {portfolioItems.map((item, idx) => (
                      <Card key={idx} className="bg-card/50">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">
                                {item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ')}
                              </p>
                              <p className="text-muted-foreground text-sm">
                                Purchased: {item.purchase_date.toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p>${item.current_price} × {item.quantity}</p>
                              <p className="text-sm text-muted-foreground">
                                Total: ${(item.current_price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {taxSummary && (
                  <div className="mt-6 p-4 border rounded-lg bg-primary/5 space-y-2">
                    <h3 className="font-semibold text-lg">Tax Summary</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Short Term Gains:</p>
                      <p className="text-right">${taxSummary.short_term_gains.toFixed(2)}</p>
                      
                      <p>Long Term Gains:</p>
                      <p className="text-right">${taxSummary.long_term_gains.toFixed(2)}</p>
                      
                      <p>STT Tax:</p>
                      <p className="text-right">${taxSummary.stt_tax.toFixed(2)}</p>
                      
                      <p>LTCG Tax:</p>
                      <p className="text-right">${taxSummary.ltcg_tax.toFixed(2)}</p>
                      
                      <p className="font-semibold">Total Tax Liability:</p>
                      <p className="text-right font-semibold">${taxSummary.total_tax.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default TaxOptimization;
