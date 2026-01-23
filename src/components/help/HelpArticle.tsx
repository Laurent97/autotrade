import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, User, Shield, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HelpArticleProps {
  title: string;
  category: string;
  lastUpdated: string;
  readTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  children: React.ReactNode;
}

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
};

export default function HelpArticle({ 
  title, 
  category, 
  lastUpdated, 
  readTime, 
  difficulty, 
  children 
}: HelpArticleProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-card/50">
        <div className="container-wide max-w-4xl mx-auto px-4 py-4">
          <Link to="/help" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
        </div>
      </div>

      <main className="flex-1">
        <div className="container-wide max-w-4xl mx-auto px-4 py-8">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {category}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[difficulty]}`}>
                {difficulty}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{title}</h1>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {readTime} read
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Last updated {lastUpdated}
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {children}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 p-6 bg-card rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-4">Was this helpful?</h3>
            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Yes
              </Button>
              <Button variant="outline" size="sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                No
              </Button>
            </div>
          </div>

          {/* Related Articles */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Related Articles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Link to="/help/getting-started/setting-up-profile" className="p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors">
                <h4 className="font-medium mb-2">Setting up your profile</h4>
                <p className="text-sm text-muted-foreground">Complete your profile to get the most out of our platform</p>
              </Link>
              <Link to="/help/buying/how-to-search" className="p-4 bg-card rounded-lg border border-border hover:border-primary transition-colors">
                <h4 className="font-medium mb-2">How to search for products</h4>
                <p className="text-sm text-muted-foreground">Learn advanced search techniques to find exactly what you need</p>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
