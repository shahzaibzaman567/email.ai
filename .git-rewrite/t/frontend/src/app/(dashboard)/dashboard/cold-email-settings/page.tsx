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
import { Loader2, Mail, ExternalLink } from "lucide-react";

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

        {/* --- EMAIL ACCOUNT SECTION --- */}
        <Card className="border-blue-100 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" /> Your Email Account
            </CardTitle>
            <CardDescription>
              Connect your own email account (Gmail, Outlook, etc.) so emails are sent from your address.
              Every user must configure this before launching campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={formData.smtpHost || ""}
                  onChange={(e) => handleChange("smtpHost", e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={formData.smtpPort || 587}
                  onChange={(e) => handleChange("smtpPort", parseInt(e.target.value))}
                  placeholder="587"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-user">Email Address (SMTP User)</Label>
                <Input
                  id="smtp-user"
                  type="email"
                  value={formData.smtpUser || ""}
                  onChange={(e) => handleChange("smtpUser", e.target.value)}
                  placeholder="yourname@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-password">Password / App Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={formData.smtpPassword || ""}
                  onChange={(e) => handleChange("smtpPassword", e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="smtp-from">From Name / Address (optional)</Label>
                <Input
                  id="smtp-from"
                  value={formData.smtpFrom || ""}
                  onChange={(e) => handleChange("smtpFrom", e.target.value)}
                  placeholder="Your Name <yourname@gmail.com>"
                />
              </div>
            </div>

            {/* Gmail guide */}
            <div className="mt-2 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 p-4 text-sm space-y-2">
              <p className="font-semibold text-blue-800 dark:text-blue-300">📧 Using Gmail?</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
                <li>Enable 2-Step Verification in your Google Account.</li>
                <li>Go to <strong>Google Account → Security → App Passwords</strong>.</li>
                <li>Generate an App Password for "Mail" and paste it above (not your regular password).</li>
                <li>Set Host: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">smtp.gmail.com</code>, Port: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">587</code></li>
              </ol>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold mt-1"
              >
                Open Google App Passwords <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>

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
                <Label>Start Time</Label>
                <Input type="time" value={formData.scheduleStartTime || "09:00"} onChange={(e) => handleChange("scheduleStartTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={formData.scheduleEndTime || "17:00"} onChange={(e) => handleChange("scheduleEndTime", e.target.value)} />
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
