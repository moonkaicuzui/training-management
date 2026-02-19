/**
 * 5PRS Original Dashboard - iframe wrapper
 *
 * Embeds the original vanilla HTML/JS 5PRS Trainer Dashboard
 * within Q-TRAIN's layout for seamless navigation.
 */

export default function FivePrsOriginalDashboard() {
  return (
    <div className="-m-4 md:-m-6 -mb-20 md:-mb-6">
      <iframe
        src="/5prs-original/index.html"
        className="w-full border-0"
        style={{ height: 'calc(100vh - 4rem)' }}
        title="5PRS Trainer Dashboard"
      />
    </div>
  );
}
