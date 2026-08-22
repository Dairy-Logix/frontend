"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Loader2, Smartphone, Upload } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mobileAppsService, type MobileAppSlot } from "@/lib/api/services/mobile-apps.service";
import {
  isMobileAppUploadRunning,
  startMobileAppUpload,
  subscribeToMobileAppUploadStatus,
} from "@/lib/uploads/mobile-app-upload-manager";

const slots: Array<{ slot: MobileAppSlot; title: string; accept: string }> = [
  { slot: "store-android", title: "Store — Android", accept: ".apk" },
  { slot: "store-ios", title: "Store — iOS", accept: ".ipa" },
  { slot: "field-android", title: "Field — Android", accept: ".apk" },
  { slot: "field-ios", title: "Field — iOS", accept: ".ipa" },
];

export default function MobileAppsPage() {
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-mobile-apps"], queryFn: mobileAppsService.list });
  const [files, setFiles] = useState<Partial<Record<MobileAppSlot, File>>>({});
  const [versions, setVersions] = useState<Partial<Record<MobileAppSlot, string>>>({});
  const [, setUploadStatusVersion] = useState(0);
  useEffect(() => subscribeToMobileAppUploadStatus(() => setUploadStatusVersion((value) => value + 1)), []);
  const upload = useMutation({
    mutationFn: ({ slot }: { slot: MobileAppSlot }) => {
      const file = files[slot]; const version = versions[slot]?.trim();
      if (!file || !version) throw new Error("Select a file and enter its version");
      const started = startMobileAppUpload(slot, version, file);
      if (!started) return Promise.resolve(null);
      return Promise.resolve({ slot });
    },
    onSuccess: (result, variables) => {
      if (!result) return;
      queryClient.invalidateQueries({ queryKey: ["admin-mobile-apps"] });
      setFiles((old) => ({ ...old, [variables.slot]: undefined }));
      toast.info("Upload is running in the background.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Unable to start app upload"),
  });

  return <div className="space-y-6">
    <PageHeader title="Mobile Apps" description="Replace the four platform app files stored in R2. Files are not tenant-scoped." />
    {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div> :
      <div className="grid gap-6 md:grid-cols-2">
        {slots.map((definition) => {
          const current = data.find((app) => app.slot === definition.slot);
          const busy = (upload.isPending && upload.variables?.slot === definition.slot) || isMobileAppUploadRunning(definition.slot);
          return <Card key={definition.slot} className="glass">
            <CardHeader><div className="flex gap-3"><Smartphone className="h-6 w-6 text-primary" /><div>
              <CardTitle>{definition.title}</CardTitle>
              <CardDescription>{current ? `Current version ${current.version} · ${(current.fileSize / 1024 / 1024).toFixed(1)} MB` : "No app uploaded"}</CardDescription>
            </div></div></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Version</Label><Input placeholder="e.g. 1.2.0" value={versions[definition.slot] ?? ""} onChange={(e) => setVersions((old) => ({ ...old, [definition.slot]: e.target.value }))} /></div>
              <div className="space-y-2"><Label>App file ({definition.accept})</Label><Input type="file" accept={definition.accept} onChange={(e) => setFiles((old) => ({ ...old, [definition.slot]: e.target.files?.[0] }))} /></div>
              <div className="flex gap-2">
                <Button onClick={() => upload.mutate({ slot: definition.slot })} disabled={busy || !files[definition.slot] || !versions[definition.slot]?.trim()}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}{busy ? "Uploading..." : "Replace app"}
                </Button>
                {current && <Button asChild variant="outline"><a href={current.downloadUrl}><Download className="mr-2 h-4 w-4" />Download current</a></Button>}
              </div>
            </CardContent>
          </Card>;
        })}
      </div>}
  </div>;
}
