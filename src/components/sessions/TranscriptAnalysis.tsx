'use client';

import { AlertCircle, Heart, Lightbulb, Loader2, Quote, Sparkles, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type TranscriptAnalysisProps = {
  sessionId: string;
  transcriptText: string;
};

type AnalysisResult = {
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
    breakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  keyQuotes: Array<{
    text: string;
    speaker: string;
    significance: string;
  }>;
  therapeuticInsights: Array<{
    category: string;
    insight: string;
    timestamp?: string;
  }>;
  progressIndicators: Array<{
    indicator: string;
    status: 'improving' | 'stable' | 'concern';
    description: string;
  }>;
  suggestedTopics: string[];
};

export function TranscriptAnalysis({ sessionId, transcriptText }: TranscriptAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          transcriptText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze transcript');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze transcript');
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'neutral':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'improving':
        return 'text-green-600 bg-green-50';
      case 'stable':
        return 'text-blue-600 bg-blue-50';
      case 'concern':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'improving':
        return <TrendingUp className="h-4 w-4" />;
      case 'stable':
        return <Heart className="h-4 w-4" />;
      case 'concern':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Analysis</h3>
            <p className="text-sm text-gray-600">Therapeutic insights and sentiment analysis</p>
          </div>
        </div>
        {!analysis && (
          <Button
            variant="primary"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !transcriptText}
          >
            {isAnalyzing
              ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                )
              : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Transcript
                  </>
                )}
          </Button>
        )}
      </div>

      {error && !analysis && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Sentiment Analysis */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium text-gray-900">
              <Heart className="h-4 w-4 text-purple-600" />
              Sentiment Analysis
            </h4>
            <div className={`rounded-lg border p-4 ${getSentimentColor(analysis.sentiment.overall)}`}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  Overall:
                  {' '}
                  {analysis.sentiment.overall}
                </span>
                <span className="text-sm font-bold">
                  {Math.round(analysis.sentiment.score * 100)}
                  %
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-green-700">Positive</span>
                    <span className="font-medium">
                      {analysis.sentiment.breakdown.positive}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-green-200">
                    <div
                      className="h-1.5 rounded-full bg-green-600"
                      style={{ width: `${analysis.sentiment.breakdown.positive}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-gray-700">Neutral</span>
                    <span className="font-medium">
                      {analysis.sentiment.breakdown.neutral}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-gray-600"
                      style={{ width: `${analysis.sentiment.breakdown.neutral}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-red-700">Negative</span>
                    <span className="font-medium">
                      {analysis.sentiment.breakdown.negative}
                      %
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-red-200">
                    <div
                      className="h-1.5 rounded-full bg-red-600"
                      style={{ width: `${analysis.sentiment.breakdown.negative}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Quotes */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium text-gray-900">
              <Quote className="h-4 w-4 text-purple-600" />
              Key Quotes
            </h4>
            <div className="space-y-3">
              {analysis.keyQuotes.map((quote, index) => (
                <div key={index} className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <p className="mb-2 text-sm text-gray-900 italic">
                    "
                    {quote.text}
                    "
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-purple-700">
                      —
                      {quote.speaker}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600">{quote.significance}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Therapeutic Insights */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium text-gray-900">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              Therapeutic Insights
            </h4>
            <div className="space-y-2">
              {analysis.therapeuticInsights.map((insight, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-start gap-3">
                    <span className="rounded bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                      {insight.category}
                    </span>
                    {insight.timestamp && (
                      <span className="text-xs text-gray-500">{insight.timestamp}</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{insight.insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 font-medium text-gray-900">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Progress Indicators
            </h4>
            <div className="space-y-2">
              {analysis.progressIndicators.map((indicator, index) => (
                <div key={index} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${getStatusColor(indicator.status)}`}>
                      {getStatusIcon(indicator.status)}
                      {indicator.status}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{indicator.indicator}</span>
                  </div>
                  <p className="text-sm text-gray-600">{indicator.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Topics */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Suggested Topics for Next Session</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.suggestedTopics.map((topic, index) => (
                <span
                  key={index}
                  className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Re-analyze Button */}
          <div className="border-t border-gray-200 pt-4">
            <Button variant="ghost" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing
                ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Re-analyzing...
                    </>
                  )
                : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Re-analyze Transcript
                    </>
                  )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
