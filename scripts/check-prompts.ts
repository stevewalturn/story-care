import { eq } from 'drizzle-orm';
import { db } from '../src/libs/DB';
import { moduleAiPromptsSchema } from '../src/models/Schema';

async function checkPrompts() {
  try {
    // Get all active prompts
    const allPrompts = await db
      .select({
        id: moduleAiPromptsSchema.id,
        name: moduleAiPromptsSchema.name,
        scope: moduleAiPromptsSchema.scope,
        category: moduleAiPromptsSchema.category,
        organizationId: moduleAiPromptsSchema.organizationId,
        createdBy: moduleAiPromptsSchema.createdBy,
      })
      .from(moduleAiPromptsSchema)
      .where(eq(moduleAiPromptsSchema.isActive, true));

    console.log(`\nTotal active prompts: ${allPrompts.length}\n`);

    // Group by scope
    const byScope = allPrompts.reduce((acc, p) => {
      acc[p.scope] = (acc[p.scope] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('By scope:');
    Object.entries(byScope).forEach(([scope, count]) => {
      console.log(`  ${scope}: ${count}`);
    });

    // Group by category
    const byCategory = allPrompts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nBy category:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    // List all system prompts
    const systemPrompts = allPrompts.filter(p => p.scope === 'system');
    console.log(`\nSystem prompts (${systemPrompts.length}):`);
    systemPrompts.forEach((p) => {
      console.log(`  - [${p.category}] ${p.name}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPrompts();
