import PlatformAnalytics from './PlatformAnalytics';

export default function GeminiAnalytics() {
  return (
    <PlatformAnalytics
      platform="gemini"
      platformName="Google Gemini"
      platformColor="emerald"
      platformIcon={
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      }
    />
  );
}
