"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/hooks/use-settings";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ColdEmailSettingsPage() {
  const { settings, isLoading, updateSettings } = useSettings();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(formData);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-slate-400" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Cold Email Settings</h1>
          <p className="text-slate-500 mt-2">Configure your global email sending preferences and schedules.</p>
        </div>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Groq API Settings</CardTitle>
            <CardDescription>
              We use Groq's high-speed model to generate personalized cold emails. You must set your own API key to use the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="groq-api-key">Groq API Key</Label>
              <Input
                id="groq-api-key"
                type="password"
                value={formData.groqApiKey || ""}
                onChange={(e) => handleChange("groqApiKey", e.target.value)}
                placeholder="e.g. gsk_AbCdEf..."
              />
              <p className="text-xs text-slate-500 mt-1">
                Don't have an API Key? Go to the{" "}
                <a
                  href="https://console.groq.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Groq Console
                </a>{" "}
                to create a free key and paste it here.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content & Style</CardTitle>
            <CardDescription>How should the AI write your emails?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service to pitch</Label>
                <Input value={formData.service || ""} onChange={(e) => handleChange("service", e.target.value)} placeholder="e.g. Web Development" />
              </div>
              <div className="space-y-2">
                <Label>Target Business</Label>
                <Input value={formData.targetBusiness || ""} onChange={(e) => handleChange("targetBusiness", e.target.value)} placeholder="e.g. Real Estate Agencies" />
              </div>
              <div className="space-y-2">
                <Label>Email Goal</Label>
                <Input value={formData.emailGoal || ""} onChange={(e) => handleChange("emailGoal", e.target.value)} placeholder="e.g. Book a call" />
              </div>
              <div className="space-y-2">
                <Label>Tone</Label>
                <Input value={formData.tone || ""} onChange={(e) => handleChange("tone", e.target.value)} placeholder="e.g. Professional, Friendly" />
              </div>
              <div className="space-y-2">
                <Label>Email Length</Label>
                <Select value={formData.emailLength || "Short"} onValueChange={(v) => handleChange("emailLength", v)}>
                  <SelectTrigger><SelectValue placeholder="Select length" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Short">Short (Under 100 words)</SelectItem>
                    <SelectItem value="Medium">Medium (100-200 words)</SelectItem>
                    <SelectItem value="Long">Long (Over 200 words)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Personalization Level</Label>
                <Select value={formData.personalizationLevel || "High"} onValueChange={(v) => handleChange("personalizationLevel", v)}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label>Call to Action (CTA)</Label>
              <Input value={formData.cta || ""} onChange={(e) => handleChange("cta", e.target.value)} placeholder="e.g. Are you available for a 10 min chat next week?" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Line Mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={formData.subjectMode || "ai_personalized"} onValueChange={(v) => handleChange("subjectMode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ai_personalized">AI Personalized per Lead</SelectItem>
                  <SelectItem value="same">Same Subject for Everyone</SelectItem>
                  <SelectItem value="custom">Custom AI Instruction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {formData.subjectMode === "same" && (
              <div className="space-y-2">
                <Label>Exact Subject Line</Label>
                <Input value={formData.sameSubject || ""} onChange={(e) => handleChange("sameSubject", e.target.value)} />
              </div>
            )}

            {formData.subjectMode === "custom" && (
              <div className="space-y-2">
                <Label>Custom Instruction for Subject</Label>
                <Input value={formData.customSubjectInstruction || ""} onChange={(e) => handleChange("customSubjectInstruction", e.target.value)} placeholder="e.g. Make it a question about their [Problem]" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Limits</CardTitle>
            <CardDescription>When should emails be sent?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Daily Limit (Emails)</Label>
                <Input type="number" value={formData.dailyLimit || 100} onChange={(e) => handleChange("dailyLimit", parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Start Hour (UTC)</Label>
                <Input type="number" min="0" max="23" value={formData.scheduleStartHour || 9} onChange={(e) => handleChange("scheduleStartHour", parseInt(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>End Hour (UTC)</Label>
                <Input type="number" min="0" max="23" value={formData.scheduleEndHour || 17} onChange={(e) => handleChange("scheduleEndHour", parseInt(e.target.value))} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signature</CardTitle>
            <CardDescription>Appended to every email.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              rows={4} 
              value={formData.emailSignature || ""} 
              onChange={(e) => handleChange("emailSignature", e.target.value)} 
              placeholder="Best regards,&#10;Shahzaib" 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
