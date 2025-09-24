import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Brain, User, Target, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  goal: 'save' | 'invest' | 'pay_debt' | null;
  horizon: 'short' | 'medium' | 'long' | null;
  riskProfile: 'conservative' | 'moderate' | 'aggressive' | null;
}

interface AssessmentResult {
  riskProfile: 'Conservative' | 'Moderate' | 'Aggressive';
  timeHorizon: string;
  primaryGoal: string;
  assetPreference: string;
  incomeStability: string;
  score: number;
  completedAt: string;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AICoachProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl?: string;
}

export const AICoach = ({ isOpen, onClose, webhookUrl = 'https://n8n.srv1004834.hstgr.cloud/webhook/a7721317-edd1-4ffe-bcb7-3fa1e6845f82' }: AICoachProps) => {
  const [profile, setProfile] = useState<UserProfile>({
    goal: null,
    horizon: null,
    riskProfile: null
  });
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  
  // Load assessment results on mount
  useEffect(() => {
    const storedAssessment = localStorage.getItem('userAssessment');
    if (storedAssessment) {
      try {
        const assessment: AssessmentResult = JSON.parse(storedAssessment);
        setAssessmentResult(assessment);
        
        // Update profile based on assessment
        const newProfile = { ...profile };
        newProfile.riskProfile = assessment.riskProfile.toLowerCase() as 'conservative' | 'moderate' | 'aggressive';
        
        // Map time horizon from assessment
        if (assessment.timeHorizon.includes('1-3 years')) newProfile.horizon = 'short';
        else if (assessment.timeHorizon.includes('4-7 years')) newProfile.horizon = 'medium';
        else if (assessment.timeHorizon.includes('8+')) newProfile.horizon = 'long';
        
        setProfile(newProfile);
      } catch (error) {
        console.error('Error loading assessment:', error);
      }
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);

  // Set initial message based on assessment
  useEffect(() => {
    const initialMessage = assessmentResult
      ? {
          id: '1',
          content: `Hi! I'm your AI Finance Coach. I see you've completed our self-assessment - excellent! Based on your ${assessmentResult.riskProfile.toLowerCase()} risk profile and preference for ${assessmentResult.assetPreference.toLowerCase()}, I'm ready to provide personalized guidance.\n\nYour assessment shows you're focused on "${assessmentResult.primaryGoal.toLowerCase()}" with a ${assessmentResult.timeHorizon.toLowerCase()}. How can I help you with your financial goals today?`,
          sender: 'ai' as const,
          timestamp: new Date()
        }
      : {
          id: '1',
          content: "Hi! I'm your AI Finance Coach. I'll help you learn about personal finance through our interactive simulations. For the best personalized experience, I recommend taking our Self-Assessment Test first (available in the navigation). Otherwise, let me understand your goals better.\n\nWhat's your primary financial goal right now?",
          sender: 'ai' as const,
          timestamp: new Date()
        };
    
    setMessages([initialMessage]);
  }, [assessmentResult]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickSelect = (field: keyof UserProfile, value: string) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
    
    const message = `Selected: ${value.replace('_', ' ')}`;
    addMessage(message, 'user');
    
    // Generate follow-up based on what's missing
    setTimeout(() => {
      if (!newProfile.goal && field !== 'goal') {
        addMessage("Great! Now, what's your primary financial goal?", 'ai');
      } else if (!newProfile.horizon && field !== 'horizon') {
        addMessage("Perfect! What's your investment time horizon?", 'ai');
      } else if (!newProfile.riskProfile && field !== 'riskProfile') {
        addMessage("Excellent! How would you describe your risk tolerance?", 'ai');
      } else if (newProfile.goal && newProfile.horizon && newProfile.riskProfile) {
        generatePersonalizedAdvice(newProfile);
      }
    }, 500);
  };

  const generatePersonalizedAdvice = (userProfile: UserProfile) => {
    let advice = `Based on your profile (${userProfile.goal?.replace('_', ' ')}, ${userProfile.horizon}-term, ${userProfile.riskProfile}), here's what I recommend:\n\n`;
    
    if (userProfile.goal === 'save') {
      advice += "💰 **Saving Focus**: Start with our Credit simulator to understand how to optimize loan payments, then explore conservative investments in our Markets simulator.\n\n";
    } else if (userProfile.goal === 'invest') {
      advice += "📈 **Investment Focus**: Begin with our Markets simulator to practice with different asset classes based on your risk profile.\n\n";
    } else if (userProfile.goal === 'pay_debt') {
      advice += "💳 **Debt Management**: Our Credit simulator will show you powerful strategies for loan payoff and interest savings.\n\n";
    }

    if (userProfile.horizon === 'long' && userProfile.riskProfile === 'aggressive') {
      advice += "🚀 **Suggested Next Steps**: Try building a diversified portfolio in Markets with higher-growth assets like growth stocks and international ETFs.";
    } else if (userProfile.horizon === 'short' && userProfile.riskProfile === 'conservative') {
      advice += "🛡️ **Suggested Next Steps**: Focus on conservative investments and explore our Real Estate mortgage calculator for major purchases.";
    } else {
      advice += "⚖️ **Suggested Next Steps**: Start with a balanced approach in our Markets simulator, mixing stocks and bonds based on your preferences.";
    }

    addMessage(advice, 'ai');
  };

  const addMessage = (content: string, sender: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage.trim();
    setCurrentMessage('');
    addMessage(userMessage, 'user');
    setIsLoading(true);

    try {
      // Send to n8n webhook
      const payload = {
        userId: 'demo-user-' + Date.now(),
        message: userMessage,
        context: {
          goal: profile.goal,
          horizon: profile.horizon,
          riskProfile: profile.riskProfile,
          assessment: assessmentResult // Include assessment data
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // Try to read the response
      try {
        const responseData = await response.json();
        if (responseData.output) {
          addMessage(responseData.output, 'ai');
        } else {
          generateLocalResponse(userMessage);
        }
      } catch {
        // If we can't read response (due to CORS), use local fallback
        generateLocalResponse(userMessage);
      }

    } catch (error) {
      console.error('Webhook error:', error);
      generateLocalResponse(userMessage);
      toast({
        title: "Connection Notice",
        description: "Using local AI responses (webhook unavailable)",
        variant: "default"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalResponse = (userMessage: string) => {
    let response = "";
    
    // Use assessment data for personalized responses
    const riskLevel = assessmentResult?.riskProfile || profile.riskProfile || 'moderate';
    const assetPref = assessmentResult?.assetPreference || '';
    
    if (userMessage.toLowerCase().includes('market') || userMessage.toLowerCase().includes('stock')) {
      response = `Great question about markets! Given your ${riskLevel.toLowerCase()} risk profile${assetPref ? ` and preference for ${assetPref.toLowerCase()}` : ''}, our Markets simulator is perfect for you. You'll practice with assets that match your comfort level and learn how different market events affect your investments. Ready to try it?`;
    } else if (userMessage.toLowerCase().includes('real estate') || userMessage.toLowerCase().includes('house')) {
      response = `Real estate is a powerful wealth-building tool${assessmentResult?.primaryGoal.includes('home') ? ' - and I see that aligns with your goals!' : '!'} Our Real Estate section covers both home buying (mortgage calculations) and rental investing. Based on your profile, I'd recommend starting with the ${riskLevel === 'Conservative' ? 'mortgage calculator' : 'rental property simulator'}.`;
    } else if (userMessage.toLowerCase().includes('debt') || userMessage.toLowerCase().includes('loan')) {
      response = `Smart to focus on debt management! Our Credit simulator shows exactly how extra payments can save you thousands in interest. ${assessmentResult?.primaryGoal.includes('debt') ? 'This aligns perfectly with your stated goal of paying off debt.' : ''} You'll see the amortization schedule and learn optimization strategies.`;
    } else {
      response = assessmentResult 
        ? `Based on your assessment results, I'd recommend focusing on ${assessmentResult.assetPreference.toLowerCase()} investments with your ${assessmentResult.riskProfile.toLowerCase()} approach. Which simulator would you like to explore first?`
        : "I understand you want to learn more about personal finance. Our simulators provide hands-on experience with real scenarios. Which area interests you most: investing in markets, real estate, or managing credit?";
    }

    setTimeout(() => addMessage(response, 'ai'), 1000);
  };

  const isProfileComplete = profile.goal && profile.horizon && profile.riskProfile;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-hero">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span>AI Finance Coach</span>
          </DialogTitle>
        </DialogHeader>

        {/* Profile Status */}
        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
          {assessmentResult && (
            <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
              <CheckCircle2 className="w-3 h-3" />
              Assessment Complete
            </Badge>
          )}
          <Badge variant={profile.goal ? "default" : "outline"} className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            Goal: {profile.goal?.replace('_', ' ') || 'Not set'}
          </Badge>
          <Badge variant={profile.horizon ? "default" : "outline"} className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Horizon: {profile.horizon || 'Not set'}
          </Badge>
          <Badge variant={profile.riskProfile ? "default" : "outline"} className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Risk: {profile.riskProfile || 'Not set'}
          </Badge>
        </div>

        {/* Quick Selection Buttons */}
        {!isProfileComplete && (
          <div className="space-y-3">
            {!profile.goal && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Choose your goal:</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('goal', 'save')}>
                    Save Money
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('goal', 'invest')}>
                    Start Investing
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('goal', 'pay_debt')}>
                    Pay Off Debt
                  </Button>
                </div>
              </div>
            )}

            {profile.goal && !profile.horizon && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Time horizon:</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('horizon', 'short')}>
                    Short (1-3 years)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('horizon', 'medium')}>
                    Medium (3-10 years)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('horizon', 'long')}>
                    Long (10+ years)
                  </Button>
                </div>
              </div>
            )}

            {profile.goal && profile.horizon && !profile.riskProfile && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Risk tolerance:</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('riskProfile', 'conservative')}>
                    Conservative
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('riskProfile', 'moderate')}>
                    Moderate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleQuickSelect('riskProfile', 'aggressive')}>
                    Aggressive
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`p-2 rounded-full ${message.sender === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {message.sender === 'ai' ? (
                      <Brain className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`p-3 rounded-lg ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="p-2 rounded-full bg-primary text-primary-foreground">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="flex space-x-2">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask me anything about personal finance..."
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={!currentMessage.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};