import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ContractorLayout from "@/layouts/ContractorLayout";

export default function ContractorJobs() {
  // Placeholder data - in production this would come from API
  const jobs = [
    {
      id: 'A1',
      property: '123 Ocean Dr, Miami, FL 33139',
      status: 'in_progress',
      type: 'Hurricane Damage - Roof Repair',
      estimatedCost: 12500,
      dateCreated: '2024-10-15',
    },
    {
      id: 'A2',
      property: '456 Beach Ave, Tampa, FL 33602',
      status: 'lead',
      type: 'Storm Damage - Water Intrusion',
      estimatedCost: 8200,
      dateCreated: '2024-10-20',
    },
    {
      id: 'A3',
      property: '789 Coastal Blvd, Fort Lauderdale, FL 33301',
      status: 'complete',
      type: 'Wind Damage - Siding Replacement',
      estimatedCost: 15800,
      dateCreated: '2024-09-28',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lead': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'complete': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <ContractorLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Jobs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Track and manage your active jobs and leads
          </p>
        </div>

        <div className="grid gap-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`card-job-${job.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Job #{job.id}
                    </h3>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <div className="font-medium">{job.type}</div>
                    <div className="mt-1">{job.property}</div>
                  </div>

                  <div className="flex items-center gap-6 text-xs text-gray-500 dark:text-gray-500">
                    <div>
                      Estimated: <span className="font-semibold text-gray-900 dark:text-gray-100">
                        ${job.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      Created: {new Date(job.dateCreated).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <button
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                  data-testid={`button-view-${job.id}`}
                >
                  View Details →
                </button>
              </div>
            </Card>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            This is a placeholder page. In production, jobs would be fetched from the /api/jobs endpoint and display real data.
          </p>
        </div>
      </div>
    </ContractorLayout>
  );
}
