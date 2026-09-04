"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAiInstructions, useAiChat } from "@/hooks/use-ai-training";
import { toast } from "sonner";
import { Loader2, Send, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AiTrainingPage() {
  const { instructions, isLoading: loadingInstructions, addInstruction, deleteInstruction } = useAiInstructions();
  const { chatHistory, isLoading: loadingChat, sendMessage } = useAiChat();
  const [message, setMessage] = useState("");
  const [newRule, setNewRule] = useState("");

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    try {
      await sendMessage.mutateAsync({ message });
      setMessage("");
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    try {
      await addInstruction.mutateAsync({ instruction: newRule });
      setNewRule("");
    } catch (err) {
      toast.error("Failed to add rule");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Training</h1>
        <p className="text-slate-500 mt-2">Chat with the AI to refine its email writing style, or add strict rules manually.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chat Section */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>Training Chat</CardTitle>
            <CardDescription>Tell the AI how you want your emails to sound.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2">
              {loadingChat ? (
                <div className="flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
              ) : chatHistory?.length === 0 ? (
                <div className="text-center text-slate-500 my-10">No chat history. Start training!</div>
              ) : (
                chatHistory?.map((msg: any) => (
                  <div key={msg._id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-900"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-slate-100 text-slate-500 flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" /> AI is thinking...
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="E.g., Never use the word 'synergy'..." 
                disabled={sendMessage.isPending}
              />
              <Button type="submit" disabled={sendMessage.isPending || !message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Rules Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strict Instructions</CardTitle>
              <CardDescription>These rules are appended to every AI email generation prompt.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRule} className="flex gap-2 mb-6">
                <Input 
                  value={newRule} 
                  onChange={e => setNewRule(e.target.value)} 
                  placeholder="E.g., Always sign off with 'Cheers,'" 
                  disabled={addInstruction.isPending}
                />
                <Button type="submit" variant="secondary" disabled={addInstruction.isPending || !newRule.trim()}>
                  Add Rule
                </Button>
              </form>

              <div className="space-y-3">
                {loadingInstructions ? (
                  <Loader2 className="animate-spin text-slate-400" />
                ) : instructions?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No strict instructions active.</p>
                ) : (
                  instructions?.map((inst: any) => (
                    <div key={inst._id} className="flex items-start justify-between gap-4 p-3 bg-slate-50 rounded-md border">
                      <div>
                        <p className="text-sm text-slate-700">{inst.instruction}</p>
                        <Badge variant="outline" className="mt-2 text-xs">{inst.source}</Badge>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                        onClick={() => deleteInstruction.mutate(inst._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
