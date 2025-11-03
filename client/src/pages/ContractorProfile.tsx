import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ContractorLayout from "@/layouts/ContractorLayout";
import { User, Mail, Phone, MapPin, Award, Wrench } from "lucide-react";

export default function ContractorProfile() {
  // Placeholder data - in production this would come from API
  const profile = {
    name: 'John ProStorm',
    email: 'john@prostorm.com',
    phone: '+1 (305) 555-0123',
    company: 'ProStorm Restoration LLC',
    license: 'FL-CR-12345',
    address: 'Miami, FL 33139',
    certifications: ['OSHA Certified', 'IICRC Water Damage', 'Roofing Specialist'],
    specialties: ['Hurricane Damage', 'Water Damage', 'Roof Repair', 'Emergency Tarping'],
    totalJobs: 127,
    rating: 4.8,
  };

  return (
    <ContractorLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Contractor Profile
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Manage your professional information and credentials
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-xs">Name</div>
                <div className="font-medium text-gray-900 dark:text-gray-100" data-testid="text-profile-name">
                  {profile.name}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-xs">Company</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {profile.company}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{profile.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700 dark:text-gray-300">{profile.address}</span>
              </div>
            </div>
          </Card>

          {/* Professional Details */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Professional Details
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-xs">License Number</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {profile.license}
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-xs mb-2">Certifications</div>
                <div className="flex flex-wrap gap-2">
                  {profile.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-xs">Total Jobs</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {profile.totalJobs}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-xs">Rating</div>
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    ★ {profile.rating}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Specialties */}
          <Card className="p-6 space-y-4 md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Service Specialties
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty) => (
                <Badge
                  key={specialty}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            This is a placeholder page. In production, profile data would be fetched from /api/contractor/profile and be editable.
          </p>
        </div>
      </div>
    </ContractorLayout>
  );
}
