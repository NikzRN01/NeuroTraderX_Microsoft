
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Send, Bot } from "lucide-react";
import { insightRecommendations } from "@/utils/mockData";

const AiRecommendation = () => {
  const { id } = useParams<{ id: string }>();
  const [userQuestion, setUserQuestion] = useState("");
  const [conversation, setConversation] = useState<{ role: "ai" | "user"; content: string; }[]>([]);

  // Find the recommendation by ID - convert id to string for proper comparison
  const recommendation = insightRecommendations.find(rec => rec.id.toString() === id) || {
    id: "unknown",
    title: "Unknown Recommendation",
    description: "Recommendation details not found",
    impact: "Medium",
    type: "Unknown"
  };

  const handleSendQuestion = () => {
    if (!userQuestion.trim()) return;
    
    // Add user question to conversation
    setConversation(prev => [...prev, { role: "user", content: userQuestion }]);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse = `Based on your question about "${recommendation.title}", I would recommend implementing this strategy because it aligns with your portfolio goals. This approach has shown positive results in similar market conditions.`;
      
      setConversation(prev => [...prev, { role: "ai", content: aiResponse }]);
      setUserQuestion("");
    }, 1000);
  };

  return (
    <div className="min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-2">
          <Link to="/" className="text-primary hover:text-primary/80 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gradient">AI Recommendation</h1>
        </div>

        <Card className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-medium">{recommendation.title}</h3>
              <span className={`text-xs px-2 py-1 rounded ${
                recommendation.impact === 'High' ? 'bg-red-500/20 text-red-400' : 
                recommendation.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 
                'bg-blue-500/20 text-blue-400'
              }`}>
                {recommendation.impact} Impact
              </span>
            </div>
            <p className="text-muted-foreground">{recommendation.description}</p>
            <div className="mt-3">
              <span className="text-xs bg-secondary px-2 py-1 rounded">{recommendation.type}</span>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h4 className="text-lg font-medium mb-4">Ask Questions About This Recommendation</h4>
            
            <div className="space-y-4 mb-4">
              {conversation.map((item, index) => (
                <div key={index} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-start max-w-[80%] ${item.role === "user" ? "flex-row-reverse" : ""}`}>
                    {item.role === "ai" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary mr-2">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div 
                      className={`glass-panel p-3 rounded-xl ${
                        item.role === "user" 
                          ? "bg-primary/10 border-primary/20" 
                          : "bg-secondary/50"
                      }`}
                    >
                      <div className="text-sm">{item.content}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask a question about this recommendation..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="resize-none"
                rows={3}
              />
              <Button onClick={handleSendQuestion} className="self-end" disabled={!userQuestion.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex justify-between">
          <Link to="/">
            <Button variant="outline">Return to Dashboard</Button>
          </Link>
          
          <Button variant="default">Implement Recommendation</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default AiRecommendation;
