'use client';

import { useState } from 'react';
import { TrendingUp, Quote, Lightbulb, Heart, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TranscriptAnalysisProps {
  sessionId: string;
  transcriptText: string;
}

interface AnalysisResult {
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
}

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
        return <TrendingUp className="w-4 h-4" />;
      case 'stable':
        return <Heart className="w-4 h-4" />;
      case 'concern':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
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
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyze Transcript
              </>
            )}
          </Button>
        )}
      </div>

      {error && !analysis && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Sentiment Analysis */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Heart className="w-4 h-4 text-indigo-600" />
              Sentiment Analysis
            </h4>
            <div className={`p-4 rounded-lg border ${getSentimentColor(analysis.sentiment.overall)}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium capitalize">
                  Overall: {analysis.sentiment.overall}
                </span>
                <span className="text-sm font-bold">
                  {Math.round(analysis.sentiment.score * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-green-700">Positive</span>
                    <span className="font-medium">{analysis.sentiment.breakdown.positive}%</span>
                  </div>
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{ width: `${analysis.sentiment.breakdown.positive}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700">Neutral</span>
                    <span className="font-medium">{analysis.sentiment.breakdown.neutral}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-gray-600 h-1.5 rounded-full"
                      style={{ width: `${analysis.sentiment.breakdown.neutral}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-red-700">Negative</span>
                    <span className="font-medium">{analysis.sentiment.breakdown.negative}%</span>
                  </div>
                  <div className="w-full bg-red-200 rounded-full h-1.5">
                    <div
                      className="bg-red-600 h-1.5 rounded-full"
                      style={{ width: `${analysis.sentiment.breakdown.negative}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Quotes */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Quote className="w-4 h-4 text-indigo-600" />
              Key Quotes
            </h4>
            <div className="space-y-3">
              {analysis.keyQuotes.map((quote, index) => (
                <div key={index} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-sm text-gray-900 italic mb-2">"{quote.text}"</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-indigo-700">— {quote.speaker}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{quote.significance}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Therapeutic Insights */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-600" />
              Therapeutic Insights
            </h4>
            <div className="space-y-2">
              {analysis.therapeuticInsights.map((insight, index) => (
                <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                      {insight.category}
                    </span>
                    {insight.timestamp && (
                      <span className="text-xs text-gray-500">{insight.timestamp}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-2">{insight.insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Progress Indicators
            </h4>
            <div className="space-y-2">
              {analysis.progressIndicators.map((indicator, index) => (
                <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getStatusColor(indicator.status)}`}>
                      {getStatusIcon(indicator.status)}
                      {indicator.status}
                    </span>
                    <span className="font-medium text-gray-900 text-sm">{indicator.indicator}</span>
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
                  className="px-3 py-2 bg-purple-50 text-purple-700 text-sm rounded-lg border border-purple-200"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Re-analyze Button */}
          <div className="pt-4 border-t border-gray-200">
            <Button variant="ghost" onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Re-analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
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
