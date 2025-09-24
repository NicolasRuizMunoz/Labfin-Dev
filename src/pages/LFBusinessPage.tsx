import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, FileText, Calculator, AlertTriangle, DollarSign, Building, Users } from 'lucide-react';
import { AICoach } from '@/components/AICoach';
import { useLanguage } from '@/contexts/LanguageContext';

const LFBusinessPage = () => {
  const { t } = useLanguage();
  const [showAICoach, setShowAICoach] = useState(false);

  const businessTopics = [
    {
      title: "Tax Forms & Deadlines",
      description: "Learn about essential business tax forms, filing deadlines, and requirements for small businesses.",
      icon: FileText,
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      content: [
        "Form 1040 Schedule C for sole proprietorships",
        "Form 1120S for S-Corporations", 
        "Form 1065 for partnerships",
        "Quarterly estimated tax payments (Form 1040ES)",
        "Annual filing deadlines and extensions"
      ]
    },
    {
      title: "Tax Deductions & Credits",
      description: "Discover business expenses you can deduct and tax credits available to small businesses.",
      icon: Calculator,
      color: "bg-green-500/10 text-green-600 border-green-200",
      content: [
        "Office expenses and home office deduction",
        "Business equipment and depreciation",
        "Travel and meal expenses",
        "Professional development and training",
        "Small business tax credits (R&D, Work Opportunity, etc.)"
      ]
    },
    {
      title: "Business Structure Tax Implications",
      description: "Understand how different business structures affect your tax obligations and benefits.",
      icon: Building,
      color: "bg-purple-500/10 text-purple-600 border-purple-200",
      content: [
        "Sole Proprietorship vs LLC vs Corporation",
        "Self-employment tax considerations",
        "Pass-through vs double taxation",
        "State tax requirements by business type",
        "When to consider changing business structure"
      ]
    },
    {
      title: "Payroll & Employee Taxes",
      description: "Navigate payroll taxes, employee classifications, and compliance requirements.",
      icon: Users,
      color: "bg-orange-500/10 text-orange-600 border-orange-200",
      content: [
        "Employee vs independent contractor classification",
        "Payroll tax calculations (FICA, FUTA, SUTA)",
        "Form W-2 and 1099 requirements",
        "Payroll tax deposit schedules",
        "State unemployment insurance requirements"
      ]
    },
    {
      title: "Record Keeping & Compliance",
      description: "Essential bookkeeping practices and compliance requirements for small businesses.",
      icon: AlertTriangle,
      color: "bg-red-500/10 text-red-600 border-red-200",
      content: [
        "Required business records and retention periods",
        "Expense tracking and receipt management",
        "Bank account separation best practices",
        "Sales tax collection and remittance",
        "Audit preparation and documentation"
      ]
    },
    {
      title: "Cash Flow & Financial Planning",
      description: "Basic financial planning concepts to help manage business cash flow and growth.",
      icon: DollarSign,
      color: "bg-teal-500/10 text-teal-600 border-teal-200",
      content: [
        "Cash flow forecasting basics",
        "Setting aside money for tax payments",
        "Business emergency fund planning",
        "Understanding profit vs cash flow",
        "Basic financial statements overview"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="py-20 px-6 text-center">
        <div className="container max-w-4xl mx-auto">
          <Badge variant="outline" className="mb-4 text-primary border-primary/30">
            Small Business Tax Education
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            LF Business
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Simplified tax guidance for small business owners. Learn about tax forms, deductions, 
            compliance requirements, and financial planning - all without the complexity of 
            accounting software.
          </p>
          <p className="text-lg text-primary font-semibold">
            Focus on growing your business, we'll help you understand the tax side.
          </p>
        </div>
      </section>

      {/* Business Topics Grid */}
      <section className="py-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Essential Business Tax Topics
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get practical guidance on the most important tax and financial topics for small businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <Card key={index} className="h-full hover:shadow-elevated transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-lg ${topic.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{topic.title}</CardTitle>
                    <CardDescription>{topic.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {topic.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm text-muted-foreground flex items-start">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-20 px-6 bg-gradient-card">
        <div className="container max-w-4xl mx-auto text-center">
          <Card className="bg-background/80 backdrop-blur-sm border-0 shadow-elevated">
            <CardContent className="py-12 px-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Need Personalized Tax Guidance?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Our AI coach can help answer specific questions about your business tax situation 
                and provide personalized recommendations based on your business type and needs.
              </p>
              <Button 
                size="lg"
                onClick={() => setShowAICoach(true)}
                className="bg-gradient-hero hover:shadow-glow transition-all duration-300"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ask Our Business Tax AI Coach
              </Button>
            </CardContent>
          </Card>
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

export default LFBusinessPage;