import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThumbsUp, ThumbsDown, CheckCircle, AlertCircle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";

const interestFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(5, "Please enter your full address"),
  phone: z.string().optional(),
  notes: z.string().optional(),
  contactConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to be contacted to submit this form"
  }),
});

type InterestFormValues = z.infer<typeof interestFormSchema>;

interface InterestFormProps {
  source: "address_checker" | "tax_estimator";
  prefillAddress?: string;
  buttonVariant?: "default" | "outline" | "ghost";
  buttonSize?: "default" | "sm" | "lg";
  buttonClassName?: string;
  interested?: boolean; // true = interested in annexation, false = not interested
  latitude?: string; // Geocoded latitude for map display
  longitude?: string; // Geocoded longitude for map display
}

export default function InterestForm({
  source,
  prefillAddress = "",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  interested = true,
  latitude,
  longitude,
}: InterestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "duplicate" | "ratelimit" | "error">("idle");

  const form = useForm<InterestFormValues>({
    resolver: zodResolver(interestFormSchema),
    defaultValues: {
      name: "",
      email: "",
      address: prefillAddress,
      phone: "",
      notes: "",
      contactConsent: false,
    },
  });

  useEffect(() => {
    if (prefillAddress && form.getValues("address") !== prefillAddress) {
      form.setValue("address", prefillAddress);
    }
  }, [prefillAddress, form]);

  const mutation = useMutation({
    mutationFn: async (data: InterestFormValues) => {
      const response = await apiRequest("POST", "/api/interested", {
        ...data,
        source,
        interested,
        latitude: latitude || "",
        longitude: longitude || "",
      });
      return response.json();
    },
    onSuccess: () => {
      setSubmitStatus("success");
      form.reset();
    },
    onError: (error: any) => {
      if (error.message?.includes("409")) {
        setSubmitStatus("duplicate");
      } else if (error.message?.includes("429")) {
        setSubmitStatus("ratelimit");
      } else {
        setSubmitStatus("error");
      }
    },
  });

  const onSubmit = (data: InterestFormValues) => {
    setSubmitStatus("idle");
    mutation.mutate(data);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmitStatus("idle");
    mutation.reset();
  };

  const buttonLabel = interested ? "I'm Interested in Annexation" : "I'm NOT Interested in Annexation";
  const buttonIcon = interested ? <ThumbsUp className="w-4 h-4 mr-2" /> : <ThumbsDown className="w-4 h-4 mr-2" />;
  const dialogTitle = interested ? "Express Your Interest" : "Express Your Disinterest";
  const dialogDescription = interested 
    ? "Join our list of residents interested in voluntary annexation into the Village of Wonder Lake."
    : "Help us understand concerns about annexation. Your feedback is valuable to our community.";

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        className={buttonClassName}
        onClick={() => setIsOpen(true)}
        data-testid={interested ? "button-express-interest" : "button-express-disinterest"}
      >
        {buttonIcon}
        {buttonLabel}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>

          {submitStatus === "success" ? (
            <div className="py-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Thank You!</h3>
              <p className="text-muted-foreground mb-4">
                {interested 
                  ? "We've received your interest. A campaign representative will be in touch soon to discuss next steps."
                  : "We've recorded your feedback. Your voice matters in this important community discussion."
                }
              </p>
              <Button onClick={handleClose} data-testid="button-close-success">
                Close
              </Button>
            </div>
          ) : submitStatus === "duplicate" ? (
            <div className="py-6 text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">You're Already on Our List!</h3>
              <p className="text-muted-foreground mb-4">
                This email address has already been registered. Thank you for your continued interest in annexation!
              </p>
              <Button onClick={handleClose} data-testid="button-close-duplicate">
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
              <Button onClick={handleClose} data-testid="button-close-ratelimit">
                Close
              </Button>
            </div>
          ) : submitStatus === "error" ? (
            <div className="py-6 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Something Went Wrong</h3>
              <p className="text-muted-foreground mb-4">
                We couldn't process your request. Please try again later.
              </p>
              <Button onClick={() => setSubmitStatus("idle")} data-testid="button-try-again">
                Try Again
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} data-testid="input-name" />
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
                          data-testid="input-email" 
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
                      <FormLabel>Property Address *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="123 Main St, Wonder Lake, IL" 
                          {...field} 
                          data-testid="input-interest-address" 
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
                          data-testid="input-phone" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Questions or Comments (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any questions or concerns about annexation?"
                          className="resize-none"
                          {...field}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactConsent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-muted/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-consent"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          I consent to be contacted regarding annexation updates and information. *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <div className="text-xs text-muted-foreground bg-muted/20 rounded p-3 space-y-1">
                  <p className="font-medium">Privacy Notice:</p>
                  <p>Your information will not be sold or provided to any third party. We will only use your contact information to communicate updates about annexation. You may unsubscribe from our communications at any time.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={mutation.isPending}
                    data-testid="button-submit-interest"
                  >
                    {mutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
