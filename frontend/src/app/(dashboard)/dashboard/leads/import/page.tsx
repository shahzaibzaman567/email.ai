"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud, CheckCircle2, AlertCircle, FileX, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useValidateLeads, useCreateLeads, BulkValidateResult } from "@/hooks/use-leads";
import { toast } from "sonner";

export default function ImportLeadsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [validationResult, setValidationResult] = useState<BulkValidateResult | null>(null);

  const { mutateAsync: validateLeads, isPending: validating } = useValidateLeads();
  const { mutateAsync: importLeads, isPending: importing } = useCreateLeads();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setValidationResult(null);
    }
  };

  const handleParseAndValidate = () => {
    if (!file) return;
    setParsing(true);
      if (file.name.endsWith(".csv")) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            setParsing(false);
            try {
              const res = await validateLeads(results.data);
              setValidationResult(res);
              toast.success("Validation complete");
            } catch (err: any) {
              toast.error(err.message || "Validation failed");
            }
          },
          error: (err) => {
            setParsing(false);
            toast.error(`CSV Parsing error: ${err.message}`);
          }
        });
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = XLSX.utils.sheet_to_json(worksheet);
            setParsing(false);
            const res = await validateLeads(json);
            setValidationResult(res);
            toast.success("Validation complete");
          } catch (err: any) {
            setParsing(false);
            toast.error(err.message || "Excel Parsing/Validation failed");
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setParsing(false);
        toast.error("Unsupported file type");
      }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.valid.length === 0) return;
    try {
      const leadsToImport = validationResult.valid.map(v => v.data);
      const res = await importLeads(leadsToImport);
      toast.success(`Successfully imported ${res.imported} leads!`);
      router.push("/dashboard/leads");
    } catch (err: any) {
      toast.error(err.message || "Failed to import leads");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Import Leads</h1>
        <p className="text-slate-500 mt-2">Upload a CSV file containing your leads to add them to your pipeline.</p>
      </div>

      <div className="grid gap-6">
        {!validationResult ? (
          <Card className="border-dashed border-2 shadow-sm bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload your CSV or Excel file</h3>
              <p className="text-slate-500 max-w-md mb-8">
                Your file should have headers matching: email, firstName, lastName, businessName, website.
              </p>
              
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()} disabled={parsing || validating}>
                  Select File
                </Button>
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleFileUpload} 
                />
                {file && (
                  <Button onClick={handleParseAndValidate} disabled={parsing || validating}>
                    {(parsing || validating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Validate Leads
                  </Button>
                )}
              </div>
              {file && <p className="mt-4 text-sm font-medium text-slate-700">Selected: {file.name}</p>}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-emerald-700 flex items-center text-sm">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Valid Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-emerald-700">{validationResult.valid.length}</p>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-amber-700 flex items-center text-sm">
                    <AlertCircle className="mr-2 h-4 w-4" /> Duplicates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-amber-700">{validationResult.duplicates.length}</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-700 flex items-center text-sm">
                    <FileX className="mr-2 h-4 w-4" /> Invalid Rows
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-700">{validationResult.invalid.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Validation Summary</CardTitle>
                <CardDescription>Review the results before importing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {validationResult.invalid.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-700 mb-3 flex items-center"><FileX className="h-4 w-4 mr-2" /> Invalid Errors</h4>
                    <div className="bg-red-50 rounded-md p-4 max-h-60 overflow-y-auto text-sm space-y-2 border border-red-100">
                      {validationResult.invalid.slice(0, 20).map((inv, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 pb-2 border-b border-red-200 last:border-0 last:pb-0">
                          <Badge variant="outline" className="bg-white text-red-700 whitespace-nowrap self-start">Row {inv.row}</Badge>
                          <span className="text-red-600">{inv.reason}</span>
                        </div>
                      ))}
                      {validationResult.invalid.length > 20 && (
                        <p className="text-red-500 italic pt-2">...and {validationResult.invalid.length - 20} more errors</p>
                      )}
                    </div>
                  </div>
                )}

                {validationResult.duplicates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-amber-700 mb-3 flex items-center"><AlertCircle className="h-4 w-4 mr-2" /> Duplicates Skipped</h4>
                    <div className="bg-amber-50 rounded-md p-4 max-h-60 overflow-y-auto text-sm space-y-2 border border-amber-100">
                      {validationResult.duplicates.slice(0, 20).map((dup, i) => (
                        <div key={i} className="flex items-center gap-4 pb-2 border-b border-amber-200 last:border-0 last:pb-0">
                          <Badge variant="outline" className="bg-white text-amber-700 whitespace-nowrap">Row {dup.row}</Badge>
                          <span className="text-amber-800 font-medium">{dup.data?.email}</span>
                          <span className="text-amber-600 text-xs">{dup.reason}</span>
                        </div>
                      ))}
                      {validationResult.duplicates.length > 20 && (
                        <p className="text-amber-600 italic pt-2">...and {validationResult.duplicates.length - 20} more duplicates</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-6 border-t">
                  <Button variant="ghost" onClick={() => setValidationResult(null)}>
                    Back to Upload
                  </Button>
                  <Button 
                    onClick={handleImport} 
                    disabled={validationResult.valid.length === 0 || importing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Import {validationResult.valid.length} Leads <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
