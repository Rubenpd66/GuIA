import "server-only";

/**
 * Whether AI feedback is switched on, read where pages are built. Without the key the feature
 * is neither offered nor advertised, so no plan promises something that does not work.
 */
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);
