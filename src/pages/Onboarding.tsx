
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the schema for a single investment
const investmentSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  amount: z.string().min(1, "Amount is required"),
  purchaseDate: z.date({
    required_error: "Purchase date is required",
  }),
});

// Define the schema for each investment category
const formSchema = z.object({
  stocks: z.array(investmentSchema).optional(),
  crypto: z.array(investmentSchema).optional(),
  mutualFunds: z.array(investmentSchema).optional(),
  gold: z.array(investmentSchema).optional(),
});

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("stocks");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with empty arrays for each investment type
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stocks: [],
      crypto: [],
      mutualFunds: [],
      gold: [],
    },
  });

  // Add a new investment to the current category
  const addInvestment = (category: 'stocks' | 'crypto' | 'mutualFunds' | 'gold') => {
    const currentInvestments = form.getValues(category) || [];
    form.setValue(category, [
      ...currentInvestments, 
      { company: "", amount: "", purchaseDate: new Date() }
    ]);
  };

  // Remove an investment from a category
  const removeInvestment = (category: 'stocks' | 'crypto' | 'mutualFunds' | 'gold', index: number) => {
    const currentInvestments = form.getValues(category) || [];
    const updatedInvestments = currentInvestments.filter((_, i) => i !== index);
    form.setValue(category, updatedInvestments);
  };

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Check if at least one investment has been added across all categories
    const hasAnyInvestment = Object.values(values).some(
      (investments) => investments && investments.length > 0
    );
    
    if (!hasAnyInvestment) {
      toast({
        title: "No investments added",
        description: "Please add at least one investment to continue.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    // In a real app, this would save to a database
    localStorage.setItem("investmentData", JSON.stringify(values));
    localStorage.setItem("isNewUser", "false");
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Profile Complete!",
        description: "Your investment profile has been set up successfully.",
      });
      
      setIsSubmitting(false);
      navigate("/"); // Redirect to dashboard
    }, 1500);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        <Card className="glass-panel w-full">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Set Up Your Investment Profile</CardTitle>
            <CardDescription className="text-center">
              Tell us about your existing investments. You need to add at least one investment to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4 mb-6">
                    <TabsTrigger value="stocks">Stocks</TabsTrigger>
                    <TabsTrigger value="crypto">Crypto</TabsTrigger>
                    <TabsTrigger value="mutualFunds">Mutual Funds</TabsTrigger>
                    <TabsTrigger value="gold">Gold</TabsTrigger>
                  </TabsList>
                  
                  {/* Stocks Tab */}
                  <TabsContent value="stocks" className="space-y-4">
                    {form.watch("stocks")?.map((_, index) => (
                      <div key={`stocks-${index}`} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Stock #{index + 1}</h4>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeInvestment('stocks', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`stocks.${index}.company`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., Apple Inc." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`stocks.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., $1,000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`stocks.${index}.purchaseDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Purchase Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => addInvestment('stocks')}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Stock
                    </Button>
                  </TabsContent>
                  
                  {/* Crypto Tab */}
                  <TabsContent value="crypto" className="space-y-4">
                    {form.watch("crypto")?.map((_, index) => (
                      <div key={`crypto-${index}`} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Crypto #{index + 1}</h4>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeInvestment('crypto', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`crypto.${index}.company`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Currency</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., Bitcoin, Ethereum" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`crypto.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., 0.5 BTC, 2 ETH" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`crypto.${index}.purchaseDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Purchase Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => addInvestment('crypto')}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Cryptocurrency
                    </Button>
                  </TabsContent>
                  
                  {/* Mutual Funds Tab */}
                  <TabsContent value="mutualFunds" className="space-y-4">
                    {form.watch("mutualFunds")?.map((_, index) => (
                      <div key={`mutualFunds-${index}`} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Mutual Fund #{index + 1}</h4>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeInvestment('mutualFunds', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`mutualFunds.${index}.company`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fund Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., Vanguard Growth Fund" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`mutualFunds.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., $5,000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`mutualFunds.${index}.purchaseDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Purchase Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => addInvestment('mutualFunds')}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Mutual Fund
                    </Button>
                  </TabsContent>
                  
                  {/* Gold Tab */}
                  <TabsContent value="gold" className="space-y-4">
                    {form.watch("gold")?.map((_, index) => (
                      <div key={`gold-${index}`} className="p-4 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium">Gold Investment #{index + 1}</h4>
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeInvestment('gold', index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`gold.${index}.company`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Type</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., Physical Gold, ETF" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`gold.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                  <Input placeholder="E.g., 10 grams, $3,000" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`gold.${index}.purchaseDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Purchase Date</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP")
                                        ) : (
                                          <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date()}
                                      initialFocus
                                      className="p-3 pointer-events-auto"
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => addInvestment('gold')}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Gold Investment
                    </Button>
                  </TabsContent>
                </Tabs>
                
                <CardFooter className="flex justify-end pt-4">
                  <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? "Setting Up Your Profile..." : "Complete Setup & Go to Dashboard"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Onboarding;
