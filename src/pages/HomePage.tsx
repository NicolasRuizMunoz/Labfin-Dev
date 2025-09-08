import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Home, CreditCard, PiggyBank, MessageCircle } from 'lucide-react';
import { AICoach } from '@/components/AICoach';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [showAICoach, setShowAICoach] = useState(false);

  const features = [
    {
      title: "Markets Simulator",
      description: "Practice investing in stocks, ETFs, mutual funds, and crypto with realistic market scenarios",
      icon: TrendingUp,
      href: "/markets",
      risk: "Variable",
      riskColor: "risk-medium"
    },
    {
      title: "Real Estate",
      description: "Explore mortgage calculations and rental property investment scenarios",
      icon: Home,
      href: "/real-estate",
      risk: "Medium",
      riskColor: "risk-medium"
    },
    {
      title: "Credit & Loans",
      description: "Understand loan amortization, interest calculations, and payment strategies",
      icon: CreditCard,
      href: "/credit",
      risk: "Low",
      riskColor: "risk-low"
    },
    {
      title: "Retirement Planning",
      description: "Comprehensive retirement planning tools and calculators",
      icon: PiggyBank,
      href: "/retirement",
      risk: "Coming Soon",
      riskColor: "muted",
      disabled: true
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 px-6">
        <div className="container max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
            Learn Finance by
            <span className="block bg-gradient-to-r from-financial-glow to-primary-glow bg-clip-text text-transparent">
              Simulating Real Decisions
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            Master personal finance through interactive simulations. Practice investing, real estate, credit management, and retirement planning in a risk-free environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
              onClick={() => setShowAICoach(true)}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start with AI Coach
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10"
              asChild
            >
              <Link to="/markets">Explore Markets</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Four Learning Modules
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Each module provides hands-on experience with real financial scenarios and educational feedback
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="group hover:shadow-elevated transition-all duration-300 bg-gradient-card border-0">
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`
                          ${feature.riskColor === 'risk-low' ? 'border-risk-low text-risk-low' : ''}
                          ${feature.riskColor === 'risk-medium' ? 'border-risk-medium text-risk-medium' : ''}
                          ${feature.riskColor === 'risk-high' ? 'border-risk-high text-risk-high' : ''}
                          ${feature.riskColor === 'muted' ? 'border-muted-foreground text-muted-foreground' : ''}
                        `}
                      >
                        {feature.risk}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="mt-2 text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                      asChild={!feature.disabled}
                      disabled={feature.disabled}
                    >
                      {feature.disabled ? (
                        <span>Coming Soon</span>
                      ) : (
                        <Link to={feature.href}>
                          Get Started
                        </Link>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Coach Modal */}
      {showAICoach && (
        <AICoach 
          isOpen={showAICoach}
          onClose={() => setShowAICoach(false)}
        />
      )}

      {/* Fixed AI Coach Button */}
      <Button
        onClick={() => setShowAICoach(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-elevated bg-gradient-hero hover:shadow-glow transition-all duration-300 z-50"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </div>
  );
};

export default HomePage;