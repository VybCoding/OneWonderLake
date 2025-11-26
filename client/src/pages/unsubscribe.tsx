import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle, AlertCircle, Loader2, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import Footer from "@/components/Footer";

export default function UnsubscribePage() {
  const [, setLocation] = useLocation();
  const [urlParams, setUrlParams] = useState<{ token: string; type: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const type = params.get("type");
    
    if (token && type) {
      setUrlParams({ token, type });
    }
  }, []);

  const validateQuery = useQuery({
    queryKey: ["/api/unsubscribe/validate", urlParams?.token, urlParams?.type],
    queryFn: async () => {
      if (!urlParams) return null;
      const response = await fetch(
        `/api/unsubscribe/validate?token=${encodeURIComponent(urlParams.token)}&type=${encodeURIComponent(urlParams.type)}`
      );
      return response.json();
    },
    enabled: !!urlParams,
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!urlParams) throw new Error("Invalid parameters");
      const response = await apiRequest("POST", "/api/unsubscribe", {
        token: urlParams.token,
        type: urlParams.type,
      });
      return response.json();
    },
  });

  const handleUnsubscribe = () => {
    unsubscribeMutation.mutate();
  };

  const handleGoHome = () => {
    setLocation("/");
  };

  if (!urlParams) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <CardTitle>Invalid Unsubscribe Link</CardTitle>
              <CardDescription>
                This unsubscribe link appears to be invalid or incomplete. Please use the link provided in your email.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={handleGoHome} data-testid="button-go-home">
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (validateQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <CardTitle>Validating...</CardTitle>
              <CardDescription>
                Please wait while we verify your unsubscribe request.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!validateQuery.data?.valid) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle>Link Not Found</CardTitle>
              <CardDescription>
                This unsubscribe link is not valid or has expired. If you believe this is an error, please contact us.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={handleGoHome} data-testid="button-go-home-invalid">
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (validateQuery.data?.alreadyUnsubscribed) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle>Already Unsubscribed</CardTitle>
              <CardDescription>
                The email address {validateQuery.data.email} has already been unsubscribed from our communications.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={handleGoHome} data-testid="button-go-home-already">
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (unsubscribeMutation.isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <CardTitle>Successfully Unsubscribed</CardTitle>
              <CardDescription>
                You have been successfully unsubscribed from our communications. You will no longer receive emails from us regarding annexation updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                If you change your mind, you can always sign up again on our website.
              </p>
              <Button onClick={handleGoHome} data-testid="button-go-home-success">
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (unsubscribeMutation.isError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle>Something Went Wrong</CardTitle>
              <CardDescription>
                We couldn't process your unsubscribe request. Please try again or contact us for assistance.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <Button onClick={handleUnsubscribe} data-testid="button-retry-unsubscribe">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleGoHome} data-testid="button-go-home-error">
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <MailX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Unsubscribe from Communications</CardTitle>
            <CardDescription>
              You are about to unsubscribe the email address <strong>{validateQuery.data.email}</strong> from our annexation update communications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground bg-muted/30 rounded p-3">
              <p>After unsubscribing:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You will no longer receive emails about annexation updates</li>
                <li>Your contact information will remain on file but marked as unsubscribed</li>
                <li>You can re-subscribe anytime by signing up again on our website</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleGoHome} 
                className="flex-1"
                data-testid="button-cancel-unsubscribe"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUnsubscribe} 
                className="flex-1"
                disabled={unsubscribeMutation.isPending}
                data-testid="button-confirm-unsubscribe"
              >
                {unsubscribeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Unsubscribe"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
