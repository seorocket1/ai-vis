import PlatformAnalytics from './PlatformAnalytics';

export default function PerplexityAnalytics() {
  return (
    <PlatformAnalytics
      platform="perplexity"
      platformName="Perplexity AI"
      platformColor="blue"
      platformIcon={
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
    />
  );
}
