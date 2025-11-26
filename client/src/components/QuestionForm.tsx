import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";

const questionFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().optional(),
  phone: z.string().optional(),
  category: z.enum(["general", "taxes", "property_rights", "services"]),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

const categoryLabels: Record<string, string> = {
  general: "General",
  taxes: "Taxes & Finances",
  property_rights: "Property Rights",
  services: "Village Services",
};

interface QuestionFormProps {
  question: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QuestionForm({
  question,
  isOpen,
  onClose,
  onSuccess,
}: QuestionFormProps) {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "ratelimit" | "error">("idle");

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      name: "",
      email: "",
      address: "",
      phone: "",
      category: "general",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const response = await apiRequest("POST", "/api/questions", {
        ...data,
        question,
      });
      return response.json();
    },
    onSuccess: () => {
      setSubmitStatus("success");
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      if (error.message?.includes("429")) {
        setSubmitStatus("ratelimit");
      } else {
        setSubmitStatus("error");
      }
    },
  });

  const onSubmit = (data: QuestionFormValues) => {
    setSubmitStatus("idle");
    mutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    setSubmitStatus("idle");
    mutation.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Submit Your Question
          </DialogTitle>
          <DialogDescription>
            We'll get back to you personally, and your question may help others in the community!
          </DialogDescription>
        </DialogHeader>

        {submitStatus === "success" ? (
          <div className="py-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-4">
              We've received your question and will get back to you soon. Your question may also be published to help other community members!
            </p>
            <Button onClick={handleClose} data-testid="button-close-question-success">
              Close
            </Button>
          </div>
        ) : submitStatus === "ratelimit" ? (
          <div className="py-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Too Many Requests</h3>
            <p className="text-muted-foreground mb-4">
              For security purposes, we limit submissions. Please try again in an hour.
            </p>
            <Button onClick={handleClose} data-testid="button-close-question-ratelimit">
              Close
            </Button>
          </div>
        ) : submitStatus === "error" ? (
          <div className="py-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Something Went Wrong</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't submit your question. Please try again later.
            </p>
            <Button onClick={() => setSubmitStatus("idle")} data-testid="button-question-try-again">
              Try Again
            </Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Category *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-question-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value} data-testid={`option-category-${value}`}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} data-testid="input-question-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="you@example.com" 
                        {...field} 
                        data-testid="input-question-email" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Address (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123 Main St, Wonder Lake, IL" 
                        {...field} 
                        data-testid="input-question-address" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="(815) 555-1234" 
                        {...field} 
                        data-testid="input-question-phone" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  data-testid="button-cancel-question"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={mutation.isPending}
                  data-testid="button-submit-question"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {mutation.isPending ? "Submitting..." : "Submit Question"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
