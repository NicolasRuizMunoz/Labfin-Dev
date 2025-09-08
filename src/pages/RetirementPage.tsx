import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, Clock, TrendingUp, Settings } from 'lucide-react';

const RetirementPage = () => {
  return (
    <div className="container max-w-6xl mx-auto py-8 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-lg bg-muted/50 mr-3">
            <PiggyBank className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Retirement Planning
            <Badge variant="outline" className="ml-3 text-xs">
              Coming Soon
            </Badge>
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive retirement planning tools and calculators are currently in development
        </p>
      </div>

      {/* Coming Soon Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Retirement Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Calculate how much you need to save monthly to reach your retirement goals by target date
            </p>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              401(k) Optimizer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Maximize employer matching and understand the impact of different contribution levels
            </p>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-muted-foreground" />
              Social Security Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Estimate Social Security benefits and optimize claiming strategies for maximum lifetime value
            </p>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-muted-foreground" />
              IRA vs 401(k) Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Compare Traditional vs Roth options and understand tax implications of different accounts
            </p>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              Withdrawal Strategies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Learn about the 4% rule, sequence of returns risk, and optimal withdrawal strategies
            </p>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" />
              Catch-Up Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Understand age-50+ catch-up contribution limits and strategies for late-stage savers
            </p>
            <div className="mt-3">
              <Badge variant="outline" className="text-xs">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border-2 border-muted bg-muted/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <PiggyBank className="w-6 h-6 text-muted-foreground" />
            Retirement Planning Module
          </CardTitle>
          <CardDescription className="text-base">
            Our comprehensive retirement planning tools are currently in development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="max-w-2xl mx-auto">
            <p className="text-muted-foreground mb-4">
              We're building powerful retirement planning simulators that will help you:
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 text-sm text-left">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Calculate retirement savings needs based on lifestyle goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Optimize tax-advantaged account contributions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Model different market scenarios and their impact</span>
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Compare Traditional vs Roth contribution strategies</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Plan withdrawal strategies to minimize taxes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                  <span>Understand Social Security optimization</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              In the meantime, explore our other financial simulators:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <a href="/markets">Markets Simulator</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/real-estate">Real Estate Tools</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/credit">Credit Management</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RetirementPage;