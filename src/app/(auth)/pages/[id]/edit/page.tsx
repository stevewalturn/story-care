'use client';

import { ArrowLeft } from 'lucide-react';
import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageEditor } from '@/components/pages/PageEditor';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPut } from '@/utils/AuthenticatedFetch';

type Patient = {
  id: string;
  name: string;
};

type ContentBlock = {
  id: string;
  type: 'text' | 'image' | 'video' | 'quote' | 'scene' | 'reflection' | 'survey';
  order: number;
  content: any;
};

export default function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<{
    title: string;
    blocks: ContentBlock[];
    patientId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    if (!user) return;

    try {
      const response = await authenticatedFetch('/api/patients', user);
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]);
    }
  }, [user]);

  const fetchPage = useCallback(async () => {
    if (!user || !resolvedParams.id) return;

    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/pages/${resolvedParams.id}`, user);
      if (!response.ok) {
        throw new Error('Failed to fetch page');
      }

      const data = await response.json();
      const { page, blocks: dbBlocks } = data;

      // Get reflection block IDs
      const reflectionBlockIds = dbBlocks
        .filter((b: any) => b.blockType === 'reflection')
        .map((b: any) => b.id);

      // Get survey block IDs
      const surveyBlockIds = dbBlocks
        .filter((b: any) => b.blockType === 'survey')
        .map((b: any) => b.id);

      // Fetch reflection questions if any reflection blocks exist
      let reflectionQuestionsData: any[] = [];
      if (reflectionBlockIds.length > 0) {
        const questionsResponse = await authenticatedFetch(
          `/api/questions/reflection?blockIds=${reflectionBlockIds.join(',')}`,
          user,
        );
        if (questionsResponse.ok) {
          const questionsJson = await questionsResponse.json();
          reflectionQuestionsData = questionsJson.questions || [];
        }
      }

      // Fetch survey questions if any survey blocks exist
      let surveyQuestionsData: any[] = [];
      if (surveyBlockIds.length > 0) {
        const questionsResponse = await authenticatedFetch(
          `/api/questions/survey?blockIds=${surveyBlockIds.join(',')}`,
          user,
        );
        if (questionsResponse.ok) {
          const questionsJson = await questionsResponse.json();
          surveyQuestionsData = questionsJson.questions || [];
        }
      }

      // Fetch scene information for scene blocks
      const sceneBlockIds = dbBlocks
        .filter((b: any) => b.blockType === 'scene' && b.sceneId)
        .map((b: any) => b.sceneId);

      const scenesData: any = {};
      if (sceneBlockIds.length > 0) {
        for (const sceneId of sceneBlockIds) {
          try {
            const sceneResponse = await authenticatedFetch(`/api/scenes/${sceneId}`, user);
            if (sceneResponse.ok) {
              const sceneJson = await sceneResponse.json();
              scenesData[sceneId] = sceneJson.scene;
            }
          } catch (error) {
            console.error(`Failed to fetch scene ${sceneId}:`, error);
          }
        }
      }

      // Transform database blocks to PageEditor format
      const transformedBlocks: ContentBlock[] = dbBlocks.map((block: any) => {
        const baseBlock = {
          id: block.id,
          type: block.blockType,
          order: block.sequenceNumber,
          content: {
            text: block.textContent || undefined,
            sceneId: block.sceneId || undefined,
            mediaUrl: block.mediaUrl || undefined,
            ...(block.settings || {}),
          },
        };

        // Add scene information if this is a scene block
        if (block.blockType === 'scene' && block.sceneId && scenesData[block.sceneId]) {
          const scene = scenesData[block.sceneId];
          baseBlock.content.sceneTitle = scene.title;
          baseBlock.content.mediaUrl = scene.assembledVideoUrl || scene.thumbnailUrl || baseBlock.content.mediaUrl;
        }

        // Add reflection questions if this is a reflection block
        if (block.blockType === 'reflection') {
          const blockQuestions = reflectionQuestionsData
            .filter(q => q.blockId === block.id)
            .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
            .map(q => ({
              id: q.id,
              text: q.questionText,
              type: q.questionType,
              sequenceNumber: q.sequenceNumber,
            }));

          baseBlock.content.questions = blockQuestions.length > 0
            ? blockQuestions
            : [{ id: `q-default`, text: '', type: 'open_text', sequenceNumber: 0 }];
        }

        // Add survey questions if this is a survey block
        if (block.blockType === 'survey') {
          const blockQuestions = surveyQuestionsData
            .filter(q => q.blockId === block.id)
            .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
            .map(q => ({
              id: q.id,
              text: q.questionText,
              type: q.questionType,
              sequenceNumber: q.sequenceNumber,
              scaleMin: q.scaleMin,
              scaleMax: q.scaleMax,
              scaleMinLabel: q.scaleMinLabel,
              scaleMaxLabel: q.scaleMaxLabel,
              options: q.options,
            }));

          baseBlock.content.surveyQuestions = blockQuestions.length > 0
            ? blockQuestions
            : [{ id: `sq-default`, text: '', type: 'open_text', sequenceNumber: 0 }];
        }

        return baseBlock;
      });

      setPageData({
        title: page.title,
        blocks: transformedBlocks,
        patientId: page.patientId,
      });
    } catch (error) {
      console.error('Failed to load page:', error);
      setError('Failed to load page. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, resolvedParams.id]);

  useEffect(() => {
    if (user) {
      fetchPatients();
      fetchPage();
    }
  }, [user, fetchPatients, fetchPage]);

  const handleSavePage = async (title: string, blocks: any[], patientId: string | null) => {
    try {
      const response = await authenticatedPut(`/api/pages/${resolvedParams.id}`, user, {
        title,
        blocks,
        patientId,
      });

      if (!response.ok) {
        throw new Error('Failed to save page');
      }

      router.push('/pages');
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page. Please try again.');
    }
  };

  const handleClose = () => {
    router.push('/pages');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="mb-4 text-red-700">{error || 'Page not found'}</p>
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Pages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <PageEditor
        pageId={resolvedParams.id}
        initialTitle={pageData.title}
        initialBlocks={pageData.blocks}
        initialPatientId={pageData.patientId}
        patients={patients}
        onSave={handleSavePage}
        onClose={handleClose}
      />
    </div>
  );
}
