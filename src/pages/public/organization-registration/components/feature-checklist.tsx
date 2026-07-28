import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Feature } from "@/types/api";

export function FeatureChecklist({
  features,
  selectedFeatureIds,
  onChange,
}: {
  features: Feature[];
  selectedFeatureIds: string[];
  onChange: (featureIds: string[]) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requested Features</CardTitle>
        <CardDescription>Select modules needed for the organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((feature) => (
          <label key={feature._id} className="flex cursor-pointer gap-3 rounded-lg border p-3">
            <input
              className="mt-1 h-4 w-4 accent-primary"
              type="checkbox"
              checked={selectedFeatureIds.includes(feature._id)}
              onChange={(event) => {
                onChange(
                  event.target.checked
                    ? [...selectedFeatureIds, feature._id]
                    : selectedFeatureIds.filter((featureId) => featureId !== feature._id),
                );
              }}
            />
            <span>
              <span className="block font-semibold">{feature.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{feature.description}</span>
              {feature.enabledByDefault ? (
                <Badge className="mt-2" variant="secondary">
                  Default
                </Badge>
              ) : null}
            </span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
