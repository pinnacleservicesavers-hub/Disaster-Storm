import ModuleAIAssistant from "@/components/ModuleAIAssistant";

export default function HomeownerPortal() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 p-10">
      <ModuleAIAssistant 
        moduleName="Homeowner Portal"
        moduleContext="Help homeowners upload damage photos/videos, track their insurance claims, communicate with contractors, and understand the restoration process. Use simple, reassuring language for people dealing with disaster stress."
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Homeowner Portal
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Upload photos/videos and track your claim timeline — coming soon.
          </p>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Features Coming Soon
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
              <li>Secure uploads by address</li>
              <li>Real-time storm events & status</li>
              <li>Direct messaging with your contractor</li>
              <li>Claim timeline tracking</li>
              <li>Document management</li>
              <li>Insurance claim status updates</li>
            </ul>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> This portal is currently in development. 
              Check back soon for updates!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
